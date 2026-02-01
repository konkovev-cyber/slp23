import { useEffect, useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    BookOpen,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Loader2,
    CheckCircle2,
    Clock,
    MapPin,
    GraduationCap,
    FileText,
    Award,
    ClipboardCheck,
    TrendingUp,
    Filter
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SchoolLayout from "@/components/school/SchoolLayout";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type DiaryEntry = {
    lesson_number: number;
    subject_name: string;
    teacher_name: string;
    room: string | null;
    homework?: {
        title: string;
        description: string;
    };
    grade?: {
        grade: string;
        comment: string | null;
    };
};

const DAYS_RU = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];

export default function StudentDiaryPage() {
    const { userId: currentUserId } = useAuth();
    const [searchParams] = useSearchParams();
    const studentId = searchParams.get("studentId") || currentUserId;

    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
    const [className, setClassName] = useState("");

    useEffect(() => {
        if (studentId) {
            fetchDiaryData();
        }
    }, [studentId, selectedDate]);

    const fetchDiaryData = async () => {
        try {
            setLoading(true);
            const { data: studentInfo } = await supabase
                .from("students_info")
                .select("class_id, school_classes(name)")
                .eq("student_id", studentId)
                .maybeSingle();

            if (!studentInfo) {
                setLoading(false);
                return;
            }
            setClassName(((studentInfo as any).school_classes as any)?.name || "");

            const dayOfWeek = selectedDate.getDay(); // 0-6 (Sun-Sat)
            const dateStr = selectedDate.toISOString().slice(0, 10);

            // 1. Get schedule for this day
            const { data: scheduleData } = await supabase
                .from("schedule")
                .select(`
                    lesson_number,
                    teacher_id,
                    subjects(name)
                `)
                .eq("class_id", (studentInfo as any).class_id)
                .eq("day_of_week", dayOfWeek)
                .order("lesson_number");

            // Fetch teacher profiles
            const teacherIds = (scheduleData || []).map(s => s.teacher_id);
            const { data: teachers } = await supabase
                .from("profiles")
                .select("auth_id, full_name")
                .in("auth_id", teacherIds);

            // 2. Get grades for this day
            const { data: gradesData } = await supabase
                .from("grades")
                .select(`
                    grade, 
                    comment, 
                    assignment:teacher_assignments(
                        subject_id,
                        subjects(name)
                    )
                `)
                .eq("student_id", studentId)
                .eq("date", dateStr);

            // 3. Get homework for this date
            const { data: hwData } = await supabase
                .from("homework")
                .select(`
                    title, 
                    description, 
                    assignment:teacher_assignments(
                        subjects(name)
                    )
                `)
                .eq("due_date", dateStr);

            // 4. Combine
            const combined: DiaryEntry[] = (scheduleData as any[] || []).map(s => {
                const homeworkForLesson = (hwData as any[])?.find(h =>
                    h.assignment?.subjects?.name === s.subjects?.name
                );
                const gradeForLesson = (gradesData as any[])?.find(g =>
                    g.assignment?.subjects?.name === s.subjects?.name
                );

                const teacher = teachers?.find(t => t.auth_id === s.teacher_id);

                return {
                    lesson_number: s.lesson_number,
                    subject_name: s.subjects?.name || "Предмет",
                    teacher_name: teacher?.full_name || "Преподаватель",
                    room: (s as any).room || null,
                    homework: homeworkForLesson ? { title: homeworkForLesson.title, description: homeworkForLesson.description } : undefined,
                    grade: gradeForLesson ? { grade: gradeForLesson.grade, comment: gradeForLesson.comment } : undefined
                };
            });

            setDiaryEntries(combined);
        } catch (error: any) {
            toast.error("Ошибка при загрузке дневника: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const changeDay = (offset: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + offset);
        setSelectedDate(newDate);
    };

    const getWeekDay = (date: Date) => DAYS_RU[date.getDay()];

    const getGradeColor = (grade: string) => {
        const val = parseInt(grade);
        if (val === 5) return "bg-emerald-500 shadow-emerald-100";
        if (val === 4) return "bg-blue-500 shadow-blue-100";
        if (val === 3) return "bg-amber-500 shadow-amber-100";
        if (val === 2) return "bg-rose-500 shadow-rose-100";
        return "bg-slate-400 shadow-slate-100";
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    return (
        <SchoolLayout title="Электронный дневник">
            <Helmet>
                <title>Дневник | {getWeekDay(selectedDate)}</title>
            </Helmet>

            <div className="max-w-4xl mx-auto space-y-8">
                {/* Date Selector */}
                <div className="flex items-center justify-between bg-white p-4 rounded-[28px] border-2 border-slate-100 shadow-xl shadow-slate-100/50">
                    <Button variant="ghost" size="icon" onClick={() => changeDay(-1)} className="rounded-2xl h-12 w-12 hover:bg-slate-50 text-slate-400 hover:text-primary">
                        < ChevronLeft className="w-6 h-6" />
                    </Button>

                    <div className="flex flex-col items-center text-center">
                        <h2 className={cn(
                            "text-xl font-black uppercase tracking-tight",
                            isToday(selectedDate) ? "text-primary" : "text-slate-900"
                        )}>
                            {isToday(selectedDate) ? "Сегодня" : getWeekDay(selectedDate)}
                        </h2>
                        <p className="text-sm font-bold text-slate-400 tabular-nums">
                            {selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>

                    <Button variant="ghost" size="icon" onClick={() => changeDay(1)} className="rounded-2xl h-12 w-12 hover:bg-slate-50 text-slate-400 hover:text-primary">
                        < ChevronRight className="w-6 h-6" />
                    </Button>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    </div>
                ) : diaryEntries.length === 0 ? (
                    <Card className="border-2 border-dashed border-slate-200 shadow-none bg-slate-50/50 rounded-[32px]">
                        <CardContent className="py-20 flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 bg-white rounded-[24px] flex items-center justify-center text-slate-300 shadow-sm border-2">
                                <Calendar className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-black text-slate-900 uppercase text-sm tracking-widest">Выходной день</h3>
                                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Занятий не запланировано</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {diaryEntries.map((entry, index) => (
                            <Card key={index} className="group overflow-hidden border-2 border-slate-100 hover:border-primary/20 transition-all duration-500 rounded-[32px] bg-white shadow-xl shadow-slate-100/30">
                                <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row">
                                        {/* Left side: Lesson info */}
                                        <div className="w-full md:w-1/3 bg-slate-50/50 p-8 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-center">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black shadow-lg">
                                                    {entry.lesson_number}
                                                </div>
                                                <div className="h-0.5 flex-1 bg-slate-200" />
                                            </div>
                                            <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight tracking-tight group-hover:text-primary transition-colors">
                                                {entry.subject_name}
                                            </h3>
                                            <div className="space-y-1.5">
                                                <p className="text-xs font-bold text-slate-400 flex items-center gap-2">
                                                    < GraduationCap className="w-3.5 h-3.5" /> {entry.teacher_name}
                                                </p>
                                                {entry.room && (
                                                    <p className="text-xs font-bold text-slate-400 flex items-center gap-2">
                                                        < MapPin className="w-3.5 h-3.5" /> Кабинет {entry.room}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right side: Homework and Grade */}
                                        <div className="flex-1 p-8 flex flex-col justify-between gap-6">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-primary">
                                                        < BookOpen className="w-4 h-4" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Домашнее задание</span>
                                                    </div>
                                                    {entry.homework && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                                </div>

                                                <div className="p-5 rounded-2xl bg-white border-2 border-slate-50 shadow-inner group-hover:bg-slate-50/30 transition-colors">
                                                    {entry.homework ? (
                                                        <p className="text-sm font-bold text-slate-700 leading-relaxed italic">
                                                            {entry.homework.description}
                                                        </p>
                                                    ) : (
                                                        <p className="text-xs font-bold text-slate-300 uppercase tracking-widest italic">
                                                            Задание не задано
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {entry.grade && (
                                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                                    <div className="flex items-center gap-2">
                                                        < FileText className="w-4 h-4 text-slate-400" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Результат урока</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {entry.grade.comment && (
                                                            <span className="text-[10px] font-bold text-slate-400 italic">"{entry.grade.comment}"</span>
                                                        )}
                                                        <div className={cn(
                                                            "w-12 h-12 rounded-[20px] flex items-center justify-center text-white font-black shadow-xl scale-110",
                                                            getGradeColor(entry.grade.grade)
                                                        )}>
                                                            {entry.grade.grade}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </SchoolLayout>
    );
}
