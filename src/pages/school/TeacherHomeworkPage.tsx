import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-background p-6 rounded-[24px] border border-border shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-foreground">Управление ДЗ</h2>
                            <p className="text-sm font-medium text-muted-foreground">Назначайте задания для классов</p>
                        </div>
                    </div>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-12 rounded-xl gap-2 font-bold px-6 bg-foreground shadow-md hover:translate-y-[-1px] transition-all">
                                <Plus className="w-5 h-5" /> Новое задание
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-[24px] p-6 max-w-lg">
                            <DialogHeader>
                                <DialogTitle className="text-3xl font-black">Новое ДЗ</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6 py-6">
                                <div className="space-y-2">
                                    <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground pl-1">Класс и Предмет</Label>
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
                                    <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground pl-1">Заголовок</Label>
                                    <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Напр.: Параграф 12, упр. 5" className="h-14 rounded-2xl border-2 font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground pl-1">Описание / Текст задания</Label>
                                    <Textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} className="min-h-[120px] rounded-2xl border-2 font-bold p-5" placeholder="Подробности задания..." />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground pl-1">Срок сдачи (Due Date)</Label>
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
                        <Card className="col-span-full border-2 border-dashed border-border p-24 text-center rounded-[48px] bg-muted/50">
                            <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <p className="text-muted-foreground font-bold italic">Вы еще не добавили ни одного задания</p>
                        </Card>
                    ) : (
                        homeworkList.map(hw => (
                            <Card key={hw.id} className="group border border-border rounded-[24px] overflow-hidden shadow-sm bg-background hover:border-primary/20 hover:shadow-md transition-all duration-300 flex flex-col">
                                <CardHeader className="p-5 border-b bg-muted/30">
                                    <div className="flex items-center justify-between mb-3">
                                        <Badge className="bg-background border border-border text-muted-foreground font-bold h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs shadow-none">
                                            <Calendar className="w-3.5 h-3.5" /> До {new Date(hw.due_date).toLocaleDateString('ru-RU')}
                                        </Badge>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteHomework(hw.id)} className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <CardTitle className="text-lg font-black text-foreground mb-1 group-hover:text-primary transition-colors">{hw.title}</CardTitle>
                                    <CardDescription className="flex items-center gap-1.5 font-semibold text-muted-foreground uppercase tracking-wider text-[9px]">
                                        <GraduationCap className="w-3.5 h-3.5" /> {hw.assignment.school_classes.name} • {hw.assignment.subjects.name}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-5 flex-1">
                                    <div className="bg-muted rounded-xl p-4 border border-border min-h-[80px] flex items-center">
                                        <p className="text-muted-foreground font-medium text-sm italic leading-relaxed">{hw.description}</p>
                                    </div>
                                </CardContent>
                                <div className="p-5 pt-0 flex justify-end">
                                    <Button variant="ghost" className="rounded-lg font-bold text-[10px] uppercase tracking-wider text-primary gap-1.5 hover:bg-primary/5 h-8 px-3">
                                        Ответы <ChevronRight className="w-3.5 h-3.5" />
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
