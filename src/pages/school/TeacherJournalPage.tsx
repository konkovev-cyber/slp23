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

import { useNavigate } from "react-router-dom";

export default function TeacherJournalPage() {
    const { userId } = useAuth();
    const navigate = useNavigate();
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
        if (val === 4) return "bg-primary/50 shadow-primary/10";
        if (val === 3) return "bg-amber-500 shadow-amber-100";
        if (val === 2) return "bg-rose-500 shadow-rose-100";
        return "bg-slate-400 shadow-muted/10";
    };

    const currentAssignment = assignments.find(a => a.id.toString() === selectedAssignmentId);

    return (
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
                    </div>

                    <div className="flex flex-wrap gap-4 w-full xl:w-auto items-center">
                        <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl flex flex-col">
                            <span className="text-[9px] font-bold uppercase text-emerald-600 tracking-wider">Средний</span>
                            <span className="text-lg font-black text-emerald-700 leading-tight">4.8</span>
                        </div>
                        <Button className="h-10 rounded-xl gap-2 font-bold px-5 bg-foreground shadow-md text-sm hover:translate-y-[-1px] transition-all">
                            <TrendingUp className="w-4 h-4" /> Статистика
                        </Button>
                    </div>
                </div>

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
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                                <Loader2 className="animate-spin w-10 h-10 text-primary" />
                                <span className="font-bold uppercase tracking-wider text-[10px]">Загрузка...</span>
                            </div>
                        ) : students.length === 0 ? (
                            <div className="py-20 text-center space-y-4">
                                <Users className="w-16 h-16 text-slate-50 mx-auto" />
                                <p className="text-lg font-bold text-muted-foreground uppercase tracking-wider">Класс пуст</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead className="py-4 px-6 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Студент</TableHead>
                                            <TableHead className="py-4 px-6 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Оценка за день</TableHead>
                                            <TableHead className="py-4 px-6 text-right font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Управление</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {students.map((student) => (
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
                                                    <div className="flex items-center gap-2">
                                                        {student.grades.map(g => (
                                                            <div
                                                                key={g.id}
                                                                className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md cursor-pointer hover:scale-110 transition-transform ${getGradeColor(g.grade)}`}
                                                                title={g.comment || "Без комментария"}
                                                                onClick={() => fetchHistory(student)}
                                                            >
                                                                {g.grade}
                                                            </div>
                                                        ))}
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => { setSelectedStudent(student); setIsGradeOpen(true); }}
                                                            className="w-9 h-9 rounded-lg border-2 border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all p-0"
                                                        >
                                                            <Plus className="w-5 h-5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 px-6 text-right">
                                                    <Button
                                                        variant="outline"
                                                        className="h-8 rounded-lg font-bold text-[9px] uppercase tracking-wider border border-border hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all gap-1.5 px-3"
                                                        onClick={() => fetchHistory(student)}
                                                    >
                                                        <History className="w-3.5 h-3.5" /> История
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
                            <div className="flex justify-between gap-3">
                                {["5", "4", "3", "2"].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => setNewGrade(num)}
                                        className={`w-12 h-12 rounded-xl font-black text-xl transition-all shadow-sm ${newGrade === num
                                            ? `${getGradeColor(num)} text-white scale-110 ring-[3px] ring-primary/10`
                                            : "bg-muted text-muted-foreground hover:bg-muted hover:scale-105"
                                            }`}
                                    >
                                        {num}
                                    </button>
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
                            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                                {studentHistory.map((g) => (
                                    <div key={g.id} className="group relative flex items-center justify-between bg-muted p-4 rounded-2xl border border-border hover:bg-background hover:border-primary/20 transition-all">
                                        <div className="flex gap-4 items-center">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-md ${getGradeColor(g.grade)}`}>
                                                {g.grade}
                                            </div>
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
    );
}
