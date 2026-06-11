import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Trophy, Star, Medal, Award, Edit2, Loader2, User } from "lucide-react";
import { useState } from "react";
import ImageUploader from "@/components/admin/ImageUploader";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type HonorItem = {
    id: string;
    name: string;
    achievement: string;
    image_url: string;
    category: string;
    year: string;
};

const CATEGORIES = [
    { id: "scientific", label: "Наука",      icon: Trophy },
    { id: "sports",     label: "Спорт",      icon: Medal  },
    { id: "creative",   label: "Творчество", icon: Award  },
];

const EMPTY_FORM = {
    name: "",
    achievement: "",
    category: "scientific",
    year: String(new Date().getFullYear()),
    image_data: null as any,
};

function getCategoryLabel(id: string) {
    return CATEGORIES.find(c => c.id === id)?.label ?? id;
}
function getCategoryIcon(id: string) {
    const C = CATEGORIES.find(c => c.id === id);
    return C ? C.icon : Trophy;
}

export default function AdminHonor() {
    const { toast } = useToast();
    const qc = useQueryClient();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });

    /* ─── данные ─── */
    const { data: items = [], isLoading } = useQuery({
        queryKey: ["honor_board"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("honor_board" as any)
                .select("*")
                .order("year", { ascending: false });
            if (error) throw error;
            return (data ?? []) as HonorItem[];
        },
    });

    const { data: students = [] } = useQuery({
        queryKey: ["admin_students_list"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("profiles")
                .select("auth_id, full_name, avatar_url")
                .eq("role", "student")
                .order("full_name");
            if (error) throw error;
            return data || [];
        },
    });

    /* ─── мутации ─── */
    const upsertMutation = useMutation({
        mutationFn: async () => {
            const payload = {
                name:        form.name,
                achievement: form.achievement,
                category:    form.category,
                year:        form.year,
                image_url:   form.image_data?.publicUrl || "",
            };

            if (editId) {
                const { error } = await supabase
                    .from("honor_board" as any)
                    .update(payload)
                    .eq("id", editId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("honor_board" as any)
                    .insert(payload);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["honor_board"] });
            toast({ title: editId ? "Обновлено" : "Добавлено" });
            closeDialog();
        },
        onError: (e: any) =>
            toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("honor_board" as any)
                .delete()
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["honor_board"] });
            toast({ title: "Удалено" });
        },
        onError: (e: any) =>
            toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
    });

    /* ─── хелперы ─── */
    const openNew = () => {
        setEditId(null);
        setForm({ ...EMPTY_FORM });
        setDialogOpen(true);
    };

    const openEdit = (item: HonorItem) => {
        setEditId(item.id);
        setForm({
            name:        item.name,
            achievement: item.achievement,
            category:    item.category,
            year:        item.year,
            image_data:  item.image_url
                ? { publicUrl: item.image_url, bucket: "images", path: item.image_url.split("/").pop() || "" }
                : null,
        });
        setDialogOpen(true);
    };

    const closeDialog = () => {
        setDialogOpen(false);
        setEditId(null);
        setForm({ ...EMPTY_FORM });
    };

    /* ─── render ─── */
    return (
        <div className="space-y-6">
            <Helmet><title>Доска почёта — Админка</title></Helmet>

            {/* Заголовок */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Доска почёта</h1>
                    <p className="text-sm text-muted-foreground">
                        Управление выдающимися учениками. Нажмите <strong>✏️</strong> для редактирования.
                    </p>
                </div>
                <Button onClick={openNew} className="gap-2">
                    <Plus className="h-4 w-4" /> Добавить ученика
                </Button>
            </div>

            {/* Сетка карточек */}
            {isLoading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> Загрузка...
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-24 border-2 border-dashed rounded-xl opacity-50">
                    <Star className="w-14 h-14 mx-auto mb-4 text-primary opacity-40" />
                    <p className="text-muted-foreground font-medium">Доска почёта пока пуста</p>
                    <p className="text-xs text-muted-foreground mt-1">Нажмите «Добавить ученика»</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {items.map((item) => {
                        const Icon = getCategoryIcon(item.category);
                        return (
                            <Card
                                key={item.id}
                                className="relative group overflow-hidden border-border/50 hover:shadow-lg transition-shadow"
                            >
                                {/* Фото */}
                                <div className="relative aspect-square bg-muted">
                                    {item.image_url ? (
                                        <img
                                            src={item.image_url}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <User className="w-16 h-16 text-muted-foreground/20" />
                                        </div>
                                    )}
                                    {/* Категория бейдж */}
                                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full">
                                        <Icon className="w-3 h-3" />
                                        {getCategoryLabel(item.category)}
                                    </div>

                                    {/* Кнопки — показываем при наведении */}
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="h-8 w-8 shadow"
                                            onClick={() => openEdit(item)}
                                            title="Редактировать"
                                        >
                                            <Edit2 className="h-3.5 w-3.5" />
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="h-8 w-8 shadow"
                                                    title="Удалить"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Удалить запись?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        «{item.name}» будет удалён без возможности восстановления.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        className="bg-destructive hover:bg-destructive/90"
                                                        onClick={() => deleteMutation.mutate(item.id)}
                                                    >
                                                        Удалить
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>

                                {/* Текст */}
                                <div className="p-4">
                                    <div className="font-bold text-sm leading-tight">{item.name}</div>
                                    <div className="text-[11px] text-primary font-bold uppercase tracking-wider mt-0.5">
                                        {item.year}
                                    </div>
                                    <div className="text-sm text-muted-foreground mt-2 line-clamp-2 italic">
                                        «{item.achievement}»
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* ─── Диалог добавления / редактирования ─── */}
            <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) closeDialog(); }}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editId ? "Редактировать запись" : "Новый ученик на доску почёта"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Имя / выбор из базы */}
                        <div className="grid gap-1.5">
                            <Label>Ученик *</Label>
                            <Select
                                value={form.name}
                                onValueChange={(v) => setForm({ ...form, name: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Выберите ученика из базы…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {students.map((s: any) => (
                                        <SelectItem key={s.auth_id} value={s.full_name}>
                                            {s.full_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {/* Или вручную */}
                            <Input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="…или введите имя вручную"
                                className="mt-1"
                            />
                        </div>

                        {/* Достижение */}
                        <div className="grid gap-1.5">
                            <Label>Достижение *</Label>
                            <Input
                                value={form.achievement}
                                onChange={(e) => setForm({ ...form, achievement: e.target.value })}
                                placeholder="Победитель олимпиады по физике 2026"
                            />
                        </div>

                        {/* Категория + Год */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1.5">
                                <Label>Категория</Label>
                                <Select
                                    value={form.category}
                                    onValueChange={(v) => setForm({ ...form, category: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map(c => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-1.5">
                                <Label>Год</Label>
                                <Input
                                    value={form.year}
                                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                                    placeholder="2026"
                                    maxLength={4}
                                />
                            </div>
                        </div>

                        {/* Фото */}
                        <div className="grid gap-1.5">
                            <Label>Фотография</Label>
                            <ImageUploader
                                bucket="images"
                                prefix="honor"
                                label="Фото ученика"
                                value={form.image_data}
                                onChange={(v) => setForm({ ...form, image_data: v })}
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button variant="outline" className="flex-1" onClick={closeDialog}>
                            Отмена
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={() => upsertMutation.mutate()}
                            disabled={
                                upsertMutation.isPending ||
                                !form.name.trim() ||
                                !form.achievement.trim()
                            }
                        >
                            {upsertMutation.isPending ? (
                                <><Loader2 className="w-4 h-4 animate-spin mr-2" />Сохранение...</>
                            ) : editId ? "Обновить" : "Сохранить"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
