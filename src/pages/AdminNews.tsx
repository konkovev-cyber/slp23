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
import { Plus, Trash2, Edit2, Download, Share2, Globe, Calendar, Search, Wand2 as MagicWand } from "lucide-react";

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
  }>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "Анонсы",
    published_at: new Date().toISOString().slice(0, 16),
    image_value: null,
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
        const newTitle = data.title || formData.title;
        setFormData(prev => ({
          ...prev,
          title: newTitle,
          slug: generateUniqueSlug(newTitle),
          excerpt: data.description || prev.excerpt,
          content: data.content || data.description || prev.content,
          image_value: data.image ? {
            bucket: "news",
            path: "external_link_no_delete",
            publicUrl: data.image,
            alt: newTitle
          } : prev.image_value
        }));
        toast({ title: "Данные загружены", description: "Поля формы заполнены." });
      }
    } catch (e: any) {
      toast({ title: "Ошибка", description: "Не удалось загрузить данные: " + e.message, variant: "destructive" });
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

      if (values.id) {
        const { error } = await supabase.from("posts").update(payload).eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("posts").insert([payload]);
        if (error) throw error;
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
      category: "Анонсы",
      published_at: new Date().toISOString().slice(0, 16),
      image_value: null,
    });
    setImportUrl("");
  };

  const handleEdit = (post: Post) => {
    setFormData({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt ?? "",
      content: post.content ?? "",
      category: post.category,
      published_at: new Date(post.published_at).toISOString().slice(0, 16),
      image_value: post.image_url ? {
        bucket: "news",
        path: post.image_url.split('/').pop() ?? "",
        publicUrl: post.image_url
      } : null
    });
    setIsCreateOpen(true);
  }

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
                        Импорт из соцсетей (VK, Telegram)
                      </Label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            value={importUrl}
                            onChange={(e) => setImportUrl(e.target.value)}
                            placeholder="Вставьте ссылку на пост VK или Telegram..."
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
                          Импорт
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

                  <div className="md:col-span-2 space-y-2 pt-2">
                    <Label className="font-medium">Изображение</Label>
                    <ImageUploader
                      bucket="news"
                      value={formData.image_value}
                      onChange={(v) => setFormData({ ...formData, image_value: v })}
                    />
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
