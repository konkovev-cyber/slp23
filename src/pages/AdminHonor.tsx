import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Trophy, Star, Medal, Award } from "lucide-react";
import { useState } from "react";
import ImageUploader from "@/components/admin/ImageUploader";

type HonorItem = {
    id: string;
    name: string;
    achievement: string;
    image_url: string;
    category: string;
    year: string;
};

const CATEGORIES = [
    { id: "scientific", label: "Наука", icon: Trophy },
    { id: "sports", label: "Спорт", icon: Medal },
    { id: "creative", label: "Творчество", icon: Award },
];

export default function AdminHonor() {
    const { toast } = useToast();
    const qc = useQueryClient();
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState<{
        name: string;
        achievement: string;
        category: string;
        year: string;
        image_data: any;
    }>({
        name: "",
        achievement: "",
        category: "scientific",
        year: "2024",
        image_data: null
    });

    const { data: items = [], isLoading } = useQuery({
        queryKey: ["honor_board"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("honor_board" as any)
                .select("*")
                .order("created_at", { ascending: false });
            if (error) throw error;
            return (data ?? []) as any[];
        },
    });

    const createMutation = useMutation({
        mutationFn: async (item: any) => {
            const { image_data, ...rest } = item;
            const payload = { ...rest, image_url: image_data?.publicUrl || "" };
            const { error } = await supabase.from("honor_board" as any).insert(payload);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["honor_board"] });
            setIsAdding(false);
            setFormData({ name: "", achievement: "", category: "scientific", year: "2024", image_data: null });
            toast({ title: "Запись добавлена" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("honor_board" as any).delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["honor_board"] });
            toast({ title: "Запись удалена" });
        },
    });

    return (
        <div className="space-y-6">
            <Helmet>
                <title>Доска почета — Админка</title>
            </Helmet>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Доска почета</h1>
                    <p className="text-sm text-muted-foreground">Управление списком выдающихся учеников.</p>
                </div>
                <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
                    <Plus className="h-4 w-4 mr-2" /> Добавить ученика
                </Button>
            </div>

            {isAdding && (
                <Card className="p-6 space-y-4 border-primary/50 bg-primary/[0.02]">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Имя и Фамилия</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Иван Иванов"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Достижение</Label>
                            <Input
                                value={formData.achievement}
                                onChange={(e) => setFormData({ ...formData, achievement: e.target.value })}
                                placeholder="Победитель олимпиады по физике"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Категория</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Год</Label>
                            <Input
                                value={formData.year}
                                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                            />
                        </div>
                    </div>

                    <ImageUploader
                        bucket="images"
                        prefix="honor"
                        label="Фотография ученика"
                        value={formData.image_data}
                        onChange={(data) => setFormData({ ...formData, image_data: data })}
                    />

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsAdding(false)}>Отмена</Button>
                        <Button onClick={() => createMutation.mutate(formData)} disabled={!formData.name || createMutation.isPending}>
                            {createMutation.isPending ? "Сохранение..." : "Сохранить"}
                        </Button>
                    </div>
                </Card>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((item) => (
                    <Card key={item.id} className="relative group overflow-hidden border-border/50">
                        <img src={item.image_url || "/placeholder.svg"} className="w-full aspect-square object-cover" />
                        <div className="p-4">
                            <div className="font-bold">{item.name}</div>
                            <div className="text-xs text-primary font-bold uppercase tracking-wider">{item.year}</div>
                            <div className="text-sm text-muted-foreground mt-2 line-clamp-2 italic">«{item.achievement}»</div>
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                    if (confirm("Удалить запись?")) deleteMutation.mutate(item.id);
                                }}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            {items.length === 0 && !isLoading && !isAdding && (
                <div className="text-center py-20 border-2 border-dashed rounded-xl grayscale opacity-50">
                    <Star className="w-12 h-12 mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Доска почета пока пуста.</p>
                </div>
            )}
        </div>
    );
}
