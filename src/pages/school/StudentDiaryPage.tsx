import { useEffect, useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    BookOpen,
    Calendar as CalendarIcon,
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
    Filter,
    LayoutList,
    LayoutGrid,
    CalendarDays
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SchoolLayout from "@/components/school/SchoolLayout";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar"; // Assuming shadcn Calendar exists
import { ru } from "date-fns/locale";

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

type DaySchedule = {
    date: Date;
    entries: DiaryEntry[];
};

const DAYS_RU = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
const MONTHS_RU = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

export default function StudentDiaryPage() {
    const { userId: currentUserId } = useAuth();
    const [searchParams] = useSearchParams();
    const studentId = searchParams.get("studentId") || currentUserId;

    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');

    // Data states
    const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>([]);
    const [monthGrades, setMonthGrades] = useState<any[]>([]);
    const [className, setClassName] = useState("");

    // Helpers to get start/end of week (Monday to Sunday)
    const getWeekRange = (date: Date) => {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        const monday = new Date(date);
        monday.setDate(diff);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        return { start: monday, end: sunday };
    };

    useEffect(() => {
        if (studentId) {
            fetchData();
        }
    }, [studentId, selectedDate, viewMode]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // 1. Get Class Info
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
            const classId = (studentInfo as any).class_id;

            // Define fetch range based on ViewMode
            let startDate = new Date(selectedDate);
            let endDate = new Date(selectedDate);

            if (viewMode === 'day') {
                // Just one day
            } else if (viewMode === 'week') {
                const range = getWeekRange(selectedDate);
                startDate = range.start;
                endDate = range.end;
            } else if (viewMode === 'month') {
                startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
                endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
            }

            // For Day/Week we need full schedule details
            if (viewMode === 'day' || viewMode === 'week') {
                await fetchDetailedSchedule(classId, startDate, endDate);
            }

            // For Month we might just need grades presence (simplified for now, using detailed too as it's not huge data)
            if (viewMode === 'month') {
                await fetchDetailedSchedule(classId, startDate, endDate); // Reusing logic for now
            }

        } catch (error: any) {
            toast.error("Ошибка при загрузке данных: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchDetailedSchedule = async (classId: number, start: Date, end: Date) => {
        // 1. Fetch Static Schedule for all days in range (or just all possible days 0-6 generic)
        // Actually, better to fetch generics and map them to dates.
        const { data: scheduleTemplates } = await supabase
            .from("schedule")
            .select(`
                day_of_week,
                lesson_number,
                teacher_id,
                subjects(name)
            `)
            .eq("class_id", classId)
            .order("lesson_number");

        // Fetch teachers
        const teacherIds = [...new Set((scheduleTemplates || []).map(s => s.teacher_id))];
        const { data: teachers } = await supabase
            .from("profiles")
            .select("auth_id, full_name")
            .in("auth_id", teacherIds);

        // 2. Fetch Grades & Homework for the specific date range
        const startStr = start.toISOString().slice(0, 10);
        const endStr = end.toISOString().slice(0, 10);

        const { data: grades } = await supabase
            .from("grades")
            .select(`
                grade, comment, date,
                assignment:teacher_assignments(subjects(name))
            `)
            .eq("student_id", studentId)
            .gte("date", startStr)
            .lte("date", endStr);

        const { data: homework } = await supabase
            .from("homework")
            .select(`
                title, description, due_date,
                assignment:teacher_assignments(subjects(name))
            `)
            .gte("due_date", startStr)
            .lte("due_date", endStr);

        // 3. Assemble Days
        const days: DaySchedule[] = [];
        const current = new Date(start);
        while (current <= end) {
            const dateStr = current.toISOString().slice(0, 10);
            const dayOfWeek = current.getDay(); // 0-6

            // Filter schedule for this day
            const dailyLessons = (scheduleTemplates || []).filter(s => s.day_of_week === dayOfWeek);

            const entries: DiaryEntry[] = dailyLessons.map(lesson => {
                const subjectName = lesson.subjects?.name || "Предмет";
                const teacherObj = teachers?.find(t => t.auth_id === lesson.teacher_id);

                // Find homework due this date
                const hw = homework?.find(h =>
                    h.due_date === dateStr &&
                    h.assignment?.subjects?.name === subjectName
                );

                // Find grade for this date
                // Note: Grades are usually for a date. The simpler logic matches subject + date.
                const grade = grades?.find(g =>
                    g.date === dateStr &&
                    g.assignment?.subjects?.name === subjectName
                );

                return {
                    lesson_number: lesson.lesson_number,
                    subject_name: subjectName,
                    teacher_name: teacherObj?.full_name || "Преподаватель",
                    room: null, // room removed from query earlier
                    homework: hw ? { title: hw.title, description: hw.description } : undefined,
                    grade: grade ? { grade: grade.grade, comment: grade.comment } : undefined
                };
            });

            // Even if no lessons, we push the day so we can show "Day Off"
            days.push({
                date: new Date(current),
                entries: entries.sort((a, b) => a.lesson_number - b.lesson_number)
            });

            current.setDate(current.getDate() + 1);
        }

        setWeekSchedule(days);
    };

    // Navigation
    const handlePrev = () => {
        const newDate = new Date(selectedDate);
        if (viewMode === 'day') newDate.setDate(newDate.getDate() - 1);
        if (viewMode === 'week') newDate.setDate(newDate.getDate() - 7);
        if (viewMode === 'month') newDate.setMonth(newDate.getMonth() - 1);
        setSelectedDate(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(selectedDate);
        if (viewMode === 'day') newDate.setDate(newDate.getDate() + 1);
        if (viewMode === 'week') newDate.setDate(newDate.getDate() + 7);
        if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + 1);
        setSelectedDate(newDate);
    };

    const getWeekLabel = () => {
        const { start, end } = getWeekRange(selectedDate);
        return `${start.getDate()} ${MONTHS_RU[start.getMonth()]} — ${end.getDate()} ${MONTHS_RU[end.getMonth()]}`;
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const getGradeColor = (grade: string) => {
        const val = parseInt(grade);
        if (val === 5) return "bg-emerald-500 shadow-emerald-100";
        if (val === 4) return "bg-blue-500 shadow-blue-100";
        if (val === 3) return "bg-amber-500 shadow-amber-100";
        if (val === 2) return "bg-rose-500 shadow-rose-100";
        return "bg-slate-400 shadow-slate-100";
    };

    return (
        <SchoolLayout title="Электронный дневник">
            <Helmet>
                <title>Дневник | {className}</title>
            </Helmet>

            <div className="max-w-4xl mx-auto space-y-6 pb-20">
                {/* Controls */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-[32px] border-2 border-slate-100 shadow-xl shadow-slate-100/50">
                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full md:w-auto">
                        <TabsList className="bg-slate-100/50 p-1 rounded-2xl h-12 w-full md:w-auto">
                            <TabsTrigger value="day" className="rounded-xl h-10 px-6 font-bold data-[state=active]:bg-white data-[state=active]:shadow-md">День</TabsTrigger>
                            <TabsTrigger value="week" className="rounded-xl h-10 px-6 font-bold data-[state=active]:bg-white data-[state=active]:shadow-md">Неделя</TabsTrigger>
                            <TabsTrigger value="month" className="rounded-xl h-10 px-6 font-bold data-[state=active]:bg-white data-[state=active]:shadow-md">Месяц</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={handlePrev} className="rounded-2xl h-12 w-12 hover:bg-slate-50 text-slate-400 hover:text-primary">
                            <ChevronLeft className="w-6 h-6" />
                        </Button>
                        <div className="text-center min-w-[200px]">
                            <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">
                                {viewMode === 'day' && `${selectedDate.getDate()} ${MONTHS_RU[selectedDate.getMonth()]}`}
                                {viewMode === 'week' && getWeekLabel()}
                                {viewMode === 'month' && `${MONTHS_RU[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`}
                            </h2>
                            {viewMode === 'day' && (
                                <p className="text-xs font-bold text-slate-400 mt-0.5">{DAYS_RU[selectedDate.getDay()]}</p>
                            )}
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleNext} className="rounded-2xl h-12 w-12 hover:bg-slate-50 text-slate-400 hover:text-primary">
                            <ChevronRight className="w-6 h-6" />
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        {/* DAY VIEW */}
                        {viewMode === 'day' && weekSchedule[0] && (
                            <div className="space-y-6">
                                {weekSchedule[0].entries.length === 0 ? (
                                    <EmptyState />
                                ) : (
                                    weekSchedule[0].entries.map((entry, idx) => (
                                        <DiaryCard key={idx} entry={entry} getGradeColor={getGradeColor} />
                                    ))
                                )}
                            </div>
                        )}

                        {/* WEEK VIEW */}
                        {viewMode === 'week' && (
                            <div className="space-y-8">
                                {weekSchedule.map((day, dIdx) => (
                                    <div key={dIdx} className="space-y-4">
                                        <div className={cn(
                                            "flex items-center gap-3 px-4 py-2 rounded-2xl w-fit",
                                            isToday(day.date) ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-slate-100 text-slate-500"
                                        )}>
                                            <span className="font-black uppercase tracking-widest text-xs">
                                                {DAYS_RU[day.date.getDay()]}
                                            </span>
                                            <span className="font-bold opacity-80 text-xs">
                                                {day.date.getDate()} {MONTHS_RU[day.date.getMonth()]}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 pl-4 border-l-2 border-slate-100">
                                            {day.entries.length === 0 ? (
                                                <p className="text-xs font-bold text-slate-300 uppercase tracking-widest italic py-2">Выходной день / Нет занятий</p>
                                            ) : (
                                                day.entries.map((entry, idx) => (
                                                    <div key={idx} className="bg-white rounded-2xl p-4 border-2 border-slate-50 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
                                                        <div className="flex items-center gap-3 min-w-[200px]">
                                                            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-sm">{entry.lesson_number}</div>
                                                            <div>
                                                                <p className="font-bold text-slate-900">{entry.subject_name}</p>
                                                                <p className="text-[10px] uppercase font-bold text-slate-400 truncate max-w-[120px]">{entry.teacher_name}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-100 pt-2 md:pt-0 md:pl-4">
                                                            {entry.homework ? (
                                                                <p className="text-xs text-slate-600 font-medium">{entry.homework.description}</p>
                                                            ) : (
                                                                <p className="text-[10px] text-slate-300 uppercase font-black tracking-widest">Нет задания</p>
                                                            )}
                                                        </div>

                                                        {entry.grade && (
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black shadow-md ${getGradeColor(entry.grade.grade)}`}>
                                                                {entry.grade.grade}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* MONTH VIEW */}
                        {viewMode === 'month' && (
                            <Card className="rounded-[40px] border-2 border-slate-100 bg-white overflow-hidden shadow-xl shadow-slate-100/30">
                                <div className="p-8">
                                    <div className="grid grid-cols-7 gap-4 mb-4">
                                        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map(day => (
                                            <div key={day} className="text-center font-black text-slate-300 uppercase text-xs tracking-widest">{day}</div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-7 gap-4">
                                        {/* Blank cells for start of month */}
                                        {Array.from({ length: (weekSchedule[0]?.date.getDay() + 6) % 7 }).map((_, i) => (
                                            <div key={`blank-${i}`} />
                                        ))}
                                        {weekSchedule.map((day, i) => {
                                            const hasGrades = day.entries.some(e => e.grade);
                                            const isTodayDate = isToday(day.date);
                                            return (
                                                <div key={i} className={cn(
                                                    "aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 border-2 transition-all cursor-pointer hover:border-primary/50 hover:bg-primary/5",
                                                    isTodayDate ? "border-primary bg-primary/10" : "border-slate-50 bg-slate-50/50"
                                                )} onClick={() => { setSelectedDate(day.date); setViewMode('day'); }}>
                                                    <span className={cn(
                                                        "text-sm font-black",
                                                        isTodayDate ? "text-primary" : "text-slate-700"
                                                    )}>{day.date.getDate()}</span>
                                                    {hasGrades && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </Card>
                        )}
                    </>
                )}
            </div>
        </SchoolLayout>
    );
}

function EmptyState() {
    return (
        <Card className="border-2 border-dashed border-slate-200 shadow-none bg-slate-50/50 rounded-[32px]">
            <CardContent className="py-20 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-white rounded-[24px] flex items-center justify-center text-slate-300 shadow-sm border-2">
                    <CalendarIcon className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                    <h3 className="font-black text-slate-900 uppercase text-sm tracking-widest">Выходной день</h3>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Занятий не запланировано</p>
                </div>
            </CardContent>
        </Card>
    );
}

function DiaryCard({ entry, getGradeColor }: { entry: DiaryEntry, getGradeColor: (g: string) => string }) {
    return (
        <Card className="group overflow-hidden border-2 border-slate-100 hover:border-primary/20 transition-all duration-500 rounded-[32px] bg-white shadow-xl shadow-slate-100/30">
            <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
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
                                <GraduationCap className="w-3.5 h-3.5" /> {entry.teacher_name}
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 p-8 flex flex-col justify-between gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-primary">
                                    <BookOpen className="w-4 h-4" />
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
                                    <FileText className="w-4 h-4 text-slate-400" />
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
    );
}
