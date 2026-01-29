import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import ImageUploader from "@/components/admin/ImageUploader";
import { Plus, Trash2, Edit2, ArrowUp, ArrowDown } from "lucide-react";

type Teacher = {
    id: string;
    name: string;
    title: string;
    description: string | null;
    image_url: string | null;
    sort_order: number;
};

export default function AdminTeachers() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<Teacher>>({
        name: "",
        title: "",
        description: "",
        image_url: null,
    });

    const { data: teachers = [], isLoading } = useQuery({
        queryKey: ["teachers"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("teachers")
                .select("*")
                .order("sort_order", { ascending: true });
            if (error) throw error;
            return (data ?? []) as Teacher[];
        },
    });

    const upsertMutation = useMutation({
        mutationFn: async (values: Partial<Teacher>) => {
            const { id, ...payload } = values;
            if (id) {
                const { error } = await supabase.from("teachers").update(payload).eq("id", id);
                if (error) throw error;
            } else {
                // Get max order
                const { data: max } = await supabase.from("teachers").select("sort_order").order("sort_order", { ascending: false }).limit(1).single();
                const nextOrder = (max?.sort_order ?? 0) + 1;
                const { error } = await supabase.from("teachers").insert([{ ...payload, sort_order: nextOrder }]);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teachers"] });
            toast({ title: "Сохранено", description: "Данные преподавателя обновлены." });
            setIsCreateOpen(false);
            resetForm();
        },
        onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("teachers").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teachers"] });
            toast({ title: "Удалено" });
        },
    });

    const resetForm = () => {
        setFormData({ name: "", title: "", description: "", image_url: null });
    };

    const editTeacher = (t: Teacher) => {
        setFormData(t);
        setIsCreateOpen(true);
    };

    return (
        <div className="space-y-6">
            <Helmet><title>Управление преподавателями</title></Helmet>

            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Преподаватели</h1>
                <Dialog open={isCreateOpen} onOpenChange={(v) => { setIsCreateOpen(v); if (!v) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button><Plus className="w-4 h-4 mr-2" /> Добавить</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>{formData.id ? "Редактировать" : "Новый преподаватель"}</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid gap-2">
                                <Label>ФИО</Label>
                                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Иванова Мария Ивановна" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Должность / Предмет</Label>
                                <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Учитель математики" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Описание</Label>
                                <Textarea value={formData.description || ""} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Опыт 10 лет..." />
                            </div>
                            <div className="grid gap-2">
                                <Label>Фото</Label>
                                <ImageUploader
                                    bucket="images"
                                    value={formData.image_url ? { bucket: "images", path: formData.image_url.split('/').pop() || "", publicUrl: formData.image_url } : null}
                                    onChange={(v) => setFormData({ ...formData, image_url: v?.publicUrl || null })}
                                />
                            </div>
                        </div>
                        <Button onClick={() => upsertMutation.mutate(formData)} disabled={upsertMutation.isPending}>
                            {upsertMutation.isPending ? "Сохранение..." : "Сохранить"}
                        </Button>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Фото</TableHead>
                            <TableHead>Имя</TableHead>
                            <TableHead>Должность</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {teachers.map(t => (
                            <TableRow key={t.id}>
                                <TableCell>
                                    {t.image_url && <img src={t.image_url} alt="" className="w-10 h-10 rounded-full object-cover" />}
                                </TableCell>
                                <TableCell className="font-medium">{t.name}</TableCell>
                                <TableCell>{t.title}</TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => editTeacher(t)}><Edit2 className="w-4 h-4" /></Button>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(t.id)}><Trash2 className="w-4 h-4" /></Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!isLoading && teachers.length === 0 && <TableRow><TableCell colSpan={4} className="text-center">Список пуст</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
