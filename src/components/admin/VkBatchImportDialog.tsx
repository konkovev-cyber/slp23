import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Image as ImageIcon, Video, CheckSquare, Square } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

type VkPost = {
    source_id: string;
    published_at: string;
    title: string;
    excerpt: string;
    content: string;
    image_url: string | null;
    mediaList: Array<{ url: string; type: "image" | "video" }>;
    source: string;
    source_url: string;
};

type VkBatchImportDialogProps = {
    onImportSuccess: () => void;
};

export function VkBatchImportDialog({ onImportSuccess }: VkBatchImportDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [url, setUrl] = useState("");
    const [count, setCount] = useState(10);
    const [isLoading, setIsLoading] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const [posts, setPosts] = useState<VkPost[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const { toast } = useToast();

    const handleFetch = async () => {
        if (!url) {
            toast({ title: "Ошибка", description: "Введите ссылку на стену", variant: "destructive" });
            return;
        }
        setIsLoading(true);
        setPosts([]);
        setSelectedIds(new Set());

        try {
            const { data, error } = await supabase.functions.invoke("vk-batch-fetch", {
                body: { url, count, offset: 0 }
            });

            // Если функция вернула ошибку в поле data.error (наш формат)
            if (data?.error) throw new Error(data.error);
            // Если supabase вернул ошибку выполнения (например 401, 400)
            if (error) {
                console.error("Supabase function error:", error);
                throw error;
            }

            const items = data.items || [];
            if (items.length === 0) {
                toast({ title: "Пусто", description: "Посты не найдены. Проверьте правильность ссылки.", variant: "default" });
            } else {
                setPosts(items);
                setSelectedIds(new Set(items.map((p: VkPost) => p.source_id)));
                toast({ title: "Загружено", description: `Найдено постов: ${items.length}` });
            }
        } catch (err: any) {
            console.error("Batch fetch error:", err);
            toast({
                title: "Ошибка",
                description: err?.message || "Не удалось загрузить данные. Проверьте консоль браузера.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === posts.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(posts.map(p => p.source_id)));
        }
    };

    const togglePost = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const transliterate = (text: string) => {
        const ruMap: Record<string, string> = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i',
            'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
            'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '',
            'э': 'e', 'ю': 'yu', 'я': 'ya'
        };
        return text.toLowerCase().split('').map(char => ruMap[char] || char).join('').replace(/ /g, '-').replace(/[^\w-]+/g, '');
    };

    const generateUniqueSlug = (title: string) => {
        const baseSlug = transliterate(title);
        const randomSuffix = Math.random().toString(36).substring(2, 6);
        return `${baseSlug}-${randomSuffix}`;
    };

    const handleImport = async () => {
        if (selectedIds.size === 0) return;

        setIsImporting(true);
        let successCount = 0;
        const selectedPosts = posts.filter(p => selectedIds.has(p.source_id));

        try {
            for (const post of selectedPosts) {
                const slug = generateUniqueSlug(post.title || "vk-post");

                // 1. Вставляем пост
                const { data: record, error } = await supabase.from("posts").insert([{
                    title: post.title,
                    slug: slug,
                    category: "Новости",
                    excerpt: post.excerpt,
                    content: post.content,
                    image_url: post.image_url,
                    published_at: post.published_at,
                    source: post.source,
                    source_id: post.source_id,
                }]).select().single();

                if (error) {
                    console.error("Ошибка вставки поста:", error, post);
                    continue; // пропускаем с ошибкой, идём дальше
                }

                successCount++;

                // 2. Вставляем медиа
                if (post.mediaList && post.mediaList.length > 0) {
                    const mediaRows = post.mediaList.map((m, idx) => ({
                        post_id: record.id,
                        media_url: m.url,
                        media_type: m.type,
                        display_order: idx,
                    }));
                    await supabase.from("post_media").insert(mediaRows);
                }
            }

            toast({ title: "Успех", description: `Импортировано новостей: ${successCount}` });
            if (successCount > 0) {
                onImportSuccess();
                setIsOpen(false);
                setPosts([]);
                setUrl("");
            }
        } catch (err: any) {
            toast({ title: "Ошибка пакетного импорта", description: err?.message, variant: "destructive" });
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-blue-500/20 bg-blue-500/10 text-blue-700 hover:bg-blue-500/20">
                    <Download className="w-4 h-4 mr-2" /> Пакетный импорт VK
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-4 sm:p-6">
                <DialogHeader>
                    <DialogTitle className="text-xl">Массовый импорт со стены VK</DialogTitle>
                    <DialogDescription>
                        Загрузите посты из сообщества или профиля ВКонтакте, выберите необходимые и импортируйте их в базу данных новостей.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4 min-h-0">
                    <div className="flex gap-2 items-end shrink-0">
                        <div className="flex-1 space-y-1">
                            <Label>Ссылка на группу или профиль VK</Label>
                            <Input
                                placeholder="https://vk.com/slp23"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleFetch()}
                            />
                        </div>
                        <div className="w-24 space-y-1">
                            <Label>Кол-во</Label>
                            <Input
                                type="number"
                                min={1}
                                max={50}
                                value={count}
                                onChange={(e) => setCount(Number(e.target.value))}
                            />
                        </div>
                        <Button onClick={handleFetch} disabled={isLoading || !url} className="w-28">
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Загрузить"}
                        </Button>
                    </div>

                    {posts.length > 0 && (
                        <div className="flex items-center justify-between shrink-0 bg-muted/50 p-2 rounded-md">
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={toggleSelectAll} className="h-8">
                                    {selectedIds.size === posts.length ? (
                                        <><CheckSquare className="w-4 h-4 mr-2" /> Снять все</>
                                    ) : (
                                        <><Square className="w-4 h-4 mr-2" /> Выбрать все</>
                                    )}
                                </Button>
                                <span className="text-sm font-medium">Выбрано: {selectedIds.size} из {posts.length}</span>
                            </div>
                            <Button
                                onClick={handleImport}
                                disabled={isImporting || selectedIds.size === 0}
                                variant="default"
                            >
                                {isImporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                                Импортировать ({selectedIds.size})
                            </Button>
                        </div>
                    )}

                    <ScrollArea className="flex-1 bg-muted/20 border rounded-md">
                        <div className="p-4 space-y-3">
                            {posts.map((post) => (
                                <div
                                    key={post.source_id}
                                    className={`flex flex-col sm:flex-row gap-4 p-3 rounded-lg border transition-colors ${selectedIds.has(post.source_id) ? 'bg-primary/5 border-primary/20' : 'bg-background hover:bg-muted/50'}`}
                                >
                                    <div className="flex items-start pt-1">
                                        <Checkbox
                                            checked={selectedIds.has(post.source_id)}
                                            onCheckedChange={() => togglePost(post.source_id)}
                                            className="mt-0.5"
                                        />
                                    </div>

                                    {post.image_url && (
                                        <div className="shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-md overflow-hidden bg-muted">
                                            <img src={post.image_url} alt="Cover" className="w-full h-full object-cover" />
                                        </div>
                                    )}

                                    <div className="flex-1 flex flex-col min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-semibold text-muted-foreground">
                                                {format(new Date(post.published_at), 'd MMM yyyy, HH:mm', { locale: ru })}
                                            </span>
                                            <div className="flex gap-1 items-center">
                                                <a
                                                    href={post.source_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[10px] text-blue-500 hover:underline mr-2"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    Открыть в VK
                                                </a>
                                                {post.mediaList.map(m => m.type).filter(t => t === 'video').length > 0 && (
                                                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-muted"><Video className="w-3 h-3 mr-0.5" /> {post.mediaList.filter(t => t.type === 'video').length}</Badge>
                                                )}
                                                {post.mediaList.map(m => m.type).filter(t => t === 'image').length > 0 && (
                                                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-muted"><ImageIcon className="w-3 h-3 mr-0.5" /> {post.mediaList.filter(t => t.type === 'image').length}</Badge>
                                                )}
                                            </div>
                                        </div>

                                        <h4 className="text-sm font-semibold truncate leading-tight mb-1" title={post.title}>{post.title}</h4>
                                        <p className="text-xs text-muted-foreground line-clamp-3">
                                            {post.excerpt}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {posts.length === 0 && !isLoading && (
                                <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
                                    Введите ссылку на страницу VK и нажмите "Загрузить", чтобы выбрать посты.
                                </div>
                            )}
                            {isLoading && (
                                <div className="h-32 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                    Загрузка постов...
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
