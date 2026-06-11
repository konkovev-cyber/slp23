import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
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
    Plus, Trash2, Edit2, User, Phone, Mail, BookOpen,
    GraduationCap, Award, Clock, ChevronUp, ChevronDown, Loader2
} from "lucide-react";

type RoleType = "management" | "teacher";

type Person = {
    id: string;
    name: string;
    title: string;
    description: string | null;
    image_url: string | null;
    video_url: string | null;
    sort_order: number;
    role_type: RoleType;
    // Доп. поля (хранятся в description как JSON или отдельно)
    phone: string | null;
    email: string | null;
    education: string | null;
    category: string | null;
    experience: string | null;
    subjects: string | null;
};

const EMPTY_FORM: Partial<Person> = {
    name: "",
    title: "",
    description: "",
    image_url: null,
    video_url: "",
    phone: "",
    email: "",
    education: "",
    category: "",
    experience: "",
    subjects: "",
};

interface Props {
    roleType: RoleType;
}

export default function PersonsEditor({ roleType }: Props) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<Partial<Person>>(EMPTY_FORM);

    const queryKey = ["persons", roleType];

    const { data: persons = [], isLoading } = useQuery<Person[]>({
        queryKey,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("teachers" as any)
                .select("*")
                .eq("role_type", roleType)
                .order("sort_order", { ascending: true });
            if (error) throw error;
            return (data ?? []) as unknown as Person[];
        },
    });

    const upsertMutation = useMutation({
        mutationFn: async (values: Partial<Person>) => {
            const { id, ...payload } = values;
            const data = { ...payload, role_type: roleType };

            if (id) {
                const { error } = await supabase
                    .from("teachers" as any)
                    .update(data)
                    .eq("id", id);
                if (error) throw error;
            } else {
                const { data: maxRow } = await supabase
                    .from("teachers" as any)
                    .select("sort_order")
                    .eq("role_type", roleType)
                    .order("sort_order", { ascending: false })
                    .limit(1)
                    .maybeSingle();
                const nextOrder = ((maxRow as any)?.sort_order ?? 0) + 1;
                const { error } = await supabase
                    .from("teachers" as any)
                    .insert([{ ...data, sort_order: nextOrder }]);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            toast({ title: "Сохранено" });
            setOpen(false);
            setForm(EMPTY_FORM);
        },
        onError: (e: any) =>
            toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("teachers" as any)
                .delete()
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            toast({ title: "Удалено" });
        },
    });

    const moveMutation = useMutation({
        mutationFn: async ({ id, direction }: { id: string; direction: "up" | "down" }) => {
            const idx = persons.findIndex((p) => p.id === id);
            const swapIdx = direction === "up" ? idx - 1 : idx + 1;
            if (swapIdx < 0 || swapIdx >= persons.length) return;

            const a = persons[idx];
            const b = persons[swapIdx];

            await supabase.from("teachers" as any).update({ sort_order: b.sort_order }).eq("id", a.id);
            await supabase.from("teachers" as any).update({ sort_order: a.sort_order }).eq("id", b.id);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });

    const openEdit = (p: Person) => {
        setForm(p);
        setOpen(true);
    };

    const openNew = () => {
        setForm({ ...EMPTY_FORM, role_type: roleType });
        setOpen(true);
    };

    const isManagement = roleType === "management";

    return (
        <div className="space-y-4">
            {/* Кнопка добавить */}
            <div className="flex justify-end">
                <Button onClick={openNew} size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    {isManagement ? "Добавить руководителя" : "Добавить педагога"}
                </Button>
            </div>

            {/* Список */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Загрузка...
                </div>
            ) : persons.length === 0 ? (
                <div className="border border-dashed rounded-xl p-10 text-center text-muted-foreground text-sm">
                    <User className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p>Список пуст. Добавьте первую запись.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {persons.map((p, idx) => (
                        <div
                            key={p.id}
                            className="flex items-start gap-4 p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
                        >
                            {/* Фото */}
                            <div className="w-14 h-14 rounded-xl overflow-hidden border bg-muted shrink-0">
                                {p.image_url ? (
                                    <img
                                        src={p.image_url}
                                        alt={p.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <User className="w-6 h-6 text-muted-foreground/40" />
                                    </div>
                                )}
                            </div>

                            {/* Инфо */}
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm leading-tight">{p.name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{p.title}</p>
                                {isManagement && p.phone && (
                                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                        <Phone className="w-3 h-3" /> {p.phone}
                                    </p>
                                )}
                                {isManagement && p.email && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Mail className="w-3 h-3" /> {p.email}
                                    </p>
                                )}
                                {!isManagement && p.subjects && (
                                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                        <BookOpen className="w-3 h-3" /> {p.subjects}
                                    </p>
                                )}
                                {p.experience && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> Стаж: {p.experience}
                                    </p>
                                )}
                            </div>

                            {/* Управление */}
                            <div className="flex items-center gap-1 shrink-0">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={idx === 0}
                                    onClick={() => moveMutation.mutate({ id: p.id, direction: "up" })}
                                >
                                    <ChevronUp className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={idx === persons.length - 1}
                                    onClick={() => moveMutation.mutate({ id: p.id, direction: "down" })}
                                >
                                    <ChevronDown className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => openEdit(p)}
                                >
                                    <Edit2 className="w-4 h-4" />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive/70 hover:text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Удалить запись?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                «{p.name}» будет удалён без возможности восстановления.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                                            <AlertDialogAction
                                                className="bg-destructive hover:bg-destructive/90"
                                                onClick={() => deleteMutation.mutate(p.id)}
                                            >
                                                Удалить
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Диалог редактирования */}
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(EMPTY_FORM); }}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {form.id
                                ? "Редактировать"
                                : isManagement ? "Новый руководитель" : "Новый педагог"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Фото */}
                        <div>
                            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
                                Фото
                            </Label>
                            <ImageUploader
                                bucket="images"
                                prefix="persons"
                                label="Фото сотрудника"
                                helpText="Рекомендуется квадратное фото, мин. 300×300 px"
                                value={
                                    form.image_url
                                        ? {
                                            bucket: "images",
                                            path: form.image_url.split("/").pop() || "",
                                            publicUrl: form.image_url,
                                        }
                                        : null
                                }
                                onChange={(v) => setForm({ ...form, image_url: v?.publicUrl || null })}
                            />
                        </div>

                        {/* ФИО */}
                        <div className="grid gap-1.5">
                            <Label className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5" /> ФИО *
                            </Label>
                            <Input
                                value={form.name || ""}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="Иванова Мария Ивановна"
                            />
                        </div>

                        {/* Должность */}
                        <div className="grid gap-1.5">
                            <Label className="flex items-center gap-1.5">
                                <Award className="w-3.5 h-3.5" />
                                {isManagement ? "Должность" : "Должность / Предмет"} *
                            </Label>
                            <Input
                                value={form.title || ""}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                placeholder={isManagement ? "Директор" : "Учитель математики"}
                            />
                        </div>

                        {/* Поля для педагогов */}
                        {!isManagement && (
                            <div className="grid gap-1.5">
                                <Label className="flex items-center gap-1.5">
                                    <BookOpen className="w-3.5 h-3.5" /> Преподаваемые предметы
                                </Label>
                                <Input
                                    value={form.subjects || ""}
                                    onChange={(e) => setForm({ ...form, subjects: e.target.value })}
                                    placeholder="Математика, Алгебра, Геометрия"
                                />
                                <p className="text-[11px] text-muted-foreground">Через запятую</p>
                            </div>
                        )}

                        {/* Поля для руководства */}
                        {isManagement && (
                            <>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-1.5">
                                        <Label className="flex items-center gap-1.5">
                                            <Phone className="w-3.5 h-3.5" /> Телефон
                                        </Label>
                                        <Input
                                            value={form.phone || ""}
                                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                            placeholder="+7 (900) 000-00-00"
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label className="flex items-center gap-1.5">
                                            <Mail className="w-3.5 h-3.5" /> Email
                                        </Label>
                                        <Input
                                            value={form.email || ""}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            placeholder="director@school.ru"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Образование */}
                        <div className="grid gap-1.5">
                            <Label className="flex items-center gap-1.5">
                                <GraduationCap className="w-3.5 h-3.5" /> Образование
                            </Label>
                            <Input
                                value={form.education || ""}
                                onChange={(e) => setForm({ ...form, education: e.target.value })}
                                placeholder="МГУ, педагогический факультет, 2005"
                            />
                        </div>

                        {/* Категория / степень */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1.5">
                                <Label>Категория / степень</Label>
                                <Input
                                    value={form.category || ""}
                                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                                    placeholder="Высшая категория"
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" /> Стаж
                                </Label>
                                <Input
                                    value={form.experience || ""}
                                    onChange={(e) => setForm({ ...form, experience: e.target.value })}
                                    placeholder="15 лет"
                                />
                            </div>
                        </div>

                        {/* Описание */}
                        <div className="grid gap-1.5">
                            <Label>Описание / Биография</Label>
                            <Textarea
                                value={form.description || ""}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="Краткое описание, достижения, направления работы..."
                                className="min-h-[80px] resize-none"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => { setOpen(false); setForm(EMPTY_FORM); }}
                        >
                            Отмена
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={() => upsertMutation.mutate(form)}
                            disabled={upsertMutation.isPending || !form.name?.trim() || !form.title?.trim()}
                        >
                            {upsertMutation.isPending ? (
                                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Сохранение...</>
                            ) : "Сохранить"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
