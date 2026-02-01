import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import {
    BookOpen,
    Plus,
    Calendar,
    Loader2,
    Trash2,
    GraduationCap,
    ClipboardCheck,
    FileText,
    ChevronRight,
    MapPin
} from "lucide-react";
import SchoolLayout from "@/components/school/SchoolLayout";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

type Assignment = {
    id: number;
    class_id: number;
    subject_id: number;
    school_classes: { name: string };
    subjects: { name: string };
};

type Homework = {
    id: number;
    title: string;
    description: string;
    due_date: string;
    teacher_assignment_id: number;
    assignment: {
        school_classes: { name: string };
        subjects: { name: string };
    };
};

export default function TeacherHomeworkPage() {
    const { userId } = useAuth();
    const [loading, setLoading] = useState(true);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
    const [isAddOpen, setIsAddOpen] = useState(false);

    // Form
    const [formAssignmentId, setFormAssignmentId] = useState("");
    const [formTitle, setFormTitle] = useState("");
    const [formDesc, setFormDesc] = useState("");
    const [formDueDate, setFormDueDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);

    useEffect(() => {
        if (userId) fetchData();
    }, [userId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [asg, hw] = await Promise.all([
                supabase.from("teacher_assignments").select("id, class_id, subject_id, school_classes(name), subjects(name)").eq("teacher_id", userId),
                supabase.from("homework").select(`
                    id, title, description, due_date, teacher_assignment_id,
                    assignment:teacher_assignments(
                        school_classes(name),
                        subjects(name)
                    )
                `).in("teacher_assignment_id", (await supabase.from("teacher_assignments").select("id").eq("teacher_id", userId)).data?.map(a => a.id) || [])
            ]);

            setAssignments(asg.data as any[] || []);
            setHomeworkList(hw.data as any[] || []);
            if (asg.data?.length) setFormAssignmentId(asg.data[0].id.toString());
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddHomework = async () => {
        if (!formTitle || !formAssignmentId) return;
        try {
            const { error } = await supabase.from("homework").insert({
                teacher_assignment_id: parseInt(formAssignmentId),
                title: formTitle,
                description: formDesc,
                due_date: formDueDate
            });
            if (error) throw error;
            toast.success("Домашнее задание добавлено");
            setIsAddOpen(false);
            setFormTitle("");
            setFormDesc("");
            fetchData();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleDeleteHomework = async (id: number) => {
        const { error } = await supabase.from("homework").delete().eq("id", id);
        if (error) toast.error(error.message);
        else fetchData();
    };

    return (
        <SchoolLayout title="Домашние задания">
            <Helmet>
                <title>ДЗ | Преподаватель</title>
            </Helmet>

            <div className="space-y-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[32px] border-2 border-slate-100 shadow-xl shadow-slate-100/50">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                            <BookOpen className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black">Управление ДЗ</h2>
                            <p className="font-bold text-slate-400">Назначайте и отслеживайте задания для ваших классов</p>
                        </div>
                    </div>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-14 rounded-2xl gap-3 font-black px-8 bg-slate-900 shadow-xl hover:translate-y-[-2px] transition-all">
                                <Plus className="w-6 h-6" /> Новое задание
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-[40px] p-10 max-w-lg">
                            <DialogHeader>
                                <DialogTitle className="text-3xl font-black">Новое ДЗ</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6 py-6">
                                <div className="space-y-2">
                                    <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 pl-1">Класс и Предмет</Label>
                                    <Select value={formAssignmentId} onValueChange={setFormAssignmentId}>
                                        <SelectTrigger className="h-14 rounded-2xl border-2 font-bold"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-2xl">
                                            {assignments.map(a => (
                                                <SelectItem key={a.id} value={a.id.toString()} className="h-12 font-bold rounded-xl">
                                                    {a.school_classes.name} • {a.subjects.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 pl-1">Заголовок</Label>
                                    <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Напр.: Параграф 12, упр. 5" className="h-14 rounded-2xl border-2 font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 pl-1">Описание / Текст задания</Label>
                                    <Textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} className="min-h-[120px] rounded-2xl border-2 font-bold p-5" placeholder="Подробности задания..." />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 pl-1">Срок сдачи (Due Date)</Label>
                                    <Input type="date" value={formDueDate} onChange={e => setFormDueDate(e.target.value)} className="h-14 rounded-2xl border-2 font-bold" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAddHomework} className="w-full h-16 rounded-3xl bg-primary text-white font-black text-xl shadow-xl shadow-primary/20">
                                    Опубликовать задание
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-20">
                    {loading ? (
                        <div className="col-span-full py-24 flex justify-center"><Loader2 className="animate-spin text-primary w-12 h-12" /></div>
                    ) : homeworkList.length === 0 ? (
                        <Card className="col-span-full border-2 border-dashed border-slate-200 p-24 text-center rounded-[48px] bg-slate-50/50">
                            <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold italic">Вы еще не добавили ни одного задания</p>
                        </Card>
                    ) : (
                        homeworkList.map(hw => (
                            <Card key={hw.id} className="group border-2 border-slate-100 rounded-[40px] overflow-hidden shadow-2xl bg-white hover:border-primary/20 transition-all duration-500 flex flex-col">
                                <CardHeader className="p-8 border-b bg-slate-50/50">
                                    <div className="flex items-center justify-between mb-4">
                                        <Badge className="bg-white border-2 border-slate-100 text-slate-400 font-black h-10 px-4 rounded-xl flex items-center gap-2">
                                            <Calendar className="w-4 h-4" /> До {new Date(hw.due_date).toLocaleDateString('ru-RU')}
                                        </Badge>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteHomework(hw.id)} className="h-10 w-10 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                    </div>
                                    <CardTitle className="text-2xl font-black text-slate-900 mb-1 group-hover:text-primary transition-colors">{hw.title}</CardTitle>
                                    <CardDescription className="flex items-center gap-2 font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                                        <GraduationCap className="w-4 h-4" /> {hw.assignment.school_classes.name} • {hw.assignment.subjects.name}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 flex-1">
                                    <div className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-50 min-h-[100px] flex items-center">
                                        <p className="text-slate-600 font-bold italic leading-relaxed">{hw.description}</p>
                                    </div>
                                </CardContent>
                                <div className="p-8 pt-0 flex justify-end">
                                    <Button variant="ghost" className="rounded-xl font-black text-[10px] uppercase tracking-[0.2em] text-primary gap-2 hover:bg-primary/5">
                                        Посмотреть ответы <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </SchoolLayout>
    );
}
