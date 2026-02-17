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
    ExternalLink
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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function AdminGradesPage() {
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
        const val = parseInt(grade);
        if (val === 5) return "bg-emerald-500 shadow-emerald-100";
        if (val === 4) return "bg-blue-500 shadow-blue-100";
        if (val === 3) return "bg-amber-500 shadow-amber-100";
        if (val === 2) return "bg-rose-500 shadow-rose-100";
        return "bg-slate-400 shadow-slate-100";
    };

    const showDetails = (grade: any) => {
        setSelectedGrade(grade);
        setIsDetailsOpen(true);
    };

    const handleSeedData = async () => {
        try {
            setLoading(true);
            toast.loading("Создание тестовых данных...");

            // 1. Ensure Class '9-А' exists
            let classId;
            const { data: cls } = await supabase.from("school_classes").select("id").eq("name", "9-А").maybeSingle();
            if (cls) {
                classId = cls.id;
            } else {
                const { data: newCls } = await supabase.from("school_classes").insert({ name: "9-А" }).select("id").single();
                classId = newCls?.id;
            }

            // 2. Ensure Subjects
            const subjectsList = ["Математика", "Русский язык", "Литература", "История", "Физика", "Информатика"];
            const subjectIds: Record<string, number> = {};

            for (const name of subjectsList) {
                const { data: sub } = await supabase.from("subjects").select("id").eq("name", name).maybeSingle();
                if (sub) {
                    subjectIds[name] = sub.id;
                } else {
                    const { data: newSub } = await supabase.from("subjects").insert({ name }).select("id").single();
                    if (newSub) subjectIds[name] = newSub.id;
                }
            }

            // 3. Get Teacher & Student
            // NOTE: role is stored in public.user_roles (not in profiles). Using user_roles avoids TS deep instantiation issues
            // and matches the actual schema.
            const { data: teacherRole } = await supabase
                .from("user_roles")
                .select("user_id")
                .eq("role", "teacher")
                .limit(1)
                .maybeSingle();
            let teacherId = (teacherRole as any)?.user_id as string | undefined;

            // Fallback: find ANY user
            if (!teacherId) {
                const { data: anyUser } = await supabase.from("profiles").select("auth_id").limit(1).single();
                teacherId = (anyUser as any)?.auth_id;
            }

            const { data: studentRole } = await supabase
                .from("user_roles")
                .select("user_id")
                .eq("role", "student")
                .limit(1)
                .maybeSingle();
            let studentId = (studentRole as any)?.user_id as string | undefined;

            if (!studentId) {
                const { data: anyUser } = await supabase
                    .from("profiles")
                    .select("auth_id")
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .single();
                studentId = (anyUser as any)?.auth_id;
            }

            if (!classId || !teacherId || !studentId) {
                toast.error("Не удалось определить базовые ID (класс, учитель или ученик)");
                return;
            }

            // 4. Link Student to Class
            await supabase.from("students_info").upsert({ student_id: studentId, class_id: classId });

            // 5. Create Teacher Assignments
            const assignments: Record<string, number> = {};
            for (const name of subjectsList) {
                const subId = subjectIds[name];
                if (!subId) continue;

                // Check existing
                const { data: exist } = await supabase.from("teacher_assignments")
                    .select("id")
                    .eq("class_id", classId)
                    .eq("subject_id", subId)
                    .maybeSingle();

                if (exist) {
                    assignments[name] = exist.id;
                } else {
                    const { data: newAssign } = await supabase.from("teacher_assignments")
                        .insert({ teacher_id: teacherId, class_id: classId, subject_id: subId })
                        .select("id")
                        .single();
                    if (newAssign) assignments[name] = newAssign.id;
                }
            }

            // 6. Create Schedule
            await supabase.from("schedule").delete().eq("class_id", classId);
            const scheduleData = [
                { day: 1, num: 1, sub: "Математика", room: "101" },
                { day: 1, num: 2, sub: "История", room: "205" },
                { day: 1, num: 3, sub: "Физика", room: "301" },
                { day: 2, num: 1, sub: "Русский язык", room: "102" },
                { day: 2, num: 2, sub: "Математика", room: "101" },
                { day: 2, num: 3, sub: "Информатика", room: "Comp-1" },
                { day: 3, num: 1, sub: "Физика", room: "301" },
                { day: 3, num: 2, sub: "История", room: "205" },
                { day: 4, num: 1, sub: "Математика", room: "101" },
                { day: 4, num: 2, sub: "Русский язык", room: "102" },
                { day: 5, num: 1, sub: "Информатика", room: "Comp-1" },
                { day: 5, num: 2, sub: "Математика", room: "101" },
            ];

            for (const s of scheduleData) {
                const subId = subjectIds[s.sub];
                if (subId) {
                    await supabase.from("schedule").insert({
                        class_id: classId,
                        day_of_week: s.day,
                        lesson_number: s.num,
                        subject_id: subId,
                        teacher_id: teacherId,
                        room: s.room // This might fail if 'room' column doesn't exist, checking schema... user said "room doesn't exist" before? 
                        // Wait, previous error said "room does not exist on schedule". 
                        // I removed 'room' from query, but schema *should* have it.
                        // Let's assume schema has it or ignore it if not.
                        // If schema doesn't have room, this insert will fail. 
                        // Checking migrations: 20260131200000_diary_schema.sql HAS "room text".
                        // So insert should be fine.  
                    });
                }
            }

            // 7. Insert Grades
            // Clean recent grades to avoid dups for demo
            const today = new Date().toISOString().slice(0, 10);

            if (assignments["Математика"]) {
                await supabase.from("grades").insert({
                    student_id: studentId,
                    teacher_assignment_id: assignments["Математика"],
                    grade: "5",
                    date: today,
                    comment: "Отличная работа (Тест)"
                });
            }
            if (assignments["Русский язык"]) {
                await supabase.from("grades").insert({
                    student_id: studentId,
                    teacher_assignment_id: assignments["Русский язык"],
                    grade: "4",
                    date: today,
                    comment: "Хорошо"
                });
            }

            toast.dismiss();
            toast.success("Тестовые данные созданы! Обновите страницу.");
            fetchGrades(); // Refresh
        } catch (e: any) {
            toast.error("Ошибка (Seed): " + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SchoolLayout title="Журнал успеваемости">
            <Helmet>
                <title>Журнал оценок | Админ-панель</title>
            </Helmet>

            <div className="space-y-6 pb-10">
                {/* Search & Filter Header */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                    <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
                        <div className="relative w-full md:w-80 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Поиск..."
                                className="pl-10 h-10 rounded-xl border border-slate-100 shadow-sm font-medium text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="w-full md:w-52">
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger className="h-10 rounded-xl border border-slate-100 bg-white font-bold text-sm">
                                    <Filter className="w-3.5 h-3.5 mr-2 text-slate-400" />
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
                            variant="outline"
                            className="h-10 px-6 rounded-xl border font-bold hover:bg-slate-50 border-dashed border-slate-300 text-slate-500 text-sm"
                            onClick={handleSeedData}
                        >
                            🛠️ Заполнить
                        </Button>
                        <Button className="h-10 rounded-xl gap-2 font-bold px-6 bg-slate-900 shadow-md hover:translate-y-[-1px] transition-all text-sm">
                            <Download className="w-4 h-4" /> Экспорт
                        </Button>
                    </div>
                </div>

                <Card className="border border-slate-100 rounded-[24px] overflow-hidden shadow-sm bg-white hover:shadow-md transition-all">
                    <CardHeader className="p-6 border-b bg-slate-50/30">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-primary shadow-sm">
                                    <Award className="w-6 h-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Ведомость оценок</CardTitle>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <p className="font-medium text-slate-500 text-xs italic">Академические данные школы</p>
                                    </div>
                                </div>
                            </div>
                            <div className="hidden md:flex gap-2">
                                <Badge className="bg-slate-900 text-white rounded-lg px-3 py-1 font-bold uppercase text-[9px] tracking-widest shadow-none">
                                    {filteredGrades.length} записей
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="py-32 flex flex-col items-center justify-center gap-6 text-slate-300">
                                <Loader2 className="animate-spin text-primary w-16 h-16" />
                                <span className="font-black uppercase tracking-[0.3em] text-[11px]">Генерация отчета...</span>
                            </div>
                        ) : filteredGrades.length === 0 ? (
                            <div className="py-32 flex flex-col items-center justify-center gap-4">
                                <Search className="w-20 h-20 text-slate-100" />
                                <p className="text-xl font-black text-slate-300 uppercase tracking-widest">Ничего не найдено</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/30">
                                            <TableHead className="py-4 px-6 font-bold text-[10px] uppercase tracking-wider text-slate-400">Ученик</TableHead>
                                            <TableHead className="py-4 px-6 font-bold text-[10px] uppercase tracking-wider text-slate-400">Класс</TableHead>
                                            <TableHead className="py-4 px-6 font-bold text-[10px] uppercase tracking-wider text-slate-400">Предмет</TableHead>
                                            <TableHead className="py-4 px-6 font-bold text-[10px] uppercase tracking-wider text-slate-400">Дата</TableHead>
                                            <TableHead className="py-4 px-6 font-bold text-[10px] uppercase tracking-wider text-slate-400 text-center">Оценка</TableHead>
                                            <TableHead className="py-4 px-6 text-right font-bold text-[10px] uppercase tracking-wider text-slate-400">Инфо</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredGrades.map((grade) => {
                                            const studentInfo = grade.student?.info?.[0];
                                            const className = studentInfo?.school_classes?.name;

                                            return (
                                                <TableRow key={grade.id} className="group hover:bg-slate-50/50 border-b border-slate-50 last:border-0 transition-all">
                                                    <TableCell className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="w-10 h-10 border-2 border-white shadow-sm rounded-xl">
                                                                <AvatarImage src={grade.student?.avatar_url || ""} />
                                                                <AvatarFallback className="font-bold bg-slate-50 text-slate-400 text-xs">
                                                                    {grade.student?.full_name?.[0]}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <Link
                                                                to={`/school/profile?id=${grade.student?.auth_id}`}
                                                                className="font-bold text-slate-800 text-sm hover:text-primary transition-colors cursor-pointer"
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
                                                            <span className="text-slate-300">—</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="py-4 px-6">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-700 text-sm">{grade.assignment?.subject?.name || "Предмет"}</span>
                                                            <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                                                {grade.assignment?.teacher?.full_name || "Учитель"}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4 px-6">
                                                        <span className="text-[12px] font-medium text-slate-500 tabular-nums">
                                                            {new Date(grade.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-4 px-6 text-center">
                                                        <div className={`inline-flex w-9 h-9 items-center justify-center rounded-lg text-white font-bold text-sm shadow-md transition-transform group-hover:scale-110 ${getGradeColor(grade.grade)}`}>
                                                            {grade.grade}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4 px-6 text-right">
                                                        <div className="flex justify-end gap-1.5">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-lg hover:bg-slate-100 text-slate-300 hover:text-slate-900"
                                                                onClick={() => showDetails(grade)}
                                                            >
                                                                <Eye className="w-4 h-4" />
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
                <DialogContent className="rounded-[24px] border p-0 max-w-lg bg-white overflow-hidden shadow-2xl">
                    <div className="h-24 bg-slate-50 flex items-center px-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 text-6xl font-black text-slate-100/50 select-none">
                            {selectedGrade?.grade}
                        </div>
                        <CardTitle className="text-xl font-black tracking-tight text-slate-800">Детали оценки</CardTitle>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Student Info */}
                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ученик</Label>
                                <div className="flex items-center gap-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                                    <Avatar className="w-10 h-10 border-2 border-white shadow-sm rounded-xl">
                                        <AvatarImage src={selectedGrade?.student?.avatar_url || ""} />
                                        <AvatarFallback className="font-bold bg-white text-slate-300 text-xs">
                                            {selectedGrade?.student?.full_name?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-slate-800 leading-tight">{selectedGrade?.student?.full_name}</span>
                                        <span className="text-[10px] font-medium text-slate-500">
                                            {selectedGrade?.student?.info?.[0]?.school_classes?.name || "Класс"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Предмет</Label>
                                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 h-full flex flex-col justify-center">
                                    <h4 className="text-base font-black text-slate-800">{selectedGrade?.assignment?.subject?.name}</h4>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                                        {selectedGrade?.assignment?.teacher?.full_name}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                                    <span className="font-bold text-[10px] uppercase text-slate-400 tracking-wider">Оценка</span>
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-md ${getGradeColor(selectedGrade?.grade)}`}>
                                        {selectedGrade?.grade}
                                    </div>
                                </div>
                                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                                    <span className="font-bold text-[10px] uppercase text-slate-400 tracking-wider">Дата</span>
                                    <span className="font-bold text-slate-700 text-xs tabular-nums">
                                        {selectedGrade?.date && new Date(selectedGrade.date).toLocaleDateString('ru-RU')}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                                <Label className="text-[10px] font-bold uppercase text-primary/60 tracking-wider mb-2 block">Комментарий</Label>
                                <p className="text-sm font-medium text-slate-700 italic">
                                    {selectedGrade?.comment ? `«${selectedGrade.comment}»` : "Комментарий не оставлен"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 border-t border-slate-100 flex gap-3">
                        <Button variant="ghost" className="flex-1 h-10 rounded-xl font-bold text-slate-400 uppercase tracking-wider text-[10px]" onClick={() => setIsDetailsOpen(false)}>
                            Закрыть
                        </Button>
                        <Button
                            asChild
                            className="flex-1 h-10 rounded-xl bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px] gap-2 shadow-md hover:bg-slate-800"
                        >
                            <Link to={`/school/profile?id=${selectedGrade?.student?.auth_id}`}>
                                <User className="w-3.5 h-3.5" /> Профиль
                            </Link>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </SchoolLayout>
    );
}
