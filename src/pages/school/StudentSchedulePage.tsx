import { useEffect, useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar, Clock, Loader2, Info, GraduationCap, MapPin, User } from "lucide-react";
import SchoolLayout from "@/components/school/SchoolLayout";
import { toast } from "sonner";

type ScheduleEntry = {
    id: number;
    day_of_week: number;
    lesson_number: number;
    subjects: { name: string };
    teacher: { full_name: string };
    room: string | null;
    start_time: string;
    end_time: string;
};

type HomeworkEntry = {
    date: string;
    title: string;
    description: string;
    teacher_assignment_id: number;
};

const DAYS = [
    { id: 1, name: "Понедельник" },
    { id: 2, name: "Вторник" },
    { id: 3, name: "Среда" },
    { id: 4, name: "Четверг" },
    { id: 5, name: "Пятница" },
    { id: 6, name: "Суббота" },
];

const LESSON_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function StudentSchedulePage() {
    const { userId } = useAuth();
    const [loading, setLoading] = useState(true);
    const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
    const [homework, setHomework] = useState<HomeworkEntry[]>([]);
    const [className, setClassName] = useState("");
    const [now, setNow] = useState(new Date());

    const weekDates = useMemo(() => {
        const dates: Record<number, string> = {};
        const curr = new Date();
        const day = curr.getDay() || 7;
        curr.setDate(curr.getDate() - day + 1);
        for (let i = 1; i <= 6; i++) {
            dates[i] = curr.toISOString().slice(0, 10);
            curr.setDate(curr.getDate() + 1);
        }
        return dates;
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (userId) {
            fetchData();
        }
    }, [userId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: studentInfo } = await supabase
                .from("students_info" as any)
                .select("class_id, school_classes(name)")
                .eq("student_id", userId)
                .maybeSingle();

            if (!studentInfo) {
                setLoading(false);
                return;
            }

            setClassName(((studentInfo as any).school_classes as any)?.name || "");

            const { data: scheduleData } = await supabase
                .from("schedule" as any)
                .select(`
          *,
          subjects(name),
          teacher:profiles!schedule_teacher_id_fkey(full_name)
        `)
                .eq("class_id", (studentInfo as any).class_id)
                .order("day_of_week")
                .order("lesson_number");

            setSchedule((scheduleData as any[]) || []);

            const { data: assignments } = await supabase
                .from("teacher_assignments" as any)
                .select("id")
                .eq("class_id", (studentInfo as any).class_id);

            if (assignments && assignments.length > 0) {
                const assignmentIds = (assignments as any[]).map(a => a.id);
                const { data: hwData } = await supabase
                    .from("homework" as any)
                    .select("*")
                    .in("teacher_assignment_id", assignmentIds)
                    .gte("due_date", weekDates[1])
                    .lte("due_date", weekDates[6]);

                setHomework((hwData as any) || []);
            }
        } catch (error: any) {
            toast.error("Ошибка загрузки данных: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const getEntry = (day: number, lesson: number) => {
        return schedule.find((s) => s.day_of_week === day && s.lesson_number === lesson);
    };

    const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay();

    if (loading) {
        return (
            <SchoolLayout title="Расписание">
                <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-muted-foreground font-medium">Загружаем расписание занятий...</p>
                </div>
            </SchoolLayout>
        );
    }

    if (!className) return (
        <SchoolLayout title="Расписание">
            <div className="p-20 text-center space-y-6 bg-background rounded-[32px] border-2 border-border shadow-sm">
                <div className="w-20 h-20 bg-muted rounded-[32px] flex items-center justify-center mx-auto text-muted-foreground border-2 border-border border-dashed">
                    <Info className="w-10 h-10" />
                </div>
                <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Вы пока не прикреплены к классу</p>
            </div>
        </SchoolLayout>
    );

    return (
        <SchoolLayout title="Расписание занятий">
            <Helmet>
                <title>Расписание | {className}</title>
            </Helmet>

            <Card className="shadow-2xl border-2 border-border overflow-hidden rounded-[32px] bg-background mb-10">
                <CardHeader className="bg-muted/50 border-b border-border p-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-foreground flex items-center justify-center text-white shadow-xl shadow-slate-200">
                                <Calendar className="w-7 h-7" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black text-foreground uppercase">Учебное расписание</CardTitle>
                                <CardDescription className="text-sm font-bold text-muted-foreground">
                                    Класс {className} • Текущая неделя
                                </CardDescription>
                            </div>
                        </div>
                        <div className="text-center sm:text-right">
                            <div className="text-3xl font-black text-foreground tabular-nums leading-none tracking-tighter mb-2 flex items-center gap-3 justify-center sm:justify-end">
                                <Clock className="w-6 h-6 text-primary" />
                                {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-black text-[10px] px-3 py-1 uppercase tracking-widest rounded-lg">
                                {DAYS.find(d => d.id === currentDayOfWeek)?.name || "Выходной"}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30 hover:bg-muted/30 border-b-2">
                                    <TableHead className="w-20 text-center font-black text-muted-foreground uppercase tracking-widest text-[9px] border-r">Урок</TableHead>
                                    {DAYS.map((day) => {
                                        const isToday = currentDayOfWeek === day.id;
                                        const dateStr = new Date(weekDates[day.id]).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
                                        return (
                                            <TableHead key={day.id} className={`min-w-[180px] text-center py-6 border-r last:border-0 ${isToday ? "bg-primary/[0.03]" : ""}`}>
                                                <div className={`font-black uppercase tracking-[0.2em] text-[11px] mb-1 ${isToday ? "text-primary" : "text-foreground"}`}>{day.name}</div>
                                                <div className={`text-[10px] font-black ${isToday ? "text-primary/60" : "text-muted-foreground"}`}>{dateStr}</div>
                                            </TableHead>
                                        );
                                    })}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {LESSON_NUMBERS.map((lesson) => (
                                    <TableRow key={lesson} className="border-b last:border-0">
                                        <TableCell className="text-center font-black text-lg text-muted-foreground border-r bg-muted/20">{lesson}</TableCell>
                                        {DAYS.map((day) => {
                                            const entry = getEntry(day.id, lesson);
                                            const isToday = currentDayOfWeek === day.id;
                                            return (
                                                <TableCell key={day.id} className={`p-4 align-top border-r last:border-0 ${isToday ? "bg-primary/[0.01]" : ""}`}>
                                                    {entry ? (
                                                        <div className="group relative bg-background border-2 border-border p-4 rounded-2xl shadow-sm hover:shadow-xl hover:border-primary/30 hover:-translate-y-1 transition-all duration-300">
                                                            <div className="flex flex-col gap-1.5 items-center text-center">
                                                                <span className="font-black text-[14px] text-foreground group-hover:text-primary leading-tight transition-colors">{entry.subjects.name}</span>
                                                                <div className="flex flex-col gap-0.5 mt-1">
                                                                    <span className="text-[10px] font-bold text-muted-foreground flex items-center justify-center gap-1">
                                                                        <User className="w-3 h-3 shrink-0" />
                                                                        <span className="line-clamp-1">{entry.teacher.full_name}</span>
                                                                    </span>
                                                                    {entry.room && (
                                                                        <span className="text-[10px] font-bold text-muted-foreground flex items-center justify-center gap-1">
                                                                            < MapPin className="w-3 h-3 shrink-0" />
                                                                            Каб. {entry.room}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="h-12 flex items-center justify-center opacity-20">
                                                            <span className="w-8 h-1 bg-slate-200 rounded-full" />
                                                        </div>
                                                    )}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </SchoolLayout>
    );
}
