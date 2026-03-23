import { useEffect, useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import {
    ClipboardList,
    Plus,
    Loader2,
    Users,
    BookOpen,
    CheckCircle2,
    Calendar,
    TrendingUp,
    MessageSquare,
    History,
    ArrowUpRight,
    X,
    Search,
    FileText,
    ClipboardCheck,
    FileSpreadsheet,
    FileType
} from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";
import SchoolLayout from "@/components/school/SchoolLayout";
import { toast } from "sonner";
import {
    Tooltip as UiTooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

type Assignment = {
    id: number;
    class_id: number;
    subject_id: number;
    school_classes: { name: string };
    subjects: { name: string };
};

type Student = {
    auth_id: string;
    full_name: string;
    avatar_url?: string;

    grades: any[];
};

import { useNavigate } from "react-router-dom";

export default function TeacherJournalPage() {
    const { userId } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState("");

    // Grade Form
    const [isGradeOpen, setIsGradeOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [newGrade, setNewGrade] = useState("5");
    const [newComment, setNewComment] = useState("");
    const [saving, setSaving] = useState(false);
    const [editingGradeId, setEditingGradeId] = useState<number | null>(null);

    const [gradesByStudent, setGradesByStudent] = useState<Record<string, any[]>>({});
    const [todayHomework, setTodayHomework] = useState<any>(null);

    // Bulk Mode
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [bulkGrades, setBulkGrades] = useState<Record<string, string>>({});
    const [bulkSaving, setBulkSaving] = useState(false);

    const filteredStudents = useMemo(() => {
        return students.filter(s =>
            s.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [students, searchQuery]);

    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [studentHistory, setStudentHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Quarter Analytics
    const [allHistGrades, setAllHistGrades] = useState<any[]>([]);
    const [statsLoading, setStatsLoading] = useState(false);

    const [activeTab, setActiveTabValue] = useState("journal");
    const [selectedQuarter, setSelectedQuarter] = useState("all");

    const quarters = [
        { id: "all", name: "Весь год", start: "2025-09-01", end: "2026-06-30" },
        { id: "1", name: "I четверть", start: "2025-09-01", end: "2025-10-31" },
        { id: "2", name: "II четверть", start: "2025-11-01", end: "2025-12-31" },
        { id: "3", name: "III четверть", start: "2026-01-01", end: "2026-03-31" },
        { id: "4", name: "IV четверть", start: "2026-04-01", end: "2026-06-30" },
    ];

    const exportToExcel = () => {
        if (!students.length) return;

        const assignment = assignments.find(a => a.id.toString() === selectedAssignmentId);
        const fileName = activeTab === "journal"
            ? `Журнал_${assignment?.school_classes.name}_${assignment?.subjects.name}_${selectedDate}.xlsx`
            : `Итоги_${assignment?.school_classes.name}_${assignment?.subjects.name}.xlsx`;

        let exportData = [];
        if (activeTab === "journal") {
            exportData = students.map(s => ({
                "Ученик": s.full_name,
                "Оценки": (gradesByStudent[s.auth_id] || []).map(g => g.grade).join(", "),
                "Дата": selectedDate,
                "Предмет": assignment?.subjects.name,
                "Класс": assignment?.school_classes.name
            }));
        } else {
            exportData = students.map(s => {
                const history = allHistGrades.filter(g => g.student_id === s.auth_id);
                const nums = history.map(g => parseInt(g.grade)).filter(n => !isNaN(n));
                const avg = nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length) : 0;
                return {
                    "Ученик": s.full_name,
                    "Средний балл": avg ? avg.toFixed(2) : "0",
                    "Всего оценок": history.length,
                    "Итоговая": avg ? Math.round(avg) : ""
                };
            });
        }

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Данные");
        XLSX.writeFile(wb, fileName);
        toast.success("Excel файл успешно создан");
    };

    const exportToPDF = () => {
        if (!students.length) return;
        const assignment = assignments.find(a => a.id.toString() === selectedAssignmentId);
        const doc = new jsPDF();

        const title = activeTab === "journal"
            ? `Журнал: ${assignment?.school_classes.name} - ${assignment?.subjects.name} (${selectedDate})`
            : `Итоговая успеваемость: ${assignment?.school_classes.name} - ${assignment?.subjects.name}`;

        doc.text(title, 14, 15);

        const head = activeTab === "journal"
            ? [['Ученик', 'Оценки', 'Дата']]
            : [['Ученик', 'Средний балл', 'Всего оценок', 'Итоговая']];

        const body = activeTab === "journal"
            ? students.map(s => [s.full_name, (gradesByStudent[s.auth_id] || []).map(g => g.grade).join(", "), selectedDate])
            : students.map(s => {
                const history = allHistGrades.filter(g => g.student_id === s.auth_id);
                const nums = history.map(g => parseInt(g.grade)).filter(n => !isNaN(n));
                const avg = nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length) : 0;
                return [s.full_name, avg ? avg.toFixed(2) : "0", history.length, avg ? Math.round(avg) : ""];
            });

        (doc as any).autoTable({
            head: head,
            body: body,
            startY: 20,
            styles: { fontSize: 10 },
        });

        doc.save(activeTab === "journal" ? "journal_report.pdf" : "finals_report.pdf");
        toast.success("PDF отчет успешно создан");
    };

    const fetchAllGrades = async () => {
        if (!selectedAssignmentId) return;
        const quarter = quarters.find(q => q.id === selectedQuarter);

        try {
            setStatsLoading(true);
            let query = supabase
                .from("grades")
                .select("*")
                .eq("teacher_assignment_id", parseInt(selectedAssignmentId));

            if (selectedQuarter !== "all" && quarter) {
                query = query.gte("date", quarter.start).lte("date", quarter.end);
            }

            const { data, error } = await query;
            if (error) throw error;
            setAllHistGrades(data || []);
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setStatsLoading(false);
        }
    };

    useEffect(() => {
        if (userId) fetchAssignments();
    }, [userId]);

    useEffect(() => {
        if (selectedAssignmentId && selectedDate) {
            fetchStudentsAndGrades(); // Renamed to fetchData in the instruction, but keeping original name for now
            fetchHomework();
        }
    }, [selectedAssignmentId, selectedDate]);

    const handleSaveBulk = async () => {
        if (!selectedAssignmentId || Object.keys(bulkGrades).length === 0) {
            setIsBulkMode(false);
            return;
        }

        try {
            setBulkSaving(true);
            const inserts = Object.entries(bulkGrades).map(([studentId, grade]) => ({
                student_id: studentId,
                teacher_assignment_id: parseInt(selectedAssignmentId),
                grade,
                date: selectedDate,
                comment: "Массовое выставление"
            }));

            const { error } = await supabase.from("grades").insert(inserts);
            if (error) throw error;

            toast.success(`Выставлено оценок: ${inserts.length}`);
            setBulkGrades({});
            setIsBulkMode(false);
            fetchStudentsAndGrades();
        } catch (error: any) {
            toast.error("Ошибка при сохранении: " + error.message);
        } finally {
            setBulkSaving(false);
        }
    };

    const fetchHomework = async () => {
        try {
            const { data } = await supabase
                .from("homework")
                .select("*")
                .eq("teacher_assignment_id", parseInt(selectedAssignmentId))
                .eq("due_date", selectedDate)
                .maybeSingle();
            setTodayHomework(data);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchAssignments = async () => {
        if (!userId) return;
        try {
            // Check if user is admin
            const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("auth_id", userId)
                .single();

            let query = supabase
                .from("teacher_assignments")
                .select("id, class_id, subject_id, school_classes(name), subjects(name)");

            if ((profile as any)?.role !== 'admin') {
                query = query.eq("teacher_id", userId);
            }

            const { data, error } = await query;

            if (error) throw error;
            setAssignments(data as any[] || []);
            if (data?.length) setSelectedAssignmentId(data[0].id.toString());
        } catch (error: any) {
            toast.error("Ошибка загрузки назначений: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentsAndGrades = async () => {
        const assignment = assignments.find(a => a.id.toString() === selectedAssignmentId);
        if (!assignment) return;

        try {
            setLoading(true);
            // 1. Get students for this class
            const { data: stdData } = await supabase
                .from("students_info")
                .select("student_id")
                .eq("class_id", assignment.class_id);

            const studentIds = (stdData || []).map(s => s.student_id);

            // Fetch profiles
            const { data: profiles } = await supabase
                .from("profiles")
                .select("auth_id, full_name, avatar_url")
                .in("auth_id", studentIds);

            const studentList = (stdData || []).map(s => {
                const p = profiles?.find(prof => prof.auth_id === s.student_id);
                return {
                    auth_id: s.student_id,
                    full_name: p?.full_name || "Ученик",
                    avatar_url: p?.avatar_url,
                    grades: []
                };
            });

            // 2. Get grades for this assignment and date
            const { data: grdData } = await supabase
                .from("grades")
                .select("*")
                .eq("teacher_assignment_id", assignment.id)
                .eq("date", selectedDate);

            // Match
            const results = studentList.map(s => ({
                ...s,
                grades: grdData?.filter(g => g.student_id === s.auth_id) || []
            }));

            setStudents(results as any[]);

            // Map for quick access
            const gMap: Record<string, any[]> = {};
            results.forEach(s => {
                gMap[s.auth_id] = s.grades;
            });
            setGradesByStudent(gMap);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async (student: Student) => {
        setSelectedStudent(student);
        setIsHistoryOpen(true);
        setHistoryLoading(true);
        try {
            const { data, error } = await supabase
                .from("grades")
                .select("*")
                .eq("student_id", student.auth_id)
                .eq("teacher_assignment_id", parseInt(selectedAssignmentId))
                .order("date", { ascending: false });

            if (error) throw error;
            setStudentHistory(data || []);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleAddGrade = async () => {
        if (!selectedStudent || !selectedAssignmentId) return;

        try {
            setSaving(true);

            if (editingGradeId) {
                const { error } = await supabase
                    .from("grades")
                    .update({
                        grade: newGrade,
                        comment: newComment,
                    })
                    .eq("id", editingGradeId);
                if (error) throw error;
                toast.success("Оценка обновлена");
            } else {
                const { error } = await supabase.from("grades").insert({
                    student_id: selectedStudent.auth_id,
                    teacher_assignment_id: parseInt(selectedAssignmentId),
                    grade: newGrade,
                    comment: newComment,
                    date: selectedDate
                });
                if (error) throw error;
                toast.success("Оценка выставлена");
            }

            setIsGradeOpen(false);
            setNewComment("");
            setEditingGradeId(null);
            fetchStudentsAndGrades();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    const deleteGrade = async (gradeId: number) => {
        if (!confirm("Удалить эту оценку?")) return;
        try {
            const { error } = await supabase.from("grades").delete().eq("id", gradeId);
            if (error) throw error;
            toast.success("Оценка удалена");

            // Refresh
            fetchStudentsAndGrades();
            if (activeTab === "finals") fetchAllGrades();
            if (selectedStudent) {
                // Re-fetch history for the selected student
                const { data } = await supabase
                    .from("grades")
                    .select("*")
                    .eq("student_id", selectedStudent.auth_id)
                    .eq("teacher_assignment_id", parseInt(selectedAssignmentId))
                    .order("date", { ascending: false });
                setStudentHistory(data || []);
            }
        } catch (error: any) {
            toast.error(error.message);
        }
    };

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

    const currentAssignment = assignments.find(a => a.id.toString() === selectedAssignmentId);
    const classAverage = useMemo(() => {
        const allNumeric = students.flatMap(s =>
            (gradesByStudent[s.auth_id] || [])
                .map(g => parseInt(g.grade))
                .filter(v => !isNaN(v))
        );
        if (!allNumeric.length) return null;
        return (allNumeric.reduce((a, b) => a + b, 0) / allNumeric.length).toFixed(2);
    }, [students, gradesByStudent]);

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

    return (
        <TooltipProvider>
            <SchoolLayout title="Журнал преподавателя">
                <Helmet>
                    <title>Журнал | {currentAssignment?.subjects.name || "Школа"}</title>
                </Helmet>

                <div className="space-y-8 pb-10">
                    {/* Header Controls */}
                    {/* Header Controls */}
                    <div className="flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center bg-background p-6 rounded-[24px] border border-border shadow-sm">
                        <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-1">Выбор дисциплины</Label>
                                <Select value={selectedAssignmentId} onValueChange={setSelectedAssignmentId}>
                                    <SelectTrigger className="w-full md:w-80 h-10 rounded-xl border border-border font-bold text-foreground bg-muted/50 shadow-sm group text-sm">
                                        <div className="flex items-center gap-2">
                                            <BookOpen className="w-4 h-4 text-primary" />
                                            <SelectValue placeholder="Выберите класс..." />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border p-1 bg-background shadow-lg">
                                        {assignments.map((a) => (
                                            <SelectItem key={a.id} value={a.id.toString()} className="h-10 rounded-lg font-medium px-3 hover:bg-muted text-sm">
                                                <div className="flex flex-col">
                                                    <span className="text-foreground">{a.school_classes.name} • {a.subjects.name}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-1">Дата занятия</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary z-10 pointer-events-none" />
                                    <Input
                                        type="date"
                                        value={selectedDate}
                                        onChange={e => setSelectedDate(e.target.value)}
                                        className="h-10 rounded-xl border font-bold text-foreground bg-muted/50 pl-10 w-full md:w-48 shadow-sm text-sm"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5 flex-1 md:flex-none">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-1">Поиск ученика</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                    <Input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Имя или фамилия..."
                                        className="pl-10 h-10 w-full md:w-64 rounded-xl border border-border bg-muted/30 font-medium text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 w-full xl:w-auto items-center">
                            <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl flex flex-col">
                                <span className="text-[9px] font-bold uppercase text-emerald-600 tracking-wider">Средний</span>
                                <span className="text-lg font-black text-emerald-700 leading-tight">{classAverage || "—"}</span>
                            </div>
                            <div className="bg-rose-50 border border-rose-100 px-4 py-2 rounded-xl flex flex-col">
                                <span className="text-[9px] font-bold uppercase text-rose-600 tracking-wider">Отсутствуют</span>
                                <span className="text-lg font-black text-rose-700 leading-tight">
                                    {students.filter(s => (gradesByStudent[s.auth_id] || []).some(g => g.grade === "Н")).length}
                                </span>
                            </div>
                            <div className="bg-amber-50 border border-amber-100 px-4 py-2 rounded-xl flex flex-col">
                                <span className="text-[9px] font-bold uppercase text-amber-600 tracking-wider">Опоздали</span>
                                <span className="text-lg font-black text-amber-700 leading-tight">
                                    {students.filter(s => (gradesByStudent[s.auth_id] || []).some(g => g.grade === "О")).length}
                                </span>
                            </div>
                        </div>
                    </div>

                    {todayHomework && (
                        <div className="bg-primary/5 border-2 border-primary/10 rounded-[28px] p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                <FileText className="w-7 h-7" />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h4 className="text-sm font-black text-primary uppercase tracking-widest mb-1">ДЗ на этот урок</h4>
                                <p className="text-lg font-black text-foreground">{todayHomework.title}</p>
                                <p className="text-sm font-bold text-muted-foreground italic mt-1 line-clamp-2">«{todayHomework.description}»</p>
                            </div>
                            <Button variant="outline" className="rounded-xl border-2 font-bold px-4 h-10 text-xs uppercase tracking-widest hidden md:flex" asChild>
                                <a href="/school/homework">Управление ДЗ</a>
                            </Button>
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-4">
                        <Tabs value={activeTab} onValueChange={value => {
                            setActiveTabValue(value);
                            if (value === "finals") fetchAllGrades();
                        }} className="w-full">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                                <TabsList className="bg-muted p-1 rounded-xl h-12">
                                    <TabsTrigger value="journal" className="rounded-lg px-6 font-bold h-10 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">Журнал</TabsTrigger>
                                    <TabsTrigger value="finals" className="rounded-lg px-6 font-bold h-10 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">Итоговые</TabsTrigger>
                                </TabsList>

                                <div className="flex flex-wrap gap-2">
                                    {activeTab === "finals" && (
                                        <Select value={selectedQuarter} onValueChange={(v) => {
                                            setSelectedQuarter(v);
                                            // fetchAllGrades is called by onValueChange of Tabs, but here we need to re-fetch too
                                            setTimeout(() => fetchAllGrades(), 0);
                                        }}>
                                            <SelectTrigger className="h-12 w-[180px] rounded-xl border-2 font-bold px-4 bg-background">
                                                <SelectValue placeholder="Выберите период" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {quarters.map(q => (
                                                    <SelectItem key={q.id} value={q.id}>{q.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                    <Button variant="outline" className="h-12 rounded-xl gap-2 font-bold px-4 border-2 text-sm bg-background hover:text-emerald-600 transition-colors" onClick={exportToExcel}>
                                        <FileSpreadsheet className="w-4 h-4" /> Excel
                                    </Button>
                                    <Button variant="outline" className="h-12 rounded-xl gap-2 font-bold px-4 border-2 text-sm bg-background hover:text-rose-600 transition-colors" onClick={exportToPDF}>
                                        <FileType className="w-4 h-4" /> PDF
                                    </Button>
                                </div>
                            </div>

                            <TabsContent value="journal" className="m-0 space-y-8">
                                {/* Students List */}
                                <Card className="border border-border rounded-[24px] overflow-hidden shadow-sm bg-background transition-all">
                                    <CardHeader className="p-6 border-b bg-muted/30">
                                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center text-primary shadow-sm">
                                                    <ClipboardList className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-foreground">Успеваемость</h3>
                                                    <CardDescription className="font-medium text-muted-foreground text-sm flex items-center gap-2">
                                                        Данные за {new Date(selectedDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                                                        <Badge className="bg-primary/10 text-primary border-0 rounded text-[10px] font-black uppercase tracking-wider px-1.5 py-0">LIVE</Badge>
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            <div className="flex gap-4">
                                                <span className="bg-background px-4 py-2 rounded-lg border border-border font-bold text-muted-foreground uppercase tracking-wider text-[9px] flex items-center gap-1.5">
                                                    <Users className="w-3.5 h-3.5" /> {students.length} Учеников
                                                </span>
                                                {isBulkMode ? (
                                                    <Button
                                                        onClick={handleSaveBulk}
                                                        disabled={bulkSaving}
                                                        className="h-10 rounded-xl gap-2 font-bold px-5 bg-emerald-600 hover:bg-emerald-700 shadow-md text-sm"
                                                    >
                                                        {bulkSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
                                                        Сохранить все
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        onClick={() => setIsBulkMode(true)}
                                                        variant="outline"
                                                        className="h-10 rounded-xl gap-2 font-bold px-5 border-2 text-sm hover:bg-muted"
                                                    >
                                                        <Plus className="w-4 h-4" /> Быстрое заполнение
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {loading ? (
                                            <div className="py-20 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                                                <Loader2 className="animate-spin w-10 h-10 text-primary" />
                                                <span className="font-bold uppercase tracking-wider text-[10px]">Загрузка...</span>
                                            </div>
                                        ) : filteredStudents.length === 0 ? (
                                            <div className="py-20 text-center space-y-4">
                                                <Search className="w-16 h-16 text-slate-50 mx-auto" />
                                                <p className="text-lg font-bold text-muted-foreground uppercase tracking-wider">Ничего не найдено</p>
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-muted/50">
                                                            <TableHead className="py-4 px-6 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Ученик</TableHead>
                                                            <TableHead className="py-4 px-6 font-bold text-[10px] uppercase tracking-wider text-muted-foreground text-center">Оценки на сегодня</TableHead>
                                                            <TableHead className="py-4 px-6 text-right font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Действие</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {filteredStudents.map((student: Student) => (
                                                            <TableRow key={student.auth_id} className="group hover:bg-muted/30 border-b border-slate-50 last:border-0 transition-all">
                                                                <TableCell className="py-4 px-6">
                                                                    <div className="flex items-center gap-4">
                                                                        <Avatar className="w-10 h-10 border-2 border-white shadow-sm rounded-xl">
                                                                            <AvatarImage src={student.avatar_url || ""} />
                                                                            <AvatarFallback className="font-bold bg-muted text-muted-foreground text-xs">
                                                                                {student.full_name?.[0]}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <div className="flex flex-col">
                                                                            <span className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">{student.full_name}</span>
                                                                            <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5">
                                                                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" /> Активен
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="py-4 px-6">
                                                                    <div className="flex flex-wrap justify-center gap-2">
                                                                        {isBulkMode ? (
                                                                            <div className="flex gap-1 bg-muted/50 p-1 rounded-xl border border-border">
                                                                                {["5", "4", "3", "2", "Зч", "Нз", "Н", "О"].map(v => (
                                                                                    <UiTooltip key={v}>
                                                                                        <TooltipTrigger asChild>
                                                                                            <button
                                                                                                onClick={() => setBulkGrades(prev => ({ ...prev, [student.auth_id]: v }))}
                                                                                                className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${bulkGrades[student.auth_id] === v
                                                                                                    ? `${getGradeColor(v)} text-white scale-110 shadow-md`
                                                                                                    : "hover:bg-background text-muted-foreground"
                                                                                                    }`}
                                                                                            >
                                                                                                {v}
                                                                                            </button>
                                                                                        </TooltipTrigger>
                                                                                        <TooltipContent className="rounded-lg font-bold text-[10px] px-2 py-1 bg-foreground text-background">
                                                                                            {gradeLabels[v]}
                                                                                        </TooltipContent>
                                                                                    </UiTooltip>
                                                                                ))}
                                                                            </div>
                                                                        ) : (
                                                                            (gradesByStudent[student.auth_id] || []).length > 0 ? (
                                                                                (gradesByStudent[student.auth_id] || []).map((grade) => (
                                                                                    <UiTooltip key={grade.id}>
                                                                                        <TooltipTrigger asChild>
                                                                                            <Badge
                                                                                                className={`${getGradeColor(grade.grade)} text-white border-0 min-w-[32px] h-8 flex items-center justify-center font-black text-sm rounded-lg shadow-sm hover:scale-110 transition-all cursor-pointer`}
                                                                                                onClick={() => {
                                                                                                    setSelectedStudent(student);
                                                                                                    setNewGrade(grade.grade);
                                                                                                    setNewComment(grade.comment || "");
                                                                                                    setEditingGradeId(grade.id);
                                                                                                    setIsGradeOpen(true);
                                                                                                }}
                                                                                            >
                                                                                                {grade.grade === "З" ? "Зч" : grade.grade === "Н/З" ? "Нз" : grade.grade}
                                                                                            </Badge>
                                                                                        </TooltipTrigger>
                                                                                        <TooltipContent className="rounded-lg font-bold text-xs px-3 py-1.5 bg-foreground text-background border-0 shadow-xl">
                                                                                            <div className="flex flex-col gap-0.5">
                                                                                                <span>{gradeLabels[grade.grade] || "Оценка"}</span>
                                                                                                {grade.comment && <span className="opacity-70 font-medium text-[10px]">Коммент: {grade.comment}</span>}
                                                                                            </div>
                                                                                        </TooltipContent>
                                                                                    </UiTooltip>
                                                                                ))
                                                                            ) : (
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="h-8 w-8 rounded-lg border-2 border-dashed border-slate-200 text-slate-300 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all"
                                                                                    onClick={() => {
                                                                                        setSelectedStudent(student);
                                                                                        setNewGrade("5");
                                                                                        setNewComment("");
                                                                                        setEditingGradeId(null);
                                                                                        setIsGradeOpen(true);
                                                                                    }}
                                                                                >
                                                                                    <Plus className="w-3.5 h-3.5" />
                                                                                </Button>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="py-4 px-6 text-right">
                                                                    <div className="flex justify-end gap-2">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all group-hover:bg-primary/5"
                                                                            onClick={() => fetchHistory(student)}
                                                                        >
                                                                            <History className="w-4 h-4" />
                                                                        </Button>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="finals" className="m-0 space-y-6">
                                <Card className="rounded-[24px] border shadow-sm overflow-hidden">
                                    <CardHeader className="bg-muted/30 p-6 border-b">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-background border flex items-center justify-center text-primary shadow-sm">
                                                    <TrendingUp className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black">Итоговая успеваемость</h3>
                                                    <p className="text-sm font-medium text-muted-foreground">Статистика за весь период обучения</p>
                                                </div>
                                            </div>

                                            {!statsLoading && allHistGrades.length > 0 && (
                                                <div className="flex gap-4">
                                                    <div className="bg-background px-4 py-2 rounded-xl border flex flex-col items-center min-w-[120px]">
                                                        <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-0.5">Средний по классу</span>
                                                        <span className="text-lg font-black text-primary">
                                                            {(allHistGrades.map(g => parseInt(g.grade)).filter(v => !isNaN(v)).reduce((a, b) => a + b, 0) / allHistGrades.map(g => parseInt(g.grade)).filter(v => !isNaN(v)).length || 0).toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="bg-background px-4 py-2 rounded-xl border flex flex-col items-center min-w-[120px]">
                                                        <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-0.5">Всего оценок</span>
                                                        <span className="text-lg font-black text-foreground">{allHistGrades.length}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {statsLoading ? (
                                            <div className="py-20 flex flex-col items-center justify-center gap-4">
                                                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                                <span className="font-bold uppercase tracking-wider text-[10px]">Расчет...</span>
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-muted/50">
                                                            <TableHead className="py-4 px-6 font-bold text-[10px] uppercase tracking-wider">Ученик</TableHead>
                                                            <TableHead className="py-4 px-6 text-center font-bold text-[10px] uppercase tracking-wider">Средний балл</TableHead>
                                                            <TableHead className="py-4 px-6 text-center font-bold text-[10px] uppercase tracking-wider">Всего оценок</TableHead>
                                                            <TableHead className="py-4 px-6 text-right font-bold text-[10px] uppercase tracking-wider">Результат</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {students.map(s => {
                                                            const history = allHistGrades.filter(g => g.student_id === s.auth_id);
                                                            const nums = history.map(g => parseInt(g.grade)).filter(n => !isNaN(n));
                                                            const avg = nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length) : 0;

                                                            return (
                                                                <TableRow key={s.auth_id} className="hover:bg-muted/30 transition-all border-b last:border-0 h-16">
                                                                    <TableCell className="px-6 font-bold text-sm">{s.full_name}</TableCell>
                                                                    <TableCell className="px-6 text-center">
                                                                        <Badge className={`${avg >= 4.5 ? "bg-emerald-500" : avg >= 3.5 ? "bg-primary/70" : avg >= 2.5 ? "bg-amber-500" : avg > 0 ? "bg-rose-500" : "bg-muted text-muted-foreground"} text-white border-0 font-black px-3 py-1 rounded-lg`}>
                                                                            {avg ? avg.toFixed(2) : "—"}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell className="px-6 text-center text-sm font-bold text-muted-foreground">
                                                                        {history.length}
                                                                    </TableCell>
                                                                    <TableCell className="px-6 text-right">
                                                                        <span className="text-xl font-black text-foreground">
                                                                            {avg ? Math.round(avg) : "—"}
                                                                        </span>
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
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>

                {/* Grade Modal */}
                <Dialog open={isGradeOpen} onOpenChange={setIsGradeOpen}>
                    <DialogContent className="rounded-[24px] border p-6 max-w-sm bg-background shadow-xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black mb-1">Оценка</DialogTitle>
                            <DialogDescription className="text-base font-medium text-muted-foreground flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-[10px] font-bold">
                                    {selectedStudent?.full_name[0]}
                                </span>
                                {selectedStudent?.full_name}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            <div className="space-y-3 text-center">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Выберите результат</Label>
                                <div className="grid grid-cols-4 gap-3">
                                    {["5", "4", "3", "2", "Зч", "Нз", "Н", "О"].map(num => (
                                        <UiTooltip key={num}>
                                            <TooltipTrigger asChild>
                                                <button
                                                    onClick={() => setNewGrade(num)}
                                                    className={`h-12 rounded-xl font-black text-xl transition-all shadow-sm ${newGrade === num
                                                        ? `${getGradeColor(num)} text-white scale-110 ring-[3px] ring-primary/10`
                                                        : "bg-muted text-muted-foreground hover:bg-muted hover:scale-105"
                                                        }`}
                                                >
                                                    {num}
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
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-1">Комментарий</Label>
                                <div className="relative">
                                    <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Комментарий..."
                                        value={newComment}
                                        onChange={e => setNewComment(e.target.value)}
                                        className="h-10 rounded-xl border font-medium px-9 focus:ring-2 focus:ring-primary/5 transition-all text-foreground text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                onClick={handleAddGrade}
                                disabled={saving}
                                className="w-full h-12 rounded-xl bg-foreground text-white font-bold text-lg shadow-lg shadow-slate-300/50 hover:translate-y-[-1px] active:translate-y-[0] transition-all"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Сохранить"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* History Modal */}
                <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                    <DialogContent className="rounded-[24px] border p-0 max-w-2xl bg-background overflow-hidden shadow-2xl">
                        <div className="h-24 bg-foreground flex items-center px-8 gap-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-5">
                                <TrendingUp className="w-24 h-24 text-white" />
                            </div>
                            <Avatar className="w-12 h-12 border-2 border-white/20 shadow-lg rounded-xl">
                                <AvatarImage src={selectedStudent?.avatar_url || ""} />
                                <AvatarFallback className="font-bold bg-background/10 text-white text-sm">
                                    {selectedStudent?.full_name?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <h4 className="text-xl font-black text-white">{selectedStudent?.full_name}</h4>
                                <p className="text-muted-foreground font-bold uppercase tracking-wider text-[9px] mt-0.5">
                                    История успеваемости • {currentAssignment?.subjects.name}
                                </p>
                            </div>
                        </div>

                        <div className="p-6">
                            {historyLoading ? (
                                <div className="py-20 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                                    <Loader2 className="animate-spin w-8 h-8 text-primary" />
                                    <span className="font-bold text-[10px] uppercase tracking-wider">Загрузка архива...</span>
                                </div>
                            ) : studentHistory.length === 0 ? (
                                <div className="py-20 text-center opacity-30">
                                    <History className="w-12 h-12 mx-auto mb-3" />
                                    <p className="font-bold text-sm">Оценок еще нет</p>
                                </div>
                            ) : (
                                <Tabs defaultValue="list" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50 p-1 h-11 rounded-xl">
                                        <TabsTrigger value="list" className="rounded-lg font-bold data-[state=active]:bg-background shadow-sm">Список</TabsTrigger>
                                        <TabsTrigger value="graph" className="rounded-lg font-bold data-[state=active]:bg-background shadow-sm">График</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="list" className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex flex-col items-center">
                                                <span className="text-[9px] font-black uppercase text-emerald-600 tracking-widest mb-1">Средний балл</span>
                                                <span className="text-2xl font-black text-emerald-700">
                                                    {(studentHistory.map(g => parseInt(g.grade)).filter(v => !isNaN(v)).reduce((a, b) => a + b, 0) / studentHistory.map(g => parseInt(g.grade)).filter(v => !isNaN(v)).length || 0).toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl flex flex-col items-center">
                                                <span className="text-[9px] font-black uppercase text-primary/60 tracking-widest mb-1">Всего оценок</span>
                                                <span className="text-2xl font-black text-primary">{studentHistory.length}</span>
                                            </div>
                                        </div>

                                        <div className="max-h-[350px] overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                                            {studentHistory.map((g) => (
                                                <div key={g.id} className="group relative flex items-center justify-between bg-muted p-4 rounded-2xl border border-border hover:bg-background hover:border-primary/20 transition-all">
                                                    <div className="flex gap-4 items-center">
                                                        <UiTooltip>
                                                            <TooltipTrigger asChild>
                                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-md cursor-help ${getGradeColor(g.grade)}`}>
                                                                    {g.grade === "З" ? "Зч" : g.grade === "Н/З" ? "Нз" : g.grade}
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top" className="font-bold">
                                                                {gradeLabels[g.grade]}
                                                            </TooltipContent>
                                                        </UiTooltip>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-foreground group-hover:text-primary transition-colors text-sm">
                                                                {new Date(g.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                                                            </span>
                                                            <p className="text-[11px] font-medium text-muted-foreground max-w-sm">
                                                                {g.comment ? `«${g.comment}»` : "Без комментария"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-50" onClick={() => deleteGrade(g.id)}>
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="graph" className="h-[400px] pt-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={[...studentHistory].reverse().map(g => ({
                                                date: new Date(g.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
                                                val: parseInt(g.grade)
                                            })).filter(d => !isNaN(d.val))}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                <XAxis dataKey="date" fontSize={10} fontWeight="bold" />
                                                <YAxis domain={[1, 5]} fontSize={10} fontWeight="bold" />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: 'none' }}
                                                    itemStyle={{ fontWeight: 'black', color: 'hsl(var(--primary))' }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="val"
                                                    stroke="hsl(var(--primary))"
                                                    strokeWidth={4}
                                                    dot={{ r: 6, strokeWidth: 2, fill: '#fff' }}
                                                    activeDot={{ r: 8, strokeWidth: 0 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </TabsContent>
                                </Tabs>
                            )}
                        </div>

                        <div className="bg-muted p-6 border-t border-border flex items-center justify-between">
                            <div className="flex gap-4">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Всего оценок</span>
                                    <span className="font-bold text-foreground text-sm">{studentHistory.length}</span>
                                </div>
                            </div>
                            <Button
                                className="h-10 rounded-xl gap-2 font-bold px-6 bg-background border border-border text-foreground hover:bg-muted transition-all shadow-sm text-sm"
                                onClick={() => {
                                    if (selectedStudent) {
                                        navigate(`/school/diary?studentId=${selectedStudent.auth_id}&date=${selectedDate}`);
                                    }
                                }}
                            >
                                Дневник <ArrowUpRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </SchoolLayout>
        </TooltipProvider>
    );
}
