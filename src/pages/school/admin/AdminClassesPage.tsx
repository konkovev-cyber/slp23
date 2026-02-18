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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Classes */}
                    <Card className="border border-border rounded-[24px] overflow-hidden shadow-sm bg-background flex flex-col hover:shadow-md transition-all">
                        <CardHeader className="p-5 border-b bg-muted/30 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Users className="w-6 h-6 text-foreground" />
                                <CardTitle className="text-lg font-black">Классы</CardTitle>
                            </div>
                            <Dialog open={isClassOpen} onOpenChange={setIsClassOpen}>
                                <DialogTrigger asChild><Button size="sm" className="rounded-lg bg-primary shadow-sm h-8 w-8 p-0"><Plus className="w-5 h-5" /></Button></DialogTrigger>
                                <DialogContent className="rounded-[24px] p-6 max-w-sm">
                                    <DialogHeader><DialogTitle className="text-xl font-black">Новый класс</DialogTitle></DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Название</Label>
                                            <Input value={newClassName} onChange={e => setNewClassName(e.target.value)} className="h-10 rounded-lg border font-medium" />
                                        </div>
                                    </div>
                                    <DialogFooter><Button onClick={handleAddClass} className="w-full h-10 rounded-lg bg-foreground font-bold text-sm">Создать</Button></DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableBody>
                                    {classes.map(c => (
                                        <TableRow key={c.id} className="border-b border-slate-50 hover:bg-muted/50 transition-colors">
                                            <TableCell className="py-3 px-5 font-bold text-sm text-foreground">{c.name}</TableCell>
                                            <TableCell className="py-3 px-5 text-right">
                                                <Button variant="ghost" size="icon" onClick={() => fetchData()} className="text-muted-foreground hover:text-rose-500 h-8 w-8"><Trash2 className="w-4 h-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Subjects */}
                    <Card className="border border-border rounded-[24px] overflow-hidden shadow-sm bg-background flex flex-col hover:shadow-md transition-all">
                        <CardHeader className="p-5 border-b bg-muted/30 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-3">
                                <BookOpen className="w-6 h-6 text-foreground" />
                                <CardTitle className="text-lg font-black">Предметы</CardTitle>
                            </div>
                            <Dialog open={isSubjectOpen} onOpenChange={setIsSubjectOpen}>
                                <DialogTrigger asChild><Button size="sm" className="rounded-lg bg-foreground shadow-sm h-8 w-8 p-0"><Plus className="w-5 h-5" /></Button></DialogTrigger>
                                <DialogContent className="rounded-[24px] p-6 max-w-sm">
                                    <DialogHeader><DialogTitle className="text-xl font-black">Новый предмет</DialogTitle></DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Название</Label>
                                            <Input value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} className="h-10 rounded-lg border font-medium" />
                                        </div>
                                    </div>
                                    <DialogFooter><Button onClick={handleAddSubject} className="w-full h-10 rounded-lg bg-primary font-bold text-sm">Добавить</Button></DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableBody>
                                    {subjects.map(s => (
                                        <TableRow key={s.id} className="border-b border-slate-50 hover:bg-muted/50 transition-colors">
                                            <TableCell className="py-3 px-5 font-bold text-sm text-foreground">{s.name}</TableCell>
                                            <TableCell className="py-3 px-5 text-right">
                                                <Button variant="ghost" size="icon" onClick={() => fetchData()} className="text-muted-foreground hover:text-rose-500 h-8 w-8"><Trash2 className="w-4 h-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Assignments Section (The Linking) */}
                <Card className="border border-border rounded-[24px] overflow-hidden shadow-sm bg-background hover:shadow-md transition-all">
                    <CardHeader className="p-6 border-b bg-muted/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                                <Link className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black text-foreground">Назначения учителей</CardTitle>
                                <CardDescription className="font-medium text-muted-foreground">Связь: Учитель + Класс + Предмет</CardDescription>
                            </div>
                        </div>
                        <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                            <DialogTrigger asChild>
                                <Button className="h-10 rounded-xl gap-2 font-bold px-5 bg-foreground shadow-md text-sm">
                                    <Plus className="w-4 h-4" /> Новое назначение
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="rounded-[24px] p-6 max-w-md">
                                <DialogHeader><DialogTitle className="text-xl font-black">Создать связь</DialogTitle></DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-1.5">
                                        <Label className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground pl-1">Выберите учителя</Label>
                                        <Select value={asTeacherId} onValueChange={setAsTeacherId}>
                                            <SelectTrigger className="h-10 rounded-lg border font-medium"><SelectValue placeholder="Учитель..." /></SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                {teachers.map(t => <SelectItem key={t.auth_id} value={t.auth_id} className="rounded-lg h-9">{t.full_name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground pl-1">Выберите класс</Label>
                                        <Select value={asClassId} onValueChange={setAsClassId}>
                                            <SelectTrigger className="h-10 rounded-lg border font-medium"><SelectValue placeholder="Класс..." /></SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                {classes.map(c => <SelectItem key={c.id} value={c.id.toString()} className="rounded-lg h-9">{c.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground pl-1">Выберите предмет</Label>
                                        <Select value={asSubjectId} onValueChange={setAsSubjectId}>
                                            <SelectTrigger className="h-10 rounded-lg border font-medium"><SelectValue placeholder="Предмет..." /></SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                {subjects.map(s => <SelectItem key={s.id} value={s.id.toString()} className="rounded-lg h-9">{s.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleAssignTeacher} className="w-full h-12 rounded-xl bg-primary text-white font-bold text-lg shadow-lg shadow-primary/20">Подтвердить</Button>
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
                                    <TableRow className="bg-muted/30">
                                        <TableHead className="py-3 px-6 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Учитель</TableHead>
                                        <TableHead className="py-3 px-6 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Класс</TableHead>
                                        <TableHead className="py-3 px-6 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Предмет</TableHead>
                                        <TableHead className="py-3 px-6 text-right font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Удалить</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {assignments.map(a => (
                                        <TableRow key={a.id} className="group hover:bg-muted/50 border-b border-slate-50 last:border-0 transition-colors">
                                            <TableCell className="py-4 px-6">
                                                <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                                                    <GraduationCap className="w-4 h-4 text-primary" /> {a.profiles?.full_name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-6 font-medium text-sm text-muted-foreground">КЛАСС {a.school_classes?.name}</TableCell>
                                            <TableCell className="py-4 px-6">
                                                <Badge variant="outline" className="bg-muted text-muted-foreground border border-border font-bold rounded-lg px-2.5 py-0.5 text-xs shadow-none">
                                                    {a.subjects?.name}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-4 px-6 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteAssignment(a.id)}
                                                    className="w-8 h-8 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-50 transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
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
