import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, Loader2, Plus, Users, Save, Trash2, GraduationCap, MapPin } from "lucide-react";
import SchoolLayout from "@/components/school/SchoolLayout";
import { toast } from "sonner";

const DAYS = [
    { id: 1, name: "Понедельник" },
    { id: 2, name: "Вторник" },
    { id: 3, name: "Среда" },
    { id: 4, name: "Четверг" },
    { id: 5, name: "Пятница" },
    { id: 6, name: "Суббота" },
];

export default function AdminSchedulePage() {
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [schedule, setSchedule] = useState<any[]>([]);
    const [isAddOpen, setIsAddOpen] = useState(false);

    // Form state
    const [formDay, setFormDay] = useState("1");
    const [formNum, setFormNum] = useState("1");
    const [formSubjectId, setFormSubjectId] = useState("");
    const [formTeacherId, setFormTeacherId] = useState("");
    const [formRoom, setFormRoom] = useState("");

    useEffect(() => {
        fetchMetadata();
    }, []);

    useEffect(() => {
        if (selectedClassId) {
            fetchSchedule();
        }
    }, [selectedClassId]);

    const fetchMetadata = async () => {
        try {
            const [{ data: cls }, { data: sub }, { data: tchr }] = await Promise.all([
                supabase.from("school_classes").select("*").order("name"),
                supabase.from("subjects").select("*").order("name"),
                supabase.from("profiles")
                    .select("auth_id, full_name")
                    .in("auth_id", (await supabase.from("user_roles").select("user_id").eq("role", "teacher")).data?.map(r => r.user_id) || [])
            ]);

            setClasses(cls || []);
            setSubjects(sub || []);
            setTeachers(tchr || []);

            if (cls?.length) setSelectedClassId(cls[0].id.toString());
        } catch (error: any) {
            toast.error("Ошибка загрузки метаданных: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchSchedule = async () => {
        setLoading(true);
        const { data } = await supabase
            .from("schedule")
            .select("*, subjects(name), teacher:profiles(full_name)")
            .eq("class_id", parseInt(selectedClassId))
            .order("day_of_week")
            .order("lesson_number");
        setSchedule(data || []);
        setLoading(false);
    };

    const handleAddLesson = async () => {
        if (!formSubjectId || !formTeacherId) {
            toast.error("Выберите предмет и учителя");
            return;
        }

        try {
            const { error } = await supabase.from("schedule").insert({
                class_id: parseInt(selectedClassId),
                subject_id: parseInt(formSubjectId),
                teacher_id: formTeacherId,
                day_of_week: parseInt(formDay),
                lesson_number: parseInt(formNum),
                room: formRoom
            });

            if (error) {
                if (error.code === '23505') throw new Error("Этот номер урока уже занят в этот день");
                throw error;
            }

            toast.success("Урок успешно добавлен");
            setIsAddOpen(false);
            fetchSchedule();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleDeleteLesson = async (id: number) => {
        try {
            const { error } = await supabase.from("schedule").delete().eq("id", id);
            if (error) throw error;
            toast.success("Урок удален");
            fetchSchedule();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <SchoolLayout title="Редактирование расписания">
            <Helmet>
                <title>Расписание (ред.) | Админ-панель</title>
            </Helmet>

            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-background p-4 rounded-[24px] border border-border shadow-sm">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <Users className="text-primary w-5 h-5" />
                        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                            <SelectTrigger className="w-full md:w-56 h-10 rounded-xl border-border font-bold text-foreground bg-muted shadow-sm text-sm">
                                <SelectValue placeholder="Выберите класс" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-2 p-1">
                                {classes.map((cls) => (
                                    <SelectItem key={cls.id} value={cls.id.toString()} className="font-bold rounded-xl h-10">
                                        Класс {cls.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-10 rounded-xl gap-2 font-bold px-5 bg-foreground shadow-md hover:translate-y-[-1px] transition-all text-sm">
                                <Plus className="w-4 h-4" /> Добавить урок
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-[24px] border max-w-md p-6">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black tracking-tight">Новый урок</DialogTitle>
                                <CardDescription className="font-bold">Добавление занятия в расписание класса</CardDescription>
                            </DialogHeader>

                            <div className="space-y-5 py-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground pl-1">День недели</Label>
                                        <Select value={formDay} onValueChange={setFormDay}>
                                            <SelectTrigger className="h-12 rounded-xl border-2 font-bold"><SelectValue /></SelectTrigger>
                                            <SelectContent className="rounded-xl border-2">
                                                {DAYS.map(d => <SelectItem key={d.id} value={d.id.toString()} className="font-bold">{d.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground pl-1">№ Урока</Label>
                                        <Input type="number" value={formNum} onChange={(e) => setFormNum(e.target.value)} className="h-12 rounded-xl border-2 font-bold" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground pl-1">Предмет</Label>
                                    <Select value={formSubjectId} onValueChange={setFormSubjectId}>
                                        <SelectTrigger className="h-12 rounded-xl border-2 font-bold"><SelectValue placeholder="Выберите предмет" /></SelectTrigger>
                                        <SelectContent className="rounded-xl border-2">
                                            {subjects.map(s => <SelectItem key={s.id} value={s.id.toString()} className="font-bold">{s.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground pl-1">Учитель</Label>
                                    <Select value={formTeacherId} onValueChange={setFormTeacherId}>
                                        <SelectTrigger className="h-12 rounded-xl border-2 font-bold"><SelectValue placeholder="Выберите учителя" /></SelectTrigger>
                                        <SelectContent className="rounded-xl border-2">
                                            {teachers.map(t => <SelectItem key={t.auth_id} value={t.auth_id} className="font-bold">{t.full_name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground pl-1">Кабинет</Label>
                                    <Input value={formRoom} onChange={(e) => setFormRoom(e.target.value)} placeholder="Номер кабинета..." className="h-12 rounded-xl border-2 font-bold" />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button onClick={handleAddLesson} className="w-full h-14 rounded-2xl font-black bg-primary shadow-lg shadow-primary/20 text-lg">
                                    Создать запись
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-20">
                    {DAYS.map((day) => {
                        const daySchedule = schedule.filter(s => s.day_of_week === day.id);
                        return (
                            <Card key={day.id} className="border border-border rounded-[24px] overflow-hidden shadow-sm bg-background hover:border-primary/20 hover:shadow-md transition-all duration-300 flex flex-col group/card">
                                <CardHeader className="bg-muted/30 p-4 border-b border-border flex-shrink-0">
                                    <CardTitle className="text-base font-black uppercase tracking-wider text-foreground flex items-center justify-between">
                                        {day.name}
                                        <Badge className="bg-foreground text-white font-bold h-6 w-6 rounded-lg flex items-center justify-center p-0 border-0 shadow-sm text-xs">
                                            {daySchedule.length}
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-3 flex-1">
                                    {loading ? (
                                        <div className="py-12 flex flex-col items-center justify-center gap-3">
                                            <Loader2 className="animate-spin text-primary w-8 h-8" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Загрузка...</span>
                                        </div>
                                    ) : daySchedule.length === 0 ? (
                                        <div className="py-12 text-center flex flex-col items-center gap-3 group-hover/card:scale-105 transition-transform">
                                            <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground">
                                                <Calendar className="w-6 h-6" />
                                            </div>
                                            <span className="text-muted-foreground font-medium italic text-xs">Нет уроков</span>
                                        </div>
                                    ) : (
                                        daySchedule.sort((a, b) => a.lesson_number - b.lesson_number).map((lesson) => (
                                            <div key={lesson.id} className="p-3 rounded-[16px] bg-background border border-border hover:bg-muted group transition-all duration-200 flex items-center gap-3 shadow-sm">
                                                <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-sm shadow-md">
                                                    {lesson.lesson_number}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-foreground text-sm truncate">{lesson.subjects.name}</div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                                                            <GraduationCap className="w-3 h-3 text-primary/60" /> {lesson.teacher?.full_name}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteLesson(lesson.id)}
                                                    className="h-8 w-8 rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </SchoolLayout>
    );
}
