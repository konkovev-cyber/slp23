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
            const { data, error } = await supabase
                .from("grades")
                .select(`
                    id,
                    grade,
                    comment,
                    date,
                    created_at,
                    student_id,
                    assignment:teacher_assignments(
                        teacher_id,
                        subject:subjects(name),
                        teacher:profiles(full_name, avatar_url)
                    )
                `)
                .order("created_at", { ascending: false });

            if (error) throw error;

            // Fetch profiles separately to avoid join errors if FK is missing
            const { data: profiles } = await supabase
                .from("profiles")
                .select("auth_id, full_name, avatar_url, students_info(school_classes(name))");

            const enriched = (data || []).map(g => ({
                ...g,
                student: profiles?.find(p => p.auth_id === g.student_id)
            }));

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

    return (
        <SchoolLayout title="Журнал успеваемости">
            <Helmet>
                <title>Журнал оценок | Админ-панель</title>
            </Helmet>

            <div className="space-y-8 pb-10">
                {/* Search & Filter Header */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                    <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
                        <div className="relative w-full md:w-80 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Поиск по ученику или предмету..."
                                className="pl-12 h-14 rounded-2xl border-2 border-slate-100 shadow-xl shadow-slate-100/30 font-bold"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="w-full md:w-56">
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger className="h-14 rounded-2xl border-2 border-slate-100 bg-white font-bold">
                                    <Filter className="w-4 h-4 mr-2 text-slate-400" />
                                    <SelectValue placeholder="Все классы" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-2">
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

                    <Button className="h-14 rounded-2xl gap-3 font-black px-8 bg-slate-900 shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all">
                        <Download className="w-5 h-5" /> Экспортировать ведомость
                    </Button>
                </div>

                <Card className="border-2 border-slate-100 rounded-[40px] overflow-hidden shadow-2xl bg-white">
                    <CardHeader className="p-10 border-b bg-slate-50/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-3xl bg-white border-2 border-slate-100 flex items-center justify-center text-primary shadow-lg">
                                    <Award className="w-8 h-8" />
                                </div>
                                <div>
                                    <CardTitle className="text-3xl font-black text-slate-900 tracking-tight">Ведомость оценок</CardTitle>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <p className="font-bold text-slate-500 text-sm italic">Прямой доступ к учебным данным всей школы</p>
                                    </div>
                                </div>
                            </div>
                            <div className="hidden md:flex gap-2">
                                <Badge className="bg-slate-900 text-white rounded-xl px-4 py-2 font-black uppercase text-[10px] tracking-widest">
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
                                            <TableHead className="py-8 px-10 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400">Ученик</TableHead>
                                            <TableHead className="py-8 px-10 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400">Класс</TableHead>
                                            <TableHead className="py-8 px-10 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400">Предмет и Учитель</TableHead>
                                            <TableHead className="py-8 px-10 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400">Дата</TableHead>
                                            <TableHead className="py-8 px-10 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 text-center">Оценка</TableHead>
                                            <TableHead className="py-8 px-10 text-right font-black text-[11px] uppercase tracking-[0.2em] text-slate-400">Инфо</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredGrades.map((grade) => {
                                            const studentInfo = grade.student?.info?.[0];
                                            const className = studentInfo?.school_classes?.name;

                                            return (
                                                <TableRow key={grade.id} className="group hover:bg-primary/[0.02] border-b border-slate-50 last:border-0 transition-all">
                                                    <TableCell className="py-8 px-10">
                                                        <div className="flex items-center gap-4">
                                                            <Avatar className="w-12 h-12 border-2 border-white shadow-lg rounded-2xl">
                                                                <AvatarImage src={grade.student?.avatar_url || ""} />
                                                                <AvatarFallback className="font-black bg-slate-100 text-slate-400 text-sm">
                                                                    {grade.student?.full_name?.[0]}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <Link
                                                                to={`/school/profile?id=${grade.student?.auth_id}`}
                                                                className="font-black text-slate-900 text-lg hover:text-primary transition-colors cursor-pointer"
                                                            >
                                                                {grade.student?.full_name || "Неизвестный ученик"}
                                                            </Link>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-8 px-10">
                                                        {className ? (
                                                            <Badge variant="outline" className="px-4 py-1.5 rounded-xl font-black text-emerald-600 bg-emerald-50 border-emerald-100">
                                                                {className}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-slate-300">—</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="py-8 px-10">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="font-black text-slate-700">{grade.assignment?.subject?.name || "Предмет"}</span>
                                                            <Link
                                                                to={`/school/profile?id=${grade.assignment?.teacher_id}`}
                                                                className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 hover:text-primary transition-colors"
                                                            >
                                                                <GraduationCap className="w-3 h-3" /> {grade.assignment?.teacher?.full_name || "Учитель"}
                                                            </Link>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-8 px-10">
                                                        <span className="text-sm font-black text-slate-500 tabular-nums">
                                                            {new Date(grade.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-8 px-10 text-center">
                                                        <div className={`inline-flex w-12 h-12 items-center justify-center rounded-2xl text-white font-black text-xl shadow-xl transition-transform group-hover:scale-110 ${getGradeColor(grade.grade)}`}>
                                                            {grade.grade}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-8 px-10 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-10 w-10 rounded-xl hover:bg-slate-100 text-slate-300 hover:text-slate-900"
                                                            onClick={() => showDetails(grade)}
                                                        >
                                                            <Eye className="w-6 h-6" />
                                                        </Button>
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
                <DialogContent className="rounded-[40px] border-2 p-0 max-w-2xl bg-white overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent flex items-end px-10 pb-6 relative">
                        <div className={`absolute top-0 right-0 p-8 text-8xl font-black text-slate-100 select-none`}>
                            {selectedGrade?.grade}
                        </div>
                        <CardTitle className="text-3xl font-black tracking-tight">Карточка оценки</CardTitle>
                    </div>

                    <div className="p-10 space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Student Info */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <User className="w-3 h-3" /> Ученик
                                </div>
                                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border-2 border-slate-100">
                                    <Avatar className="w-14 h-14 border-4 border-white shadow-lg rounded-2xl">
                                        <AvatarImage src={selectedGrade?.student?.avatar_url || ""} />
                                        <AvatarFallback className="font-black bg-white text-slate-300">
                                            {selectedGrade?.student?.full_name?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-black text-lg text-slate-900 leading-tight">{selectedGrade?.student?.full_name}</span>
                                        <span className="text-xs font-bold text-slate-500 mt-1">
                                            Класс {selectedGrade?.student?.info?.[0]?.school_classes?.name || "—"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Teacher/Subject Info */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <BookOpen className="w-3 h-3" /> Дисциплина
                                </div>
                                <div className="bg-slate-50 p-6 rounded-3xl text-slate-900 border-2 border-slate-100 shadow-sm">
                                    <h4 className="text-2xl font-black mb-1 text-slate-800">{selectedGrade?.assignment?.subject?.name}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                        Учитель: <span className="text-primary">{selectedGrade?.assignment?.teacher?.full_name}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <MessageSquare className="w-3 h-3" /> Детализация
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-slate-50 p-6 rounded-[32px] border-2 border-slate-100 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="font-black text-[10px] uppercase text-slate-400 tracking-widest">Оценка</span>
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg ${getGradeColor(selectedGrade?.grade)}`}>
                                            {selectedGrade?.grade}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                                        <span className="font-black text-[10px] uppercase text-slate-400 tracking-widest">Дата выставления</span>
                                        <span className="font-black text-slate-900 flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-primary" />
                                            {selectedGrade?.date && new Date(selectedGrade.date).toLocaleDateString('ru-RU')}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-primary/5 p-6 rounded-[32px] border-2 border-primary/10 flex flex-col">
                                    <span className="font-black text-[10px] uppercase text-primary/60 tracking-widest mb-3">Комментарий</span>
                                    {selectedGrade?.comment ? (
                                        <p className="font-bold text-slate-700 italic leading-relaxed">
                                            «{selectedGrade.comment}»
                                        </p>
                                    ) : (
                                        <p className="text-slate-300 font-bold italic">Комментарий не оставлен</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-8 border-t border-slate-100 flex gap-4">
                        <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-black text-slate-400 uppercase tracking-widest text-[10px]" onClick={() => setIsDetailsOpen(false)}>
                            Закрыть
                        </Button>
                        <Button
                            asChild
                            className="flex-1 h-14 rounded-2xl bg-white border-2 border-slate-200 text-slate-900 font-black uppercase tracking-widest text-[10px] gap-2 shadow-sm hover:bg-white hover:border-primary transition-all"
                        >
                            <Link to={`/school/diary?studentId=${selectedGrade?.student?.auth_id}`}>
                                <BookOpen className="w-4 h-4" /> Посмотреть дневник
                            </Link>
                        </Button>
                        <Button
                            asChild
                            className="flex-1 h-14 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] gap-2 shadow-sm hover:bg-slate-800 transition-all"
                        >
                            <Link to={`/school/profile?id=${selectedGrade?.student?.auth_id}`}>
                                <User className="w-4 h-4" /> Профиль ученика
                            </Link>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </SchoolLayout>
    );
}
