import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    BookOpen,
    Plus,
    Trash2,
    Loader2,
    Users,
    GraduationCap,
    Link,
    ChevronRight
} from "lucide-react";
import SchoolLayout from "@/components/school/SchoolLayout";
import { toast } from "sonner";

type SchoolClass = {
    id: number;
    name: string;
    academic_year: string | null;
};

type Subject = {
    id: number;
    name: string;
};

type Assignment = {
    id: number;
    teacher_id: string;
    class_id: number;
    subject_id: number;
    profiles: { full_name: string };
    school_classes: { name: string };
    subjects: { name: string };
};

export default function AdminClassesPage() {
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);

    // Dialog states
    const [isClassOpen, setIsClassOpen] = useState(false);
    const [isSubjectOpen, setIsSubjectOpen] = useState(false);
    const [isAssignOpen, setIsAssignOpen] = useState(false);

    // Form states
    const [newClassName, setNewClassName] = useState("");
    const [newClassYear, setNewClassYear] = useState("2023/24");
    const [newSubjectName, setNewSubjectName] = useState("");

    // Assignment form
    const [asTeacherId, setAsTeacherId] = useState("");
    const [asClassId, setAsClassId] = useState("");
    const [asSubjectId, setAsSubjectId] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [cls, sub, asg, tchr] = await Promise.all([
                supabase.from("school_classes").select("*").order("name"),
                supabase.from("subjects").select("*").order("name"),
                supabase.from("teacher_assignments").select(`
                    id, teacher_id, class_id, subject_id,
                    profiles(full_name),
                    school_classes(name),
                    subjects(name)
                `),
                supabase.from("profiles")
                    .select("auth_id, full_name")
                    .in("auth_id", (await supabase.from("user_roles").select("user_id").eq("role", "teacher")).data?.map(r => r.user_id) || [])
            ]);

            setClasses(cls.data || []);
            setSubjects(sub.data || []);
            setAssignments(asg.data as any[] || []);
            setTeachers(tchr.data || []);
        } catch (error: any) {
            toast.error("Ошибка загрузки данных: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddClass = async () => {
        if (!newClassName) return;
        const { error } = await supabase.from("school_classes").insert({ name: newClassName, academic_year: newClassYear });
        if (error) toast.error(error.message);
        else {
            toast.success("Класс добавлен");
            setIsClassOpen(false);
            setNewClassName("");
            fetchData();
        }
    };

    const handleAddSubject = async () => {
        if (!newSubjectName) return;
        const { error } = await supabase.from("subjects").insert({ name: newSubjectName });
        if (error) toast.error(error.message);
        else {
            toast.success("Предмет добавлен");
            setIsSubjectOpen(false);
            setNewSubjectName("");
            fetchData();
        }
    };

    const handleAssignTeacher = async () => {
        if (!asTeacherId || !asClassId || !asSubjectId) return;
        const { error } = await supabase.from("teacher_assignments").insert({
            teacher_id: asTeacherId,
            class_id: parseInt(asClassId),
            subject_id: parseInt(asSubjectId)
        });
        if (error) toast.error(error.message);
        else {
            toast.success("Учитель назначен");
            setIsAssignOpen(false);
            fetchData();
        }
    };

    const handleDeleteAssignment = async (id: number) => {
        const { error } = await supabase.from("teacher_assignments").delete().eq("id", id);
        if (error) toast.error(error.message);
        else fetchData();
    };

    return (
        <SchoolLayout title="Структура школы">
            <Helmet>
                <title>Классы и Предметы | Админ-панель</title>
            </Helmet>

            <div className="space-y-12 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Classes */}
                    <Card className="border-2 border-slate-100 rounded-[40px] overflow-hidden shadow-2xl bg-white flex flex-col">
                        <CardHeader className="p-8 border-b bg-slate-50/50 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Users className="w-8 h-8 text-slate-900" />
                                <CardTitle className="text-2xl font-black">Классы</CardTitle>
                            </div>
                            <Dialog open={isClassOpen} onOpenChange={setIsClassOpen}>
                                <DialogTrigger asChild><Button size="icon" className="rounded-2xl bg-primary shadow-lg"><Plus /></Button></DialogTrigger>
                                <DialogContent className="rounded-[32px] p-8 max-w-sm">
                                    <DialogHeader><DialogTitle className="text-2xl font-black">Новый класс</DialogTitle></DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Название</Label>
                                            <Input value={newClassName} onChange={e => setNewClassName(e.target.value)} className="h-12 rounded-xl border-2 font-bold" />
                                        </div>
                                    </div>
                                    <DialogFooter><Button onClick={handleAddClass} className="w-full h-14 rounded-2xl bg-slate-900 font-black text-lg">Создать</Button></DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableBody>
                                    {classes.map(c => (
                                        <TableRow key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <TableCell className="py-6 px-8 font-black text-lg">{c.name}</TableCell>
                                            <TableCell className="py-6 px-8 text-right">
                                                <Button variant="ghost" size="icon" onClick={() => fetchData()} className="text-slate-300 hover:text-rose-500"><Trash2 className="w-5 h-5" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Subjects */}
                    <Card className="border-2 border-slate-100 rounded-[40px] overflow-hidden shadow-2xl bg-white flex flex-col">
                        <CardHeader className="p-8 border-b bg-slate-50/50 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-4">
                                <BookOpen className="w-8 h-8 text-slate-900" />
                                <CardTitle className="text-2xl font-black">Предметы</CardTitle>
                            </div>
                            <Dialog open={isSubjectOpen} onOpenChange={setIsSubjectOpen}>
                                <DialogTrigger asChild><Button size="icon" className="rounded-2xl bg-slate-900 shadow-lg"><Plus /></Button></DialogTrigger>
                                <DialogContent className="rounded-[32px] p-8 max-w-sm">
                                    <DialogHeader><DialogTitle className="text-2xl font-black">Новый предмет</DialogTitle></DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Название</Label>
                                            <Input value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} className="h-12 rounded-xl border-2 font-bold" />
                                        </div>
                                    </div>
                                    <DialogFooter><Button onClick={handleAddSubject} className="w-full h-14 rounded-2xl bg-primary font-black text-lg">Добавить</Button></DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableBody>
                                    {subjects.map(s => (
                                        <TableRow key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <TableCell className="py-6 px-8 font-black text-lg">{s.name}</TableCell>
                                            <TableCell className="py-6 px-8 text-right">
                                                <Button variant="ghost" size="icon" onClick={() => fetchData()} className="text-slate-300 hover:text-rose-500"><Trash2 className="w-5 h-5" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Assignments Section (The Linking) */}
                <Card className="border-2 border-slate-100 rounded-[48px] overflow-hidden shadow-2xl bg-white">
                    <CardHeader className="p-10 border-b bg-slate-50/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                <Link className="w-8 h-8" />
                            </div>
                            <div>
                                <CardTitle className="text-3xl font-black">Назначения учителей</CardTitle>
                                <CardDescription className="font-bold text-slate-500">Связь: Учитель + Класс + Предмет</CardDescription>
                            </div>
                        </div>
                        <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                            <DialogTrigger asChild>
                                <Button className="h-14 rounded-2xl gap-2 font-black px-8 bg-slate-900 shadow-xl">
                                    <Plus className="w-6 h-6" /> Новое назначение
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="rounded-[40px] p-10 max-w-md">
                                <DialogHeader><DialogTitle className="text-2xl font-black">Создать связь</DialogTitle></DialogHeader>
                                <div className="space-y-6 py-6">
                                    <div className="space-y-2">
                                        <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 pl-1">Выберите учителя</Label>
                                        <Select value={asTeacherId} onValueChange={setAsTeacherId}>
                                            <SelectTrigger className="h-14 rounded-2xl border-2 font-bold"><SelectValue placeholder="Учитель..." /></SelectTrigger>
                                            <SelectContent className="rounded-2xl">
                                                {teachers.map(t => <SelectItem key={t.auth_id} value={t.auth_id} className="rounded-xl h-10">{t.full_name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 pl-1">Выберите класс</Label>
                                        <Select value={asClassId} onValueChange={setAsClassId}>
                                            <SelectTrigger className="h-14 rounded-2xl border-2 font-bold"><SelectValue placeholder="Класс..." /></SelectTrigger>
                                            <SelectContent className="rounded-2xl">
                                                {classes.map(c => <SelectItem key={c.id} value={c.id.toString()} className="rounded-xl h-10">{c.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 pl-1">Выберите предмет</Label>
                                        <Select value={asSubjectId} onValueChange={setAsSubjectId}>
                                            <SelectTrigger className="h-14 rounded-2xl border-2 font-bold"><SelectValue placeholder="Предмет..." /></SelectTrigger>
                                            <SelectContent className="rounded-2xl">
                                                {subjects.map(s => <SelectItem key={s.id} value={s.id.toString()} className="rounded-xl h-10">{s.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleAssignTeacher} className="w-full h-16 rounded-3xl bg-primary text-white font-black text-xl shadow-xl shadow-primary/20">Подтвердить</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="py-24 flex justify-center"><Loader2 className="animate-spin text-primary w-12 h-12" /></div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/30">
                                        <TableHead className="py-6 px-10 font-black text-[11px] uppercase tracking-wider text-slate-400">Учитель</TableHead>
                                        <TableHead className="py-6 px-10 font-black text-[11px] uppercase tracking-wider text-slate-400">Класс</TableHead>
                                        <TableHead className="py-6 px-10 font-black text-[11px] uppercase tracking-wider text-slate-400">Предмет</TableHead>
                                        <TableHead className="py-6 px-10 text-right font-black text-[11px] uppercase tracking-wider text-slate-400 text-right">Удалить</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {assignments.map(a => (
                                        <TableRow key={a.id} className="group hover:bg-primary/[0.02] border-b border-slate-50 last:border-0 transition-colors">
                                            <TableCell className="py-8 px-10">
                                                <div className="flex items-center gap-3 font-black text-lg text-slate-900">
                                                    <GraduationCap className="w-5 h-5 text-primary" /> {a.profiles?.full_name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-8 px-10 font-bold text-slate-600">КЛАСС {a.school_classes?.name}</TableCell>
                                            <TableCell className="py-8 px-10">
                                                <Badge className="bg-slate-100 text-slate-600 border-2 border-slate-200 font-bold rounded-xl px-4 py-1">
                                                    {a.subjects?.name}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-8 px-10 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteAssignment(a.id)}
                                                    className="w-12 h-12 rounded-2xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </SchoolLayout>
    );
}
