import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import ImageUploader, { ImageValue } from "@/components/admin/ImageUploader";
import { format } from "date-fns";
import { detectVideoProvider, isDirectVideoFile } from "@/lib/video-embed";
import { Plus, Trash2, Edit2, Download, Share2, Globe, Calendar, Search, Wand2 as MagicWand, Image as ImageIcon, Video, X, Type, Film, Copy, Check } from "lucide-react";
import { VkBatchImportDialog } from "@/components/admin/VkBatchImportDialog";

type Post = {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string | null;
  content?: string;
  image_url: string | null;
  published_at: string;
};

type MediaItem = {
  url: string;
  type: "image" | "video";
};

function guessMediaType(url: string): MediaItem["type"] {
  const provider = detectVideoProvider(url);
  if (provider) return "video";
  if (isDirectVideoFile(url)) return "video";
  return "image";
}

export default function AdminNews() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Import State
  const [importUrl, setImportUrl] = useState("");
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [showVkManualImport, setShowVkManualImport] = useState(false);
  const [vkText, setVkText] = useState("");
  const [vkImages, setVkImages] = useState("");

  // Form State
  const [formData, setFormData] = useState<{
    id?: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    category: string;
    published_at: string;
    image_value: ImageValue;
    source?: string;
    source_id?: string;
    mediaList?: MediaItem[];
  }>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "Новости",
    published_at: new Date().toISOString().slice(0, 16),
    image_value: null,
    source: "",
    source_id: "",
    mediaList: [],
  });

  // Helper for transliteration
  const transliterate = (text: string) => {
    const ru: Record<string, string> = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
      'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i',
      'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
      'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
      'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch',
      'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '',
      'э': 'e', 'ю': 'yu', 'я': 'ya'
    };
    return text.toLowerCase().split('').map(char => ru[char] || char).join('').replace(/ /g, '-').replace(/[^\w-]+/g, '');
  };

  const generateUniqueSlug = (title: string) => {
    const baseSlug = transliterate(title);
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    return `${baseSlug}-${randomSuffix}`;
  };

  const handleFetchMetadata = async () => {
    if (!importUrl) return;
    setIsFetchingInfo(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-metadata", {
        body: { url: importUrl }
      });
      if (error) throw error;

      if (data) {
        const toPlainText = (t: string) =>
          (t ?? "")
            .replace(/\r\n/g, "\n")
            .replace(/^\s*[#>*\-•]+\s*/gm, "")
            .trim();

        const buildTitleFromText = (t: string) => {
          const plain = toPlainText(t);
          if (!plain) return "";
          const firstLine = plain.split("\n").find(Boolean) ?? plain;
          const max = 90;
          const cutAt = (() => {
            const candidates = [".", "!", "?", ":", "—", "–"].map((c) => firstLine.indexOf(c));
            const valid = candidates.filter((i) => i > 20 && i < max);
            return valid.length ? Math.min(...valid) + 1 : -1;
          })();
          const base = (cutAt > 0 ? firstLine.slice(0, cutAt) : firstLine.slice(0, max)).trim();
          return base.length ? base : plain.slice(0, max).trim();
        };

        const buildExcerptFromText = (t: string) => {
          const plain = toPlainText(t).replace(/\s+/g, " ").trim();
          if (!plain) return "";
          const max = 180;
          const sentenceEnd = [".", "!", "?"]
            .map((c) => plain.indexOf(c))
            .filter((i) => i > 40 && i < max);
          const cut = sentenceEnd.length ? Math.min(...sentenceEnd) + 1 : Math.min(max, plain.length);
          const out = plain.slice(0, cut).trim();
          return out + (plain.length > cut ? "..." : "");
        };

        const importedMedia: MediaItem[] = Array.isArray(data.mediaList) ? data.mediaList : [];
        const importedUrlType = guessMediaType(importUrl);
        if (importedUrlType === "video" && !importedMedia.some(m => m.url === importUrl.trim())) {
          importedMedia.push({ url: importUrl.trim(), type: "video" });
        }

        const importedContent = (data.content || data.description || "").trim();
        const newTitle = data.title || buildTitleFromText(importedContent) || formData.title;
        const newExcerpt = data.description || buildExcerptFromText(importedContent) || formData.excerpt;
        const coverImage = data.image || importedMedia.find(m => m.type === "image")?.url;
        const additionalMedia = importedMedia.filter(m => m.url !== coverImage);
        let mediaGalleryText = "";

        setFormData(prev => ({
          ...prev,
          title: newTitle || "",
          slug: generateUniqueSlug(newTitle || "news"),
          category: data.source === "telegram" ? "Новости" : prev.category,
          content: importedContent || "",
          excerpt: newExcerpt || "",
          image_value: coverImage ? {
            publicUrl: coverImage,
            path: "imported",
            bucket: "news"
          } : prev.image_value,
          mediaList: additionalMedia || [],
          source: data.source || "",
        }));

        toast({
          title: "Импорт успешен",
          description: `Загружено: ${importedMedia.length} медиа`,
        });
      }
    } catch (err: any) {
      toast({
        title: "Ошибка импорта",
        description: err?.message || "Не удалось загрузить данные",
        variant: "destructive",
      });
    } finally {
      setIsFetchingInfo(false);
    }
  };

  // Быстрый импорт из VK (ручной)
  const handleVkQuickImport = () => {
    if (!vkText.trim()) {
      toast({ title: "Ошибка", description: "Введите текст из VK", variant: "destructive" });
      return;
    }

    const lines = vkText.trim().split('\n').filter(l => l.trim().length > 0);
    const title = lines[0]?.slice(0, 100).trim() || "Новости";

    // Парсим изображения из текста (если вставили с URL)
    const imageUrls = vkImages.split('\n').filter(url => url.trim().startsWith('http'));
    const mediaList: MediaItem[] = imageUrls.map(url => ({ url: url.trim(), type: "image" as const }));

    setFormData(prev => ({
      ...prev,
      title,
      slug: generateUniqueSlug(title),
      content: vkText.trim(),
      excerpt: vkText.trim().slice(0, 255) + (vkText.length > 255 ? "..." : ""),
      image_value: mediaList.length > 0 ? {
        publicUrl: mediaList[0].url,
        path: "imported",
        bucket: "news"
      } : prev.image_value,
      mediaList: mediaList.slice(1),
    }));

    setShowVkManualImport(false);
    setVkText("");
    setVkImages("");

    toast({ title: "Готово", description: "Данные вставлены в форму" });
  };

  const generateExcerpt = () => {
    const plainText = formData.content.replace(/[#*`]/g, '');
    const sentenceEnd = plainText.indexOf('.');
    const cutIndex = sentenceEnd > 0 && sentenceEnd < 200 ? sentenceEnd + 1 : 160;
    const generated = plainText.slice(0, cutIndex).trim() + (plainText.length > cutIndex ? "..." : "");
    setFormData({ ...formData, excerpt: generated });
    toast({ title: "Сгенерировано", description: "Краткое описание создано из текста." });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      category: "Новости",
      published_at: new Date().toISOString().slice(0, 16),
      image_value: null,
      source: "",
      source_id: "",
      mediaList: [],
    });
    setImportUrl("");
    setVkText("");
    setVkImages("");
    setShowVkManualImport(false);
  };

  /* --- CREATE / UPDATE MUTATIONS --- */
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: record, error } = await supabase
        .from("posts")
        .insert([{
          title: data.title,
          slug: data.slug,
          category: data.category,
          excerpt: data.excerpt,
          content: data.content,
          image_url: data.image_value?.publicUrl || null,
          published_at: data.published_at,
          source: data.source || null,
          source_id: data.source_id || null,
        }])
        .select()
        .single();
      if (error) throw error;
      return record;
    },
    onSuccess: async (record) => {
      if (formData.mediaList && formData.mediaList.length > 0) {
        const mediaRows = formData.mediaList.map((m, idx) => ({
          post_id: record.id,
          media_url: m.url,
          media_type: m.type,
          display_order: idx,
        }));
        await supabase.from("post_media").insert(mediaRows);
      }
      toast({ title: "Создано", description: "Новость опубликована" });
      resetForm();
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (err: any) => {
      toast({ title: "Ошибка", description: err?.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("posts")
        .update({
          title: data.title,
          slug: data.slug,
          category: data.category,
          excerpt: data.excerpt,
          content: data.content,
          image_url: data.image_value?.publicUrl || null,
          published_at: data.published_at,
        })
        .eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: async (id) => {
      if (formData.mediaList && formData.mediaList.length > 0) {
        await supabase.from("post_media").delete().eq("post_id", id);
        const mediaRows = formData.mediaList.map((m, idx) => ({
          post_id: id,
          media_url: m.url,
          media_type: m.type,
          display_order: idx,
        }));
        await supabase.from("post_media").insert(mediaRows);
      }
      toast({ title: "Обновлено", description: "Новость обновлена" });
      resetForm();
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (err: any) => {
      toast({ title: "Ошибка", description: err?.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!formData.title || !formData.content) {
      toast({ title: "Ошибка", description: "Заполните заголовок и текст", variant: "destructive" });
      return;
    }
    if (!formData.slug) {
      setFormData({ ...formData, slug: generateUniqueSlug(formData.title) });
      toast({ title: "Сгенерирован slug", description: "Попробуйте сохранить ещё раз" });
      return;
    }
    if (formData.id) {
      updateMutation.mutate({ id: formData.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  /* --- DELETE LOGIC --- */
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Удалено", description: "Новость удалена" });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (err: any) => {
      toast({ title: "Ошибка", description: err?.message, variant: "destructive" });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm("Вы уверены?")) deleteMutation.mutate(id);
  };

  /* --- EDIT LOGIC --- */
  const [editingId, setEditingId] = useState<string | null>(null);
  const editMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from("posts").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
    onSuccess: (post) => {
      setFormData({
        ...formData,
        id: post.id,
        title: post.title,
        slug: post.slug,
        category: post.category,
        excerpt: post.excerpt || "",
        content: post.content || "",
        published_at: post.published_at,
        image_value: post.image_url ? {
          publicUrl: post.image_url,
          path: post.image_url,
          bucket: "news"
        } : null,
      });
      setEditingId(post.id);
      setIsCreateOpen(true);
    },
  });

  const handleEdit = (id: string) => editMutation.mutate(id);

  /* --- QUERY --- */
  const { data: posts = [] } = useQuery<Post[]>({
    queryKey: ["posts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("posts").select("*").order("published_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  /* --- PAGINATION --- */
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPosts.length / itemsPerPage);
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getPostStatus = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    if (date > now) {
      return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Запланировано</Badge>;
    }
    return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Опубликовано</Badge>;
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Управление новостями</title>
      </Helmet>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Новости</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Всего новостей: {posts.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по заголовку..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-9 h-10"
            />
          </div>

          <VkBatchImportDialog onImportSuccess={() => queryClient.invalidateQueries({ queryKey: ["posts"] })} />

          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" /> Добавить
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {formData.id ? "Редактировать новость" : "Новая новость"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {!formData.id && (
                  <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 shadow-sm">
                    <div className="flex flex-col gap-2">
                      <Label className="text-xs font-semibold text-primary/70 uppercase tracking-wider">
                        🌐 Импорт из внешних источников
                      </Label>
                      <p className="text-xs text-muted-foreground mb-1">
                        Поддерживаются: Telegram, YouTube, и сайты с Open Graph
                      </p>

                      {/* VK Quick Import */}
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-2">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-yellow-700">
                            ⚠️ VK: Ручной импорт
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setShowVkManualImport(!showVkManualImport)}
                          >
                            {showVkManualImport ? "Скрыть" : "Открыть"}
                          </Button>
                        </div>

                        {showVkManualImport && (
                          <div className="space-y-3 mt-2">
                            <div>
                              <Label className="text-xs">Текст из поста</Label>
                              <Textarea
                                value={vkText}
                                onChange={(e) => setVkText(e.target.value)}
                                placeholder="Вставьте текст из поста VK..."
                                className="h-24 mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">URL изображений (по одному в строке)</Label>
                              <Textarea
                                value={vkImages}
                                onChange={(e) => setVkImages(e.target.value)}
                                placeholder="https://sun9-1.userapi.com/...&#10;https://sun9-2.userapi.com/..."
                                className="h-20 mt-1 font-mono text-xs"
                              />
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleVkQuickImport}
                              className="w-full"
                            >
                              <Copy className="w-3 h-3 mr-2" />
                              Вставить в форму
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            value={importUrl}
                            onChange={(e) => setImportUrl(e.target.value)}
                            placeholder="Вставьте ссылку на пост (Telegram, VK) или статью..."
                            className="bg-background h-10 pl-9"
                          />
                        </div>
                        <Button
                          variant="default"
                          onClick={handleFetchMetadata}
                          disabled={isFetchingInfo || !importUrl}
                          className="shrink-0 gap-2"
                        >
                          <Download className="w-4 h-4" />
                          {isFetchingInfo ? "Загрузка..." : "Импорт"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <Label className="font-medium">Заголовок</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Заголовок новости"
                      className="text-lg font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-medium">Категория</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(val) => setFormData({ ...formData, category: val })}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Выберите категорию" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Новости">Новости</SelectItem>
                        <SelectItem value="Анонсы">Анонсы</SelectItem>
                        <SelectItem value="Мероприятия">Мероприятия</SelectItem>
                        <SelectItem value="Достижения">Достижения</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-medium">Дата публикации</Label>
                    <Input
                      type="datetime-local"
                      value={formData.published_at}
                      onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
                      className="h-10"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label className="font-medium">Slug (URL)</Label>
                    <Input
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="Автоматически генерируется..."
                      className="font-mono text-sm bg-muted/30"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label className="font-medium">Полный текст (content)</Label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={8}
                      placeholder="Основной текст новости..."
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="font-medium">Краткое описание (excerpt)</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-primary"
                        onClick={generateExcerpt}
                        disabled={!formData.content}
                      >
                        <MagicWand className="w-3 h-3 mr-1" />
                        Сгенерировать из текста
                      </Button>
                    </div>
                    <Textarea
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      rows={3}
                      placeholder="Краткое содержание для карточки..."
                      className="resize-none"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-4 pt-4 border-t border-border/50">
                    <Label className="text-base font-bold flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-primary" />
                      Изображение (обложка)
                    </Label>
                    <ImageUploader
                      bucket="news"
                      value={formData.image_value}
                      onChange={(v) => setFormData({ ...formData, image_value: v })}
                    />

                    {formData.mediaList && formData.mediaList.length > 0 && (
                      <div className="space-y-3 pt-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold text-muted-foreground">
                            🖼️ Медиа ({formData.mediaList.length})
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs text-destructive"
                            onClick={() => setFormData({ ...formData, mediaList: [] })}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {formData.mediaList.map((media, idx) => (
                            <Card key={idx} className="relative group overflow-hidden">
                              {media.type === "image" ? (
                                <img src={media.url} alt={`Media ${idx}`} className="w-full h-24 object-cover" />
                              ) : (
                                <div className="w-full h-24 bg-muted flex items-center justify-center">
                                  <Video className="w-8 h-8 text-muted-foreground" />
                                </div>
                              )}
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                  const newList = formData.mediaList?.filter((_, i) => i !== idx) || [];
                                  setFormData({ ...formData, mediaList: newList });
                                }}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Отмена
                  </Button>
                  <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                    {createMutation.isPending || updateMutation.isPending ? "Сохранение..." : "Сохранить"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Заголовок</TableHead>
              <TableHead>Категория</TableHead>
              <TableHead>Дата</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPosts.map((post) => (
              <TableRow key={post.id}>
                <TableCell className="font-medium">{post.title}</TableCell>
                <TableCell>{post.category}</TableCell>
                <TableCell>{format(new Date(post.published_at), "dd.MM.yyyy HH:mm")}</TableCell>
                <TableCell>{getPostStatus(post.published_at)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(post.id)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Назад
          </Button>
          <span className="text-sm text-muted-foreground">
            Страница {currentPage} из {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Вперёд
          </Button>
        </div>
      )}
    </div>
  );
}
