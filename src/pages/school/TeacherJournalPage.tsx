import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
    ClipboardList,
    Search,
    Plus,
    Loader2,
    Users,
    BookOpen,
    GraduationCap,
    CheckCircle2,
    Calendar,
    Award,
    TrendingUp,
    MessageSquare,
    History,
    ChevronRight,
    ArrowUpRight,
    X
} from "lucide-react";
import SchoolLayout from "@/components/school/SchoolLayout";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

export default function TeacherJournalPage() {
    const { userId } = useAuth();
    const [loading, setLoading] = useState(true);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Grade Form
    const [isGradeOpen, setIsGradeOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [newGrade, setNewGrade] = useState("5");
    const [newComment, setNewComment] = useState("");
    const [saving, setSaving] = useState(false);

    // History
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [studentHistory, setStudentHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    useEffect(() => {
        if (userId) fetchAssignments();
    }, [userId]);

    useEffect(() => {
        if (selectedAssignmentId) fetchStudentsAndGrades();
    }, [selectedAssignmentId, selectedDate]);

    const fetchAssignments = async () => {
        try {
            const { data, error } = await supabase
                .from("teacher_assignments")
                .select("id, class_id, subject_id, school_classes(name), subjects(name)")
                .eq("teacher_id", userId);

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

            setStudents(results);
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
            const { error } = await supabase.from("grades").insert({
                student_id: selectedStudent.auth_id,
                teacher_assignment_id: parseInt(selectedAssignmentId),
                grade: newGrade,
                comment: newComment,
                date: selectedDate
            });

            if (error) throw error;

            toast.success("Оценка выставлена");
            setIsGradeOpen(false);
            setNewComment("");
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
            if (isHistoryOpen) {
                setStudentHistory(prev => prev.filter(g => g.id !== gradeId));
            }
            fetchStudentsAndGrades();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const getGradeColor = (grade: string) => {
        const val = parseInt(grade);
        if (val === 5) return "bg-emerald-500 shadow-emerald-100";
        if (val === 4) return "bg-blue-500 shadow-blue-100";
        if (val === 3) return "bg-amber-500 shadow-amber-100";
        if (val === 2) return "bg-rose-500 shadow-rose-100";
        return "bg-slate-400 shadow-slate-100";
    };

    const currentAssignment = assignments.find(a => a.id.toString() === selectedAssignmentId);

    return (
        <SchoolLayout title="Журнал преподавателя">
            <Helmet>
                <title>Журнал | {currentAssignment?.subjects.name || "Школа"}</title>
            </Helmet>

            <div className="space-y-8 pb-10">
                {/* Header Controls */}
                <div className="flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center bg-white p-8 rounded-[40px] border-2 border-slate-100 shadow-2xl shadow-slate-100/30">
                    <div className="flex flex-col md:flex-row gap-6 w-full xl:w-auto">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Выбор дисциплины</Label>
                            <Select value={selectedAssignmentId} onValueChange={setSelectedAssignmentId}>
                                <SelectTrigger className="w-full md:w-96 h-16 rounded-2xl border-2 font-black text-slate-900 bg-slate-50/50 shadow-inner group">
                                    <div className="flex items-center gap-3">
                                        <BookOpen className="w-5 h-5 text-primary" />
                                        <SelectValue placeholder="Выберите класс..." />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-3xl border-2 p-2 bg-white shadow-2xl">
                                    {assignments.map((a) => (
                                        <SelectItem key={a.id} value={a.id.toString()} className="h-14 rounded-2xl font-bold px-4 hover:bg-slate-50">
                                            <div className="flex flex-col">
                                                <span className="text-slate-900">{a.school_classes.name} • {a.subjects.name}</span>
                                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Основная программа</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Дата занятия</Label>
                            <div className="relative">
                                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary z-10 pointer-events-none" />
                                <Input
                                    type="date"
                                    value={selectedDate}
                                    onChange={e => setSelectedDate(e.target.value)}
                                    className="h-16 rounded-2xl border-2 font-black text-slate-900 bg-slate-50/50 pl-14 w-full md:w-64 shadow-inner"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 w-full xl:w-auto">
                        <div className="bg-emerald-50 border-2 border-emerald-100 px-8 py-3 rounded-2xl flex flex-col">
                            <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Текущий средний</span>
                            <span className="text-2xl font-black text-emerald-700 leading-tight">4.8</span>
                        </div>
                        <Button className="h-16 rounded-3xl gap-3 font-black px-10 bg-slate-900 shadow-xl shadow-slate-200 hover:scale-[1.02] transition-all">
                            <TrendingUp className="w-6 h-6" /> Статистика класса
                        </Button>
                    </div>
                </div>

                {/* Students List */}
                <Card className="border-2 border-slate-100 rounded-[50px] overflow-hidden shadow-2xl bg-white transition-all">
                    <CardHeader className="p-12 border-b bg-slate-50/30">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-[24px] bg-white border-2 border-slate-100 flex items-center justify-center text-primary shadow-xl">
                                    <ClipboardList className="w-10 h-10" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-slate-900">Успеваемость класса</h3>
                                    <CardDescription className="font-bold text-slate-500 text-lg flex items-center gap-2">
                                        Ввод данных за {new Date(selectedDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                                        <Badge className="bg-primary/10 text-primary border-0 rounded-lg text-xs font-black uppercase tracking-widest px-2">LIVE</Badge>
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <span className="bg-white px-6 py-3 rounded-2xl border-2 border-slate-100 font-black text-slate-400 uppercase tracking-widest text-[10px] flex items-center gap-2">
                                    <Users className="w-4 h-4" /> {students.length} Учеников
                                </span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="py-32 flex flex-col items-center justify-center gap-6 text-slate-300">
                                <Loader2 className="animate-spin w-20 h-20 text-primary" />
                                <span className="font-black uppercase tracking-[0.4em] text-[12px]">Синхронизация...</span>
                            </div>
                        ) : students.length === 0 ? (
                            <div className="py-32 text-center space-y-6">
                                <Users className="w-24 h-24 text-slate-50 mx-auto" />
                                <p className="text-2xl font-black text-slate-300 uppercase tracking-widest">Класс пуст</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/50">
                                            <TableHead className="py-8 px-12 font-black text-xs uppercase tracking-[0.2em] text-slate-400">Студент</TableHead>
                                            <TableHead className="py-8 px-12 font-black text-xs uppercase tracking-[0.2em] text-slate-400">Оценка за день</TableHead>
                                            <TableHead className="py-8 px-12 text-right font-black text-xs uppercase tracking-[0.2em] text-slate-400 text-right">Управление</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {students.map((student) => (
                                            <TableRow key={student.auth_id} className="group hover:bg-primary/[0.01] border-b border-slate-50 last:border-0 transition-all">
                                                <TableCell className="py-10 px-12">
                                                    <div className="flex items-center gap-6">
                                                        <Avatar className="w-14 h-14 border-4 border-white shadow-xl rounded-[20px]">
                                                            <AvatarImage src={student.avatar_url || ""} />
                                                            <AvatarFallback className="font-black bg-slate-50 text-slate-300">
                                                                {student.full_name?.[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-slate-900 text-xl group-hover:text-primary transition-colors">{student.full_name}</span>
                                                            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-1 flex items-center gap-2">
                                                                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Активен
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-10 px-12">
                                                    <div className="flex items-center gap-4">
                                                        {student.grades.map(g => (
                                                            <div
                                                                key={g.id}
                                                                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-2xl cursor-pointer hover:scale-110 transition-transform ${getGradeColor(g.grade)}`}
                                                                title={g.comment || "Без комментария"}
                                                                onClick={() => fetchHistory(student)}
                                                            >
                                                                {g.grade}
                                                            </div>
                                                        ))}
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => { setSelectedStudent(student); setIsGradeOpen(true); }}
                                                            className="w-14 h-14 rounded-2xl border-4 border-dashed border-slate-100 text-slate-200 hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all group/btn"
                                                        >
                                                            <Plus className="w-8 h-8 group-hover/btn:scale-125 transition-transform" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-10 px-12 text-right">
                                                    <Button
                                                        variant="outline"
                                                        className="h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 border-slate-100 hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all gap-2"
                                                        onClick={() => fetchHistory(student)}
                                                    >
                                                        <History className="w-4 h-4" /> История оценок
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Grade Modal */}
            <Dialog open={isGradeOpen} onOpenChange={setIsGradeOpen}>
                <DialogContent className="rounded-[40px] border-4 p-12 max-w-md bg-white shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-4xl font-black mb-1">Выставить оценку</DialogTitle>
                        <DialogDescription className="text-lg font-bold text-slate-500 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                                {selectedStudent?.full_name[0]}
                            </span>
                            {selectedStudent?.full_name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-10 py-10">
                        <div className="space-y-4 text-center">
                            <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Выберите результат</Label>
                            <div className="flex justify-between gap-4">
                                {["5", "4", "3", "2"].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => setNewGrade(num)}
                                        className={`w-16 h-16 rounded-[24px] font-black text-2xl transition-all shadow-xl ${newGrade === num
                                            ? `${getGradeColor(num)} text-white scale-110 ring-[6px] ring-primary/10`
                                            : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:scale-105"
                                            }`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 pl-1">Комментарий к работе</Label>
                            <div className="relative">
                                <MessageSquare className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <Input
                                    placeholder="Напр.: Отлично справился с тестом!"
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                    className="h-16 rounded-2xl border-2 font-bold px-14 focus:ring-4 focus:ring-primary/5 transition-all text-slate-700"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            onClick={handleAddGrade}
                            disabled={saving}
                            className="w-full h-20 rounded-[32px] bg-slate-900 text-white font-black text-xl shadow-2xl shadow-slate-300 hover:translate-y-[-4px] active:translate-y-[0] transition-all"
                        >
                            {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : "Зафиксировать оценку"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* History Modal */}
            <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <DialogContent className="rounded-[40px] border-2 p-0 max-w-2xl bg-white overflow-hidden shadow-3xl">
                    <div className="h-40 bg-slate-900 flex items-center px-12 gap-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-5">
                            <TrendingUp className="w-40 h-40 text-white" />
                        </div>
                        <Avatar className="w-20 h-20 border-4 border-white/20 shadow-2xl rounded-[28px]">
                            <AvatarImage src={selectedStudent?.avatar_url || ""} />
                            <AvatarFallback className="font-black bg-white/10 text-white text-2xl">
                                {selectedStudent?.full_name[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <h4 className="text-3xl font-black text-white">{selectedStudent?.full_name}</h4>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">
                                История успеваемости • {currentAssignment?.subjects.name}
                            </p>
                        </div>
                    </div>

                    <div className="p-10">
                        {historyLoading ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-300">
                                <Loader2 className="animate-spin w-10 h-10 text-primary" />
                                <span className="font-black text-[10px] uppercase tracking-widest">Архивные данные...</span>
                            </div>
                        ) : studentHistory.length === 0 ? (
                            <div className="py-20 text-center opacity-30">
                                <History className="w-16 h-16 mx-auto mb-4" />
                                <p className="font-black">Оценок еще нет</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {studentHistory.map((g) => (
                                    <div key={g.id} className="group relative flex items-center justify-between bg-slate-50 p-6 rounded-[32px] border-2 border-slate-100 hover:bg-white hover:border-primary/20 transition-all">
                                        <div className="flex gap-6 items-center">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-xl ${getGradeColor(g.grade)}`}>
                                                {g.grade}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-900 group-hover:text-primary transition-colors">
                                                    {new Date(g.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </span>
                                                <p className="text-xs font-bold text-slate-500 mt-1 max-w-sm">
                                                    {g.comment ? `«${g.comment}»` : "Без комментария"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-rose-500 hover:bg-rose-50" onClick={() => deleteGrade(g.id)}>
                                                <X className="w-5 h-5" />
                                            </Button>
                                            <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-primary transition-all" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-50 p-8 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex gap-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Всего оценок</span>
                                <span className="font-black text-slate-900">{studentHistory.length}</span>
                            </div>
                        </div>
                        <Button className="h-14 rounded-2xl gap-2 font-black px-8 bg-white border-2 border-slate-200 text-slate-900 hover:bg-slate-50 transition-all shadow-sm">
                            Полный табель <ArrowUpRight className="w-5 h-5" />
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </SchoolLayout>
    );
}
