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
import { Plus, Trash2, Edit2, Download, Share2, Globe, Calendar, Search, Wand2 as MagicWand, Image as ImageIcon, Video, X, Type, Film } from "lucide-react";

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

export default function AdminNews() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Import State
  const [importUrl, setImportUrl] = useState("");
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);

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
    mediaList?: string[]; // Array of additional image URLs
  }>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "Новости",
    published_at: new Date().toISOString().slice(0, 16),
    image_value: null,
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

    return text.toLowerCase().split('').map(char => {
      return ru[char] || char; // Transliterate or keep distinct
    }).join('').replace(/ /g, '-').replace(/[^\w-]+/g, '');
  };

  const generateUniqueSlug = (title: string) => {
    const baseSlug = transliterate(title);
    // Add 4 random chars to ensure uniqueness and prevent duplicates
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
            // remove obvious markdown bullets/headers for title/excerpt derivation
            .replace(/^\s*[#>*\-•]+\s*/gm, "")
            .trim();

        const buildTitleFromText = (t: string) => {
          const plain = toPlainText(t);
          if (!plain) return "";
          const firstLine = plain.split("\n").find(Boolean) ?? plain;
          // Prefer a short, readable title
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

        const importedImages = Array.isArray(data.mediaList) && data.mediaList.length > 0
          ? data.mediaList
          : (data.image ? [data.image] : []);

        // Use content from the response (properly decoded now)
        const importedContent = (data.content || data.description || "").trim();

        // Title priority: beginning of the news text → metadata title → existing form title
        const titleFromText = buildTitleFromText(importedContent);
        const newTitle = titleFromText || data.title || formData.title;

        // Excerpt priority: derived from imported text → metadata description → existing excerpt
        const excerptFromText = buildExcerptFromText(importedContent);
        const newExcerpt = excerptFromText || data.description || formData.excerpt;

        // Build media gallery text for additional images/videos
        let mediaGalleryText = "";
        if (importedImages.length > 1) {
          mediaGalleryText = "\n\nИзображения:\n" +
            importedImages.slice(1).map((url: string) => url).join("\n");
        }

        setFormData(prev => ({
          ...prev,
          title: newTitle,
          slug: generateUniqueSlug(newTitle),
          category: "Новости",
          excerpt: newExcerpt,
          content: (importedContent || newExcerpt) + mediaGalleryText,
          image_value: importedImages[0] ? {
            bucket: "news",
            path: "external_link_no_delete",
            publicUrl: importedImages[0],
            alt: newTitle
          } : prev.image_value,
          mediaList: importedImages,
        }));

        const imageCount = importedImages.length;
        toast({
          title: "✅ Данные загружены",
          description: `Импортировано: ${imageCount} ${imageCount === 1 ? 'изображение' : imageCount < 5 ? 'изображения' : 'изображений'}`
        });
      }
    } catch (e: any) {
      console.error("Import error:", e);
      toast({
        title: "Ошибка импорта",
        description: e.message || "Не удалось загрузить данные. Проверьте URL и доступность ссылки.",
        variant: "destructive"
      });
      console.error("DEBUG: Import Full Error:", e);
    } finally {
      setIsFetchingInfo(false);
    }
  };

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["admin_posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Post[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_posts"] });
      toast({ title: "Удалено", description: "Новость успешно удалена." });
    },
    onError: (err: any) => {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (values: typeof formData) => {
      // Logic for final slug gen
      const finalSlug = values.slug ? values.slug : generateUniqueSlug(values.title);

      const payload = {
        title: values.title,
        slug: finalSlug,
        excerpt: values.excerpt,
        content: values.content || values.excerpt, // Fallback
        category: values.category,
        published_at: new Date(values.published_at).toISOString(),
        image_url: values.image_value?.publicUrl ?? null,
      };

      const mediaUrls = Array.from(
        new Set(
          [values.image_value?.publicUrl, ...(values.mediaList ?? [])]
            .filter(Boolean)
            .map((u) => String(u))
        )
      );

      const syncPostMedia = async (postId: string) => {
        // Replace media rows atomically-ish (best effort): delete then insert
        const { error: delErr } = await supabase
          .from("post_media")
          .delete()
          .eq("post_id", postId);
        if (delErr) throw delErr;

        if (mediaUrls.length === 0) return;

        const rows = mediaUrls.map((url, idx) => ({
          post_id: postId,
          media_url: url,
          media_type: "image",
          display_order: idx,
          alt_text: values.title,
        }));

        const { error: insErr } = await supabase.from("post_media").insert(rows);
        if (insErr) throw insErr;
      };

      if (values.id) {
        const { error } = await supabase.from("posts").update(payload).eq("id", values.id);
        if (error) throw error;
        await syncPostMedia(values.id);
      } else {
        const { data, error } = await supabase
          .from("posts")
          .insert([payload])
          .select("id")
          .single();
        if (error) throw error;
        if (data?.id) await syncPostMedia(data.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_posts"] });
      toast({ title: "Сохранено", description: "Новость успешно сохранена." });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      category: "Новости",
      published_at: new Date().toISOString().slice(0, 16),
      image_value: null,
      mediaList: [],
    });
    setImportUrl("");
  };

  const handleEdit = async (post: Post) => {
    try {
      const { data: mediaRows, error } = await supabase
        .from("post_media")
        .select("media_url, display_order")
        .eq("post_id", post.id)
        .order("display_order", { ascending: true });
      if (error) throw error;

      const mediaList = (mediaRows ?? []).map((r) => r.media_url).filter(Boolean);

      setFormData({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt ?? "",
        content: post.content ?? "",
        category: post.category,
        published_at: new Date(post.published_at).toISOString().slice(0, 16),
        image_value: post.image_url
          ? {
              bucket: "news",
              path: post.image_url.split("/").pop() ?? "",
              publicUrl: post.image_url,
            }
          : null,
        mediaList: mediaList.length > 0 ? mediaList : post.image_url ? [post.image_url] : [],
      });
      setIsCreateOpen(true);
    } catch (e: any) {
      toast({
        title: "Ошибка",
        description: e.message || "Не удалось загрузить медиа для новости.",
        variant: "destructive",
      });
    }
  };

  /* --- NEW STATES FOR UI --- */
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  /* --- ACTIONS --- */
  // Auto-generate excerpt from content
  const generateExcerpt = () => {
    if (!formData.content) return;
    // Take first 150 chars or first sentence
    const plainText = formData.content.replace(/[#*`]/g, ''); // Simple markdown strip
    const sentenceEnd = plainText.indexOf('.');
    const cutIndex = sentenceEnd > 0 && sentenceEnd < 200 ? sentenceEnd + 1 : 160;
    const generated = plainText.slice(0, cutIndex).trim() + (plainText.length > cutIndex ? "..." : "");
    setFormData({ ...formData, excerpt: generated });
    toast({ title: "Сгенерировано", description: "Краткое описание создано из текста." });
  };

  /* --- FILTERING & PAGINATION LOGIC --- */
  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPosts.length / itemsPerPage);
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Helper to determine status
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
              {/* ... (Existing Dialog Content Header) ... */}
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {formData.id ? "Редактировать новость" : "Новая новость"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* ... (Import Block remains same) ... */}
                {!formData.id && (
                  <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 shadow-sm">
                    <div className="flex flex-col gap-2">
                      <Label className="text-xs font-semibold text-primary/70 uppercase tracking-wider">
                        🌐 Импорт из внешних источников
                      </Label>
                      <p className="text-xs text-muted-foreground mb-1">
                        Поддерживаются: Telegram, VK, и другие сайты с Open Graph метаданными
                      </p>
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
                  {/* ... (Existing Fields) ... */}
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

                  {/* Content First to allow generation */}
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

                    {/* Media Gallery Preview */}
                    {formData.mediaList && formData.mediaList.length > 0 && (
                      <div className="space-y-3 pt-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold text-muted-foreground">
                            📸 Импортированные изображения ({formData.mediaList.length})
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs text-destructive"
                            onClick={() => setFormData({ ...formData, mediaList: [] })}
                          >
                            <X className="w-3 h-3 mr-1" />
                            Очистить все
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {formData.mediaList.map((url, idx) => (
                            <div key={idx} className="relative group">
                              <div className="aspect-square rounded-lg overflow-hidden bg-muted border border-border">
                                <img
                                  src={url}
                                  alt={`Изображение ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23ddd" width="100" height="100"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999">Ошибка</text></svg>';
                                  }}
                                />
                              </div>
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                onClick={() => {
                                  const newList = formData.mediaList?.filter((_, i) => i !== idx) || [];
                                  setFormData({ ...formData, mediaList: newList });
                                }}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                              <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                                #{idx + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          💡 Первое изображение используется как обложка. Остальные добавлены в текст новости.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end items-center gap-3 pt-6 border-t mt-4">
                <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>
                  Отмена
                </Button>
                <Button
                  onClick={() => upsertMutation.mutate(formData)}
                  disabled={upsertMutation.isPending}
                  className="px-8"
                >
                  {upsertMutation.isPending ? "Сохранение..." : "Сохранить"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-xl border border-border shadow-sm overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-semibold px-6 w-[140px]">Дата</TableHead>
              <TableHead className="font-semibold px-6">Заголовок</TableHead>
              <TableHead className="font-semibold px-6 text-center">Статус</TableHead>
              <TableHead className="font-semibold px-6 text-center">Категория</TableHead>
              <TableHead className="w-[100px] px-6"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPosts.map((post) => (
              <TableRow key={post.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="px-6 py-4 text-muted-foreground text-sm">
                  {format(new Date(post.published_at), "dd.MM.yyyy")}
                  <div className="text-[10px] opacity-70">{format(new Date(post.published_at), "HH:mm")}</div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="font-semibold text-foreground line-clamp-1">{post.title}</div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5 line-clamp-1 opacity-70">/{post.slug}</div>
                </TableCell>
                <TableCell className="px-6 py-4 text-center">
                  {getPostStatus(post.published_at)}
                </TableCell>
                <TableCell className="px-6 py-4 text-center">
                  <Badge variant="outline" className="font-normal bg-primary/5 border-primary/10">
                    {post.category}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(post)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                      onClick={() => {
                        if (confirm("Вы уверены?")) deleteMutation.mutate(post.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && filteredPosts.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Share2 className="w-8 h-8 opacity-20" />
                    <p>
                      {searchTerm ? "Ничего не найдено по вашему запросу." : "Нет новостей. Создайте первую!"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Назад
          </Button>
          <span className="text-sm font-medium text-muted-foreground">
            Страница {currentPage} из {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Вперед
          </Button>
        </div>
      )}
    </div>
  );
}
