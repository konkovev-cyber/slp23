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

            <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-[28px] border-2 border-slate-100 shadow-xl shadow-slate-100/50">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <Users className="text-primary w-6 h-6" />
                        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                            <SelectTrigger className="w-full md:w-64 h-12 rounded-2xl border-slate-200 font-black text-slate-900 bg-slate-50 shadow-inner">
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
                            <Button className="h-12 rounded-2xl gap-2 font-black px-8 bg-slate-900 shadow-[0_10px_20px_-5px_rgba(0,0,0,0.3)] hover:translate-y-[-2px] transition-all">
                                <Plus className="w-5 h-5" /> Добавить урок
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-[32px] border-2 max-w-md p-8">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black tracking-tight">Новый урок</DialogTitle>
                                <CardDescription className="font-bold">Добавление занятия в расписание класса</CardDescription>
                            </DialogHeader>

                            <div className="space-y-5 py-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 pl-1">День недели</Label>
                                        <Select value={formDay} onValueChange={setFormDay}>
                                            <SelectTrigger className="h-12 rounded-xl border-2 font-bold"><SelectValue /></SelectTrigger>
                                            <SelectContent className="rounded-xl border-2">
                                                {DAYS.map(d => <SelectItem key={d.id} value={d.id.toString()} className="font-bold">{d.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 pl-1">№ Урока</Label>
                                        <Input type="number" value={formNum} onChange={(e) => setFormNum(e.target.value)} className="h-12 rounded-xl border-2 font-bold" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 pl-1">Предмет</Label>
                                    <Select value={formSubjectId} onValueChange={setFormSubjectId}>
                                        <SelectTrigger className="h-12 rounded-xl border-2 font-bold"><SelectValue placeholder="Выберите предмет" /></SelectTrigger>
                                        <SelectContent className="rounded-xl border-2">
                                            {subjects.map(s => <SelectItem key={s.id} value={s.id.toString()} className="font-bold">{s.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 pl-1">Учитель</Label>
                                    <Select value={formTeacherId} onValueChange={setFormTeacherId}>
                                        <SelectTrigger className="h-12 rounded-xl border-2 font-bold"><SelectValue placeholder="Выберите учителя" /></SelectTrigger>
                                        <SelectContent className="rounded-xl border-2">
                                            {teachers.map(t => <SelectItem key={t.auth_id} value={t.auth_id} className="font-bold">{t.full_name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 pl-1">Кабинет</Label>
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
                            <Card key={day.id} className="border-2 border-slate-100 rounded-[40px] overflow-hidden shadow-2xl bg-white hover:border-primary/20 transition-all duration-500 flex flex-col group/card">
                                <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100 flex-shrink-0">
                                    <CardTitle className="text-xl font-black uppercase tracking-[0.1em] text-slate-900 flex items-center justify-between">
                                        {day.name}
                                        <Badge className="bg-slate-900 text-white font-black h-10 w-10 rounded-[14px] flex items-center justify-center p-0 border-0 shadow-lg">
                                            {daySchedule.length}
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4 flex-1">
                                    {loading ? (
                                        <div className="py-20 flex flex-col items-center justify-center gap-4">
                                            <Loader2 className="animate-spin text-primary w-10 h-10" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Синхронизация...</span>
                                        </div>
                                    ) : daySchedule.length === 0 ? (
                                        <div className="py-20 text-center flex flex-col items-center gap-4 group-hover/card:scale-105 transition-transform">
                                            <div className="w-16 h-16 rounded-3xl bg-slate-50 border-2 border-slate-100 flex items-center justify-center text-slate-200">
                                                <Calendar className="w-8 h-8" />
                                            </div>
                                            <span className="text-slate-400 font-bold italic text-sm">Уроков не запланировано</span>
                                        </div>
                                    ) : (
                                        daySchedule.sort((a, b) => a.lesson_number - b.lesson_number).map((lesson) => (
                                            <div key={lesson.id} className="p-5 rounded-[28px] bg-white border-2 border-slate-50 hover:bg-slate-50 group transition-all duration-300 flex items-center gap-5 shadow-sm hover:shadow-md">
                                                <div className="w-12 h-12 rounded-[20px] bg-primary text-white flex items-center justify-center font-black text-lg shadow-lg shadow-primary/20">
                                                    {lesson.lesson_number}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-black text-slate-900 text-base leading-tight">{lesson.subjects.name}</div>
                                                    <div className="flex flex-col mt-1">
                                                        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                                                            <GraduationCap className="w-3 h-3 text-primary/60" /> {lesson.teacher?.full_name}
                                                        </span>
                                                        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                                                            <MapPin className="w-3 h-3 text-primary/60" /> Каб. {lesson.room || '?'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteLesson(lesson.id)}
                                                    className="h-10 w-10 rounded-xl text-slate-300 opacity-0 group-hover:opacity-100 hover:text-rose-500 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"
                                                >
                                                    <Trash2 className="w-5 h-5" />
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
