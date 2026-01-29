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
  TableRow
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import ImageUploader, { ImageValue } from "@/components/admin/ImageUploader";
import { format } from "date-fns";
import { Plus, Trash2, Edit2, Download, AlertCircle } from "lucide-react";

type Post = {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string | null;
  image_url: string | null;
  published_at: string;
};

// Placeholder for VK Import
const ImportVkDialog = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Импорт из ВКонтакте</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="flex items-center gap-2 p-4 bg-muted text-muted-foreground rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <span>Функция находится в разработке.</span>
        </div>
        <p className="text-sm text-gray-500">
          В будущем здесь появится возможность авторизоваться через VK ID, выбрать группу и импортировать посты за указанный период.
        </p>
      </div>
    </DialogContent>
  </Dialog>
);

export default function AdminNews() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isVkOpen, setIsVkOpen] = useState(false);
  const [isLoadingFill, setIsLoadingFill] = useState(false);

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
    category: "news",
    published_at: new Date().toISOString().slice(0, 16),
    image_value: null,
  });

  const handleFetchMetadata = async () => {
    if (!importUrl) return;
    setIsFetchingInfo(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-metadata", {
        body: { url: importUrl }
      });
      if (error) throw error;

      if (data) {
        setFormData(prev => ({
          ...prev,
          title: data.title || prev.title,
          excerpt: data.description || prev.excerpt,
          content: data.description || prev.content, // Use description as content too
          image_value: data.image ? {
            bucket: "news",
            path: "external_link_no_delete",
            publicUrl: data.image,
            alt: data.title
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
      const payload = {
        title: values.title,
        slug: values.slug || values.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
        excerpt: values.excerpt,
        content: values.content || values.excerpt, // Fallback
        category: values.category,
        published_at: new Date(values.published_at).toISOString(),
        image_url: values.image_value?.publicUrl ?? null,
      };

      if (values.id) {
        // Update
        const { error } = await supabase.from("posts").update(payload).eq("id", values.id);
        if (error) throw error;
      } else {
        // Insert
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
      category: "news",
      published_at: new Date().toISOString().slice(0, 16),
      image_value: null,
    });
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

  const runFillImages = async () => {
    setIsLoadingFill(true);
    try {
      const { data, error } = await supabase.functions.invoke("news-fill-images", {
        body: { limit: 200 },
      });
      if (error) throw error;
      toast({
        title: "Готово",
        description: `Проверено: ${data?.scanned ?? 0}, обновлено: ${data?.updated ?? 0}.`,
      });
    } catch (err: any) {
      toast({
        title: "Ошибка",
        description: err?.message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingFill(false);
    }
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
            Добавляйте новости вручную или импортируйте из соцсетей.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsVkOpen(true)}>
            <Download className="w-4 h-4 mr-2" /> Импорт VK
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" /> Добавить новость
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{formData.id ? "Редактировать новость" : "Новая новость"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">

                {/* Import Section */}
                {!formData.id && (
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2 border border-border">
                    <Label className="text-xs uppercase text-muted-foreground">Импорт по ссылке (Telegram / VK / Сайт)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={importUrl}
                        onChange={(e) => setImportUrl(e.target.value)}
                        placeholder="https://t.me/lichnost_PLUS/461"
                        className="bg-background"
                      />
                      <Button variant="secondary" onClick={handleFetchMetadata} disabled={isFetchingInfo}>
                        {isFetchingInfo ? "Загрузка..." : "Заполнить"}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Вставьте ссылку на пост, и мы попытаемся достать заголовок, текст и картинку.
                    </p>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label>Заголовок</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Мы открыли набор..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Slug (URL)</Label>
                    <Input
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="my-otkryli-nabor"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Дата публикации</Label>
                    <Input
                      type="datetime-local"
                      value={formData.published_at}
                      onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Категория</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Краткое описание (excerpt)</Label>
                  <Textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Полный текст (content)</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={5}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Изображение</Label>
                  <ImageUploader
                    bucket="news"
                    value={formData.image_value}
                    onChange={(v) => setFormData({ ...formData, image_value: v })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Отмена</Button>
                <Button onClick={() => upsertMutation.mutate(formData)} disabled={upsertMutation.isPending}>
                  {upsertMutation.isPending ? "Сохранение..." : "Сохранить"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Дата</TableHead>
              <TableHead>Заголовок / Slug</TableHead>
              <TableHead>Категория</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell className="whitespace-nowrap">
                  {format(new Date(post.published_at), "dd.MM.yyyy")}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{post.title}</div>
                  <div className="text-xs text-muted-foreground">{post.slug}</div>
                </TableCell>
                <TableCell><span className="text-sm bg-muted px-2 py-1 rounded">{post.category}</span></TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(post)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => {
                      if (confirm("Вы уверены?")) deleteMutation.mutate(post.id);
                    }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && posts.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Нет новостей. Создайте первую!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-5 space-y-3">
        <div className="text-sm font-medium">Служебные утилиты</div>
        <Button variant="secondary" onClick={runFillImages} disabled={isLoadingFill} size="sm">
          {isLoadingFill ? "Обработка..." : "Авто-заполнение картинок из контента"}
        </Button>
      </Card>

      <ImportVkDialog isOpen={isVkOpen} onClose={() => setIsVkOpen(false)} />
    </div>
  );
}
