import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, GripVertical, Save } from "lucide-react";
import { useState } from "react";
import ImageUploader from "@/components/admin/ImageUploader";

type GalleryItem = {
    id: string;
    url: string;
    title: string;
    category: string;
    sort_order: number;
};

export default function AdminGallery() {
    const { toast } = useToast();
    const qc = useQueryClient();
    const [isAdding, setIsAdding] = useState(false);
    const [newImage, setNewImage] = useState({ url: "", title: "", category: "Школьная жизнь" });

    const { data: images = [], isLoading } = useQuery({
        queryKey: ["gallery"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("gallery" as any)
                .select("*")
                .order("sort_order", { ascending: true });
            if (error) throw error;
            return (data ?? []) as any[];
        },
    });

    const createMutation = useMutation({
        mutationFn: async (item: Partial<GalleryItem>) => {
            const { error } = await supabase.from("gallery" as any).insert(item);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["gallery"] });
            setIsAdding(false);
            setNewImage({ url: "", title: "", category: "Школьная жизнь" });
            toast({ title: "Фото добавлено" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("gallery" as any).delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["gallery"] });
            toast({ title: "Фото удалено" });
        },
    });

    return (
        <div className="space-y-6">
            <Helmet>
                <title>Управление галереей</title>
            </Helmet>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Фотогалерея</h1>
                    <p className="text-sm text-muted-foreground">Загрузка и управление фотографиями на странице галереи.</p>
                </div>
                <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
                    <Plus className="h-4 w-4 mr-2" /> Добавить фото
                </Button>
            </div>

            {isAdding && (
                <Card className="p-5 space-y-4 border-primary/50">
                    <h2 className="font-bold">Новое изображение</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Название</Label>
                            <Input
                                value={newImage.title}
                                onChange={(e) => setNewImage({ ...newImage, title: e.target.value })}
                                placeholder="Например: Праздник осени"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Категория</Label>
                            <Input
                                value={newImage.category}
                                onChange={(e) => setNewImage({ ...newImage, category: e.target.value })}
                                placeholder="Обучение, Мероприятия..."
                            />
                        </div>
                    </div>
                    <ImageUploader
                        bucket="images"
                        prefix="gallery"
                        label="Фотография"
                        value={null}
                        onChange={(img) => setNewImage({ ...newImage, url: img?.publicUrl ?? "" })}
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsAdding(false)}>Отмена</Button>
                        <Button onClick={() => createMutation.mutate(newImage)} disabled={!newImage.url || createMutation.isPending}>
                            {createMutation.isPending ? "Загрузка..." : "Сохранить"}
                        </Button>
                    </div>
                </Card>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {images.map((img) => (
                    <Card key={img.id} className="relative group overflow-hidden">
                        <img src={img.url} alt={img.title} className="w-full aspect-video object-cover" />
                        <div className="p-3 bg-background">
                            <div className="font-bold text-sm truncate">{img.title || "Без названия"}</div>
                            <div className="text-[10px] text-muted-foreground uppercase">{img.category}</div>
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                    if (confirm("Удалить это фото?")) deleteMutation.mutate(img.id);
                                }}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            {images.length === 0 && !isLoading && !isAdding && (
                <div className="text-center py-20 border-2 border-dashed rounded-xl">
                    <p className="text-muted-foreground">В галерее пока нет фотографий.</p>
                    <Button variant="link" onClick={() => setIsAdding(true)}>Добавьте первую</Button>
                </div>
            )}
        </div>
    );
}
