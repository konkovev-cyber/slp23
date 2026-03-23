import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Download,
    Filter,
    Loader2,
    Award,
    Search,
    Eye,
    User,
    BookOpen,
    Calendar,
    MessageSquare,
    GraduationCap,
    Clock,
    X,
    ExternalLink,
    Plus,
    Trash2,
    Edit2
} from "lucide-react";
import SchoolLayout from "@/components/school/SchoolLayout";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tooltip as UiTooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import * as XLSX from 'xlsx';

export default function AdminGradesPage() {
    const gradeLabels: Record<string, string> = {
        "5": "Отлично",
        "4": "Хорошо",
        "3": "Удовлетворительно",
        "2": "Неудовлетворительно",
        "Зч": "Зачет",
        "З": "Зачет",
        "Нз": "Незачет",
        "Н/З": "Незачет",
        "Н": "Отсутствие",
        "О": "Опоздание"
    };

    const [loading, setLoading] = useState(true);
    const [grades, setGrades] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedGrade, setSelectedGrade] = useState<any>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState("all");

    useEffect(() => {
        fetchMetadata();
        fetchGrades();
    }, []);

    // Create/Edit Grade Form State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editMode, setEditMode] = useState<{ id: number } | null>(null);
    const [createLoading, setCreateLoading] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState("");
    const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
    const [newGradeValue, setNewGradeValue] = useState("5");
    const [newComment, setNewComment] = useState("");
    const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);

    // Data for selectors
    const [classStudents, setClassStudents] = useState<any[]>([]);
    const [classAssignments, setClassAssignments] = useState<any[]>([]);
    const [createDialogClass, setCreateDialogClass] = useState("");

    useEffect(() => {
        if (createDialogClass) {
            fetchClassDetails(createDialogClass);
        }
    }, [createDialogClass]);

    const fetchClassDetails = async (classId: string) => {
        try {
            // 1. Fetch Students
            const { data: stdRows, error: stdErr } = await supabase
                .from("students_info")
                .select("student_id")
                .eq("class_id", parseInt(classId));

            if (stdErr) throw stdErr;

            if (stdRows && stdRows.length > 0) {
                const studentIds = stdRows.map(r => r.student_id);
                const { data: profiles, error: pErr } = await supabase
                    .from("profiles")
                    .select("auth_id, full_name")
                    .in("auth_id", studentIds);

                if (pErr) throw pErr;
                setClassStudents(profiles || []);
            } else {
                setClassStudents([]);
                toast.warning("В этом классе нет учеников");
            }

            // 2. Fetch Assignments
            const { data: assignRows, error: aErr } = await supabase
                .from("teacher_assignments")
                .select("id, subject_id, teacher_id")
                .eq("class_id", parseInt(classId));

            if (aErr) throw aErr;

            if (assignRows && assignRows.length > 0) {
                const subIds = [...new Set(assignRows.map(a => a.subject_id))];
                const teacherIds = [...new Set(assignRows.map(a => a.teacher_id))];

                const [subsResult, profsResult] = await Promise.all([
                    supabase.from("subjects").select("id, name").in("id", subIds),
                    supabase.from("profiles").select("auth_id, full_name").in("auth_id", teacherIds)
                ]);

                const subMap = (subsResult.data || []).reduce((acc: any, s) => ({ ...acc, [s.id.toString()]: s.name }), {});
                const teacherMap = (profsResult.data || []).reduce((acc: any, p) => ({ ...acc, [p.auth_id as string]: p.full_name }), {});

                const merged = assignRows.map(a => ({
                    id: a.id,
                    subject_name: subMap[a.subject_id] || "Предмет #" + a.subject_id,
                    teacher_name: teacherMap[a.teacher_id] || "Учитель #" + a.teacher_id
                }));

                setClassAssignments(merged);
            } else {
                setClassAssignments([]);
            }
        } catch (error: any) {
            toast.error("Ошибка загрузки данных класса: " + error.message);
        }
    };

    const handleCreateGrade = async () => {
        if (!selectedStudentId || !selectedAssignmentId || !newGradeValue) {
            toast.error("Заполните все обязательные поля");
            return;
        }

        try {
            setCreateLoading(true);

            if (editMode) {
                const { error } = await supabase
                    .from("grades")
                    .update({
                        student_id: selectedStudentId,
                        teacher_assignment_id: parseInt(selectedAssignmentId),
                        grade: newGradeValue,
                        comment: newComment,
                        date: newDate
                    })
                    .eq("id", editMode.id);
                if (error) throw error;
                toast.success("Оценка обновлена");
            } else {
                const { error } = await supabase.from("grades").insert({
                    student_id: selectedStudentId,
                    teacher_assignment_id: parseInt(selectedAssignmentId),
                    grade: newGradeValue,
                    comment: newComment,
                    date: newDate
                });
                if (error) throw error;
                toast.success("Оценка добавлена");
            }

            setIsCreateOpen(false);
            resetCreateForm();
            fetchGrades();
        } catch (error: any) {
            toast.error("Ошибка: " + error.message);
        } finally {
            setCreateLoading(false);
        }
    };

    const handleDeleteGrade = async (id: number) => {
        if (!confirm("Вы уверены, что хотите удалить эту оценку?")) return;

        try {
            const { error } = await supabase.from("grades").delete().eq("id", id);
            if (error) throw error;

            toast.success("Оценка удалена");
            fetchGrades();
        } catch (error: any) {
            toast.error("Ошибка при удалении: " + error.message);
        }
    };

    const handleEditGrade = async (grade: any) => {
        // We need class_id to fill selectors
        const { data: stdInfo } = await supabase
            .from("students_info")
            .select("class_id")
            .eq("student_id", grade.student_id)
            .maybeSingle();

        if (stdInfo?.class_id) {
            setCreateDialogClass(stdInfo.class_id.toString());
            // wait for data fetch
            await fetchClassDetails(stdInfo.class_id.toString());
        }

        setSelectedStudentId(grade.student_id);
        setSelectedAssignmentId(grade.teacher_assignment_id.toString());
        setNewGradeValue(grade.grade);
        setNewComment(grade.comment || "");
        setNewDate(grade.date);
        setEditMode({ id: grade.id });
        setIsCreateOpen(true);
    };

    const resetCreateForm = () => {
        setSelectedStudentId("");
        setSelectedAssignmentId("");
        setNewGradeValue("5");
        setNewComment("");
        setCreateDialogClass("");
        setClassStudents([]);
        setClassAssignments([]);
        setEditMode(null);
    };

    const fetchMetadata = async () => {
        const { data } = await supabase.from("school_classes").select("*").order("name");
        setClasses(data || []);
    };

    const fetchGrades = async () => {
        try {
            setLoading(true);

            // Fetch grades with basic assignment info
            const { data: gradesData, error: gradesError } = await supabase
                .from("grades")
                .select(`
                    id,
                    grade,
                    comment,
                    date,
                    created_at,
                    student_id,
                    teacher_assignment_id
                `)
                .order("created_at", { ascending: false });

            if (gradesError) throw gradesError;

            // Fetch all assignments with subject info
            const { data: assignments } = await supabase
                .from("teacher_assignments")
                .select(`
                    id,
                    teacher_id,
                    subject:subjects(name)
                `);

            // Fetch all profiles (students and teachers)
            const { data: profiles } = await supabase
                .from("profiles")
                .select("auth_id, full_name, avatar_url");

            // Fetch student class info
            const { data: studentInfo } = await supabase
                .from("students_info")
                .select("student_id, school_classes(id, name)");

            // Enrich grades with all related data
            const enriched = (gradesData || []).map(g => {
                const assignment = assignments?.find(a => a.id === g.teacher_assignment_id);
                const student = profiles?.find(p => p.auth_id === g.student_id);
                const teacher = profiles?.find(p => p.auth_id === assignment?.teacher_id);
                const info = studentInfo?.filter(si => si.student_id === g.student_id);

                return {
                    ...g,
                    assignment: assignment ? {
                        ...assignment,
                        teacher: teacher ? {
                            full_name: teacher.full_name,
                            avatar_url: teacher.avatar_url
                        } : null
                    } : null,
                    student: student ? {
                        ...student,
                        info: info
                    } : null
                };
            });

            setGrades(enriched);
        } catch (error: any) {
            toast.error("Ошибка загрузки оценок: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredGrades = grades.filter(g => {
        const matchesSearch =
            g.student?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            g.assignment?.subject?.name?.toLowerCase().includes(searchQuery.toLowerCase());

        const studentInfo = g.student?.info?.[0];
        const studentClassId = studentInfo?.school_classes?.id?.toString();
        const matchesClass = selectedClass === "all" || studentClassId === selectedClass;

        return matchesSearch && matchesClass;
    });

    const getGradeColor = (grade: string) => {
        if (grade === "Зч" || grade === "З") return "bg-emerald-600 shadow-emerald-100";
        if (grade === "Нз" || grade === "Н/З") return "bg-rose-600 shadow-rose-100";
        if (grade === "Н") return "bg-rose-500 shadow-rose-100";
        if (grade === "О") return "bg-amber-400 shadow-amber-100";
        const val = parseInt(grade);
        if (val === 5) return "bg-emerald-500 shadow-emerald-100";
        if (val === 4) return "bg-primary/50 shadow-primary/10";
        if (val === 3) return "bg-amber-500 shadow-amber-100";
        if (val === 2) return "bg-rose-500 shadow-rose-100";
        return "bg-slate-400 shadow-muted/10";
    };

    const exportToExcel = () => {
        if (!filteredGrades.length) return;

        const fileName = `Оценки_Экспорт_${new Date().toISOString().split('T')[0]}.xlsx`;

        const data = filteredGrades.map(g => ({
            "Ученик": g.student?.full_name || "—",
            "Класс": g.student?.info?.[0]?.school_classes?.name || "—",
            "Предмет": g.assignment?.subject?.name || "—",
            "Учитель": g.assignment?.teacher?.full_name || "—",
            "Дата": g.date,
            "Оценка": g.grade === "З" ? "Зч" : g.grade === "Н/З" ? "Нз" : g.grade,
            "Комментарий": g.comment || ""
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Оценки");
        XLSX.writeFile(wb, fileName);
        toast.success("Данные экспортированы в Excel");
    };

    return (
        <TooltipProvider>
            <SchoolLayout title="Все оценки (Админ)">
                <Helmet>
                    <title>Журнал оценок | Админ-панель</title>
                </Helmet>

                <div className="space-y-6 pb-10">
                    {/* Search & Filter Header */}
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                        <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
                            <div className="relative w-full md:w-80 group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Поиск..."
                                    className="pl-10 h-10 rounded-xl border border-border shadow-sm font-medium text-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="w-full md:w-52">
                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger className="h-10 rounded-xl border border-border bg-background font-bold text-sm">
                                        <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                                        <SelectValue placeholder="Все классы" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border shadow-lg">
                                        <SelectItem value="all" className="font-bold">Все классы</SelectItem>
                                        {classes.map(c => (
                                            <SelectItem key={c.id} value={c.id.toString()} className="font-bold">
                                                Класс {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                className="h-10 rounded-xl gap-2 font-bold px-6 bg-primary shadow-md hover:translate-y-[-1px] transition-all text-sm"
                                onClick={() => setIsCreateOpen(true)}
                            >
                                <Plus className="w-4 h-4" /> Поставить оценку
                            </Button>
                            <Button
                                className="h-10 rounded-xl gap-2 font-bold px-6 bg-foreground shadow-md hover:translate-y-[-1px] transition-all text-sm"
                                onClick={exportToExcel}
                            >
                                <Download className="w-4 h-4" /> Экспорт
                            </Button>
                        </div>
                    </div>

                    <Card className="border border-border rounded-[24px] overflow-hidden shadow-sm bg-background hover:shadow-md transition-all">
                        <CardHeader className="p-6 border-b bg-muted/30">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center text-primary shadow-sm">
                                        <Award className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-black text-foreground tracking-tight">Ведомость оценок</CardTitle>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                            <p className="font-medium text-muted-foreground text-xs italic">Академические данные школы</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden md:flex gap-2">
                                    <Badge className="bg-foreground text-white rounded-lg px-3 py-1 font-bold uppercase text-[9px] tracking-widest shadow-none">
                                        {filteredGrades.length} записей
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="py-32 flex flex-col items-center justify-center gap-6 text-muted-foreground">
                                    <Loader2 className="animate-spin text-primary w-16 h-16" />
                                    <span className="font-black uppercase tracking-[0.3em] text-[11px]">Генерация отчета...</span>
                                </div>
                            ) : filteredGrades.length === 0 ? (
                                <div className="py-32 flex flex-col items-center justify-center gap-4">
                                    <Search className="w-20 h-20 text-slate-100" />
                                    <p className="text-xl font-black text-muted-foreground uppercase tracking-widest">Ничего не найдено</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/30">
                                                <TableHead className="py-4 px-6 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Ученик</TableHead>
                                                <TableHead className="py-4 px-6 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Класс</TableHead>
                                                <TableHead className="py-4 px-6 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Предмет</TableHead>
                                                <TableHead className="py-4 px-6 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Дата</TableHead>
                                                <TableHead className="py-4 px-6 font-bold text-[10px] uppercase tracking-wider text-muted-foreground text-center">Оценка</TableHead>
                                                <TableHead className="py-4 px-6 text-right font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Инфо</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredGrades.map((grade) => {
                                                const studentInfo = grade.student?.info?.[0];
                                                const className = studentInfo?.school_classes?.name;

                                                return (
                                                    <TableRow key={grade.id} className="group hover:bg-muted/50 border-b border-slate-50 last:border-0 transition-all">
                                                        <TableCell className="py-4 px-6">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="w-10 h-10 border-2 border-white shadow-sm rounded-xl">
                                                                    <AvatarImage src={grade.student?.avatar_url || ""} />
                                                                    <AvatarFallback className="font-bold bg-muted text-muted-foreground text-xs">
                                                                        {grade.student?.full_name?.[0]}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <Link
                                                                    to={`/school/profile?id=${grade.student?.auth_id}`}
                                                                    className="font-bold text-foreground text-sm hover:text-primary transition-colors cursor-pointer"
                                                                >
                                                                    {grade.student?.full_name || "Ученик"}
                                                                </Link>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-4 px-6">
                                                            {className ? (
                                                                <Badge variant="outline" className="px-2.5 py-0.5 rounded-lg font-bold text-emerald-600 bg-emerald-50 border-emerald-100 text-[10px]">
                                                                    {className}
                                                                </Badge>
                                                            ) : (
                                                                <span className="text-muted-foreground">—</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="py-4 px-6">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-foreground text-sm">{grade.assignment?.subject?.name || "Предмет"}</span>
                                                                <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                                                    {grade.assignment?.teacher?.full_name || "Учитель"}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-4 px-6">
                                                            <span className="text-[12px] font-medium text-muted-foreground tabular-nums">
                                                                {new Date(grade.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="py-4 px-6 text-center">
                                                            <div className={`inline-flex w-9 h-9 items-center justify-center rounded-lg text-white font-bold text-sm shadow-md transition-transform group-hover:scale-110 ${getGradeColor(grade.grade)}`}>
                                                                {grade.grade === "З" ? "Зч" : grade.grade === "Н/З" ? "Нз" : grade.grade}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-4 px-6 text-right">
                                                            <div className="flex justify-end gap-1.5">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                                                                    onClick={() => showDetails(grade)}
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                                                                    onClick={() => handleEditGrade(grade)}
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 rounded-lg hover:bg-rose-50 text-rose-500 hover:text-rose-600"
                                                                    onClick={() => handleDeleteGrade(grade.id)}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Grade Dialog */}
                <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                    <DialogContent className="rounded-[24px] border p-0 max-w-lg bg-background overflow-hidden shadow-2xl">
                        <div className="h-24 bg-muted flex items-center px-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 text-6xl font-black text-slate-100/50 select-none">
                                {selectedGrade?.grade}
                            </div>
                            <CardTitle className="text-xl font-black tracking-tight text-foreground">Детали оценки</CardTitle>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Student Info */}
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ученик</Label>
                                    <div className="flex items-center gap-3 bg-muted/50 p-3 rounded-2xl border border-border">
                                        <Avatar className="w-10 h-10 border-2 border-white shadow-sm rounded-xl">
                                            <AvatarImage src={selectedGrade?.student?.avatar_url || ""} />
                                            <AvatarFallback className="font-bold bg-background text-muted-foreground text-xs">
                                                {selectedGrade?.student?.full_name?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm text-foreground leading-tight">{selectedGrade?.student?.full_name}</span>
                                            <span className="text-[10px] font-medium text-muted-foreground">
                                                {selectedGrade?.student?.info?.[0]?.school_classes?.name || "Класс"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Предмет</Label>
                                    <div className="bg-muted/50 p-4 rounded-2xl border border-border h-full flex flex-col justify-center">
                                        <h4 className="text-base font-black text-foreground">{selectedGrade?.assignment?.subject?.name}</h4>
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
                                            {selectedGrade?.assignment?.teacher?.full_name}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-muted/50 p-4 rounded-2xl border border-border flex items-center justify-between">
                                        <span className="font-bold text-[10px] uppercase text-muted-foreground tracking-wider">Оценка</span>
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-md ${getGradeColor(selectedGrade?.grade)}`}>
                                            {selectedGrade?.grade}
                                        </div>
                                    </div>
                                    <div className="bg-muted/50 p-4 rounded-2xl border border-border flex items-center justify-between">
                                        <span className="font-bold text-[10px] uppercase text-muted-foreground tracking-wider">Дата</span>
                                        <span className="font-bold text-foreground text-xs tabular-nums">
                                            {selectedGrade?.date && new Date(selectedGrade.date).toLocaleDateString('ru-RU')}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                                    <Label className="text-[10px] font-bold uppercase text-primary/60 tracking-wider mb-2 block">Комментарий</Label>
                                    <p className="text-sm font-medium text-foreground italic">
                                        {selectedGrade?.comment ? `«${selectedGrade.comment}»` : "Комментарий не оставлен"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-muted p-6 border-t border-border flex gap-3">
                            <Button variant="ghost" className="flex-1 h-10 rounded-xl font-bold text-muted-foreground uppercase tracking-wider text-[10px]" onClick={() => setIsDetailsOpen(false)}>
                                Закрыть
                            </Button>
                            <Button
                                asChild
                                className="flex-1 h-10 rounded-xl bg-foreground text-white font-bold uppercase tracking-wider text-[10px] gap-2 shadow-md hover:bg-slate-800"
                            >
                                <Link to={`/school/profile?id=${selectedGrade?.student?.auth_id}`}>
                                    <User className="w-3.5 h-3.5" /> Профиль
                                </Link>
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
                {/* Create Grade Dialog */}
                <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetCreateForm(); }}>
                    <DialogContent className="rounded-[24px] border p-0 max-w-lg bg-background overflow-hidden shadow-2xl">
                        <div className="h-20 bg-muted flex items-center px-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 text-4xl font-black text-slate-100/50 select-none">
                                {editMode ? "EDIT" : "NEW"}
                            </div>
                            <CardTitle className="text-xl font-black tracking-tight text-foreground">
                                {editMode ? "Редактировать оценку" : "Выставить оценку"}
                            </CardTitle>
                        </div>

                        <div className="p-8 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Класс</Label>
                                    <Select value={createDialogClass} onValueChange={setCreateDialogClass}>
                                        <SelectTrigger className="h-10 rounded-xl border-border bg-muted/30 font-semibold text-sm">
                                            <SelectValue placeholder="Класс..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            {classes.map(c => (
                                                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Дата</Label>
                                    <Input
                                        type="date"
                                        value={newDate}
                                        onChange={e => setNewDate(e.target.value)}
                                        className="h-10 rounded-xl border-border bg-muted/30 font-semibold text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Ученик</Label>
                                <Select value={selectedStudentId} onValueChange={setSelectedStudentId} disabled={!createDialogClass}>
                                    <SelectTrigger className="h-10 rounded-xl border-border bg-muted/30 font-semibold text-sm">
                                        <SelectValue placeholder={createDialogClass ? "Выберите ученика..." : "Сначала выберите класс"} />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {classStudents.map(s => (
                                            <SelectItem key={s.auth_id} value={s.auth_id}>{s.full_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Предмет и Преподаватель</Label>
                                <Select value={selectedAssignmentId} onValueChange={setSelectedAssignmentId} disabled={!createDialogClass}>
                                    <SelectTrigger className="h-10 rounded-xl border-border bg-muted/30 font-semibold text-sm">
                                        <SelectValue placeholder={createDialogClass ? "Выберите предмет..." : "Сначала выберите класс"} />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {classAssignments.map(a => (
                                            <SelectItem key={a.id} value={a.id.toString()}>
                                                {a.subject_name} ({a.teacher_name})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1 text-center block">Оценка</Label>
                                <div className="grid grid-cols-4 gap-2">
                                    {["5", "4", "3", "2", "Зч", "Нз", "Н", "О"].map(num => (
                                        <UiTooltip key={num}>
                                            <TooltipTrigger asChild>
                                                <button
                                                    type="button"
                                                    onClick={() => setNewGradeValue(num)}
                                                    className={`h-12 rounded-xl font-black text-sm transition-all shadow-sm ${newGradeValue === num
                                                        ? `${getGradeColor(num)} text-white scale-110 ring-4 ring-primary/10`
                                                        : "bg-muted text-muted-foreground hover:bg-muted/70 hover:scale-105"
                                                        }`}
                                                >
                                                    {num === "З" ? "ЗАЧ" : num === "Н/З" ? "Н/З" : num}
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent className="font-bold">
                                                {gradeLabels[num]}
                                            </TooltipContent>
                                        </UiTooltip>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Комментарий (необязательно)</Label>
                                <div className="relative">
                                    <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Например: Ответ у доски..."
                                        value={newComment}
                                        onChange={e => setNewComment(e.target.value)}
                                        className="pl-10 h-10 rounded-xl border-border bg-muted/30 font-medium text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-muted p-6 border-t border-border flex gap-3">
                            <Button variant="ghost" className="flex-1 h-12 rounded-xl font-bold text-muted-foreground uppercase tracking-wider text-[11px]" onClick={() => setIsCreateOpen(false)}>
                                Отмена
                            </Button>
                            <Button
                                className="flex-1 h-12 rounded-xl bg-primary text-white font-bold uppercase tracking-wider text-[11px] shadow-lg hover:translate-y-[-1px] transition-all"
                                onClick={handleCreateGrade}
                                disabled={createLoading}
                            >
                                {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Сохранить"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

            </SchoolLayout>

        </TooltipProvider>
    );
}
