import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import ImageUploader, { type ImageValue } from "@/components/admin/ImageUploader";
import { Folder, FileImage, RefreshCw, Trash2, ChevronRight, Info, HardDrive, UploadCloud, FolderOpen, ExternalLink, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type BucketId = "images" | "news" | "avatars";

type StorageEntry = {
  name: string;
  id: string | null;
  metadata: Record<string, any> | null;
  updated_at: string | null;
  created_at: string | null;
};

function FilePreview({ url, alt }: { url: string; alt: string }) {
  const [ok, setOk] = useState(true);
  return (
    <div className="aspect-video bg-muted relative">
      {ok ? (
        <img
          src={url}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          onError={() => setOk(false)}
        />
      ) : null}
      {!ok ? (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground gap-2">
          <FileImage className="h-4 w-4" />
          preview
        </div>
      ) : null}
    </div>
  );
}

function joinPath(path: string, name: string) {
  return path ? `${path}/${name}` : name;
}

function splitSegments(path: string) {
  return path ? path.split("/").filter(Boolean) : [];
}

export default function AdminMedia() {
  const { toast } = useToast();
  const [bucket, setBucket] = useState<BucketId>("images");
  const [path, setPath] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUploaded, setLastUploaded] = useState<ImageValue>(null);

  const segments = useMemo(() => splitSegments(path), [path]);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["admin_media", bucket, path, refreshKey],
    queryFn: async () => {
      const { data: items, error } = await supabase.storage.from(bucket).list(path, {
        limit: 200,
        offset: 0,
        sortBy: { column: "name", order: "asc" },
      });
      if (error) throw error;
      return (items ?? []) as StorageEntry[];
    },
  });

  const folders = useMemo(() => {
    const items = data ?? [];
    // Supabase Storage marks folders as objects without id/metadata
    return items.filter((i) => !i.id && !i.metadata);
  }, [data]);

  const files = useMemo(() => {
    const items = data ?? [];
    return items.filter((i) => !!i.id);
  }, [data]);

  const goToRoot = () => setPath("");

  const goToSegment = (index: number) => {
    const next = segments.slice(0, index + 1).join("/");
    setPath(next);
  };

  const onDelete = async (name: string) => {
    const fullPath = joinPath(path, name);
    const { error } = await supabase.storage.from(bucket).remove([fullPath]);
    if (error) {
      toast({ title: "Ошибка удаления", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Удалено", description: "Файл удалён." });
    refetch();
  };

  const toPublicUrl = (name: string) => {
    const fullPath = joinPath(path, name);
    const { data } = supabase.storage.from(bucket).getPublicUrl(fullPath);
    return data.publicUrl;
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Admin Media</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <HardDrive className="w-8 h-8 text-primary" />
            Хранилище медиа
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Централизованное управление всеми файлами проекта. Выбирайте хранилище (bucket) и перемещайтесь по папкам.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="gap-2 shadow-sm bg-background"
          onClick={() => {
            setRefreshKey((x) => x + 1);
            refetch();
          }}
        >
          <RefreshCw className={isFetching ? "h-4 w-4 animate-spin text-primary" : "h-4 w-4"} />
          Обновить список
        </Button>
      </div>

      <Tabs
        value={bucket}
        onValueChange={(v) => {
          setBucket(v as BucketId);
          setPath("");
        }}
        className="w-full"
      >
        <div className="bg-muted/30 p-1.5 rounded-lg inline-flex mb-6 border border-border/50">
          <TabsList className="bg-transparent border-none">
            <TabsTrigger value="images" className="gap-2 px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <FileImage className="w-4 h-4" /> Общие
            </TabsTrigger>
            <TabsTrigger value="news" className="gap-2 px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Activity className="w-4 h-4" /> Новости
            </TabsTrigger>
            <TabsTrigger value="avatars" className="gap-2 px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <FolderOpen className="w-4 h-4" /> Аватары
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={bucket} className="mt-0 outline-none">
          <div className="grid gap-6 lg:grid-cols-[400px,1fr]">
            <div className="space-y-6">
              {/* Breadcrumbs & Path Info */}
              <Card className="p-5 space-y-4 border-primary/10 shadow-sm border-l-4 border-l-primary">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <FolderOpen className="w-4 h-4" /> Навигация
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase font-mono">
                    Storage: {bucket}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 p-3 bg-muted/50 rounded-lg border border-border/50">
                  <Button
                    type="button"
                    variant={path === "" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={goToRoot}
                    className="h-8 text-xs px-2"
                  >
                    root
                  </Button>
                  {segments.map((seg, idx) => (
                    <div key={`${seg}-${idx}`} className="flex items-center gap-1">
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      <Button
                        type="button"
                        variant={idx === segments.length - 1 ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => goToSegment(idx)}
                        className="h-8 text-xs px-2"
                      >
                        {seg}
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-2 pt-1">
                  <Info className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Все файлы, загруженные в эту секцию, попадут в папку: <code className="bg-muted px-1 rounded">{bucket}/{path || "root"}</code>
                  </p>
                </div>
              </Card>

              {/* Upload Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pl-1">
                  <UploadCloud className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold">Загрузить новый файл</h3>
                </div>
                <ImageUploader
                  bucket={bucket}
                  prefix={path || undefined}
                  label=""
                  helpText=""
                  value={lastUploaded}
                  onChange={(v) => {
                    setLastUploaded(v);
                    setRefreshKey((x) => x + 1);
                    toast({ title: "Файл загружен", description: "Обновите список, если файл не появился." });
                  }}
                />
              </div>

              {/* Quick Jump */}
              <Card className="p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Activity className="w-4 h-4 text-primary" />
                  Быстрый переход
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "hero", label: "Главная" },
                    { id: "about", label: "О школе" },
                    { id: "programs", label: "Программы" },
                    { id: "gallery", label: "Галерея" },
                    { id: "news", label: "Новости" },
                    { id: "testimonials", label: "Отзывы" }
                  ].map((p) => (
                    <Button
                      key={p.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPath(p.id)}
                      className={`justify-start gap-2 h-9 text-xs transition-all hover:bg-primary/5 hover:border-primary/20 ${path === p.id ? 'border-primary bg-primary/5 text-primary' : ''}`}
                    >
                      <Folder className="w-3.5 h-3.5 text-muted-foreground" />
                      {p.label}
                    </Button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground italic px-1 pt-1">
                  * Нажатие перенесёт вас в соответствующую системную папку.
                </p>
              </Card>
            </div>

            <Card className="flex flex-col shadow-sm border-none bg-background/50 backdrop-blur-sm">
              <div className="p-6 border-b bg-card rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <FolderOpen className="w-5 h-5 text-primary" />
                      Содержимое: {path || "/"}
                    </h2>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Folder className="w-3 h-3" /> Папок: {folders.length}</span>
                      <span className="flex items-center gap-1"><FileImage className="w-3 h-3" /> Файлов: {files.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 max-h-[1000px]">
                <div className="p-6">
                  {folders.length === 0 && files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 bg-muted/20 rounded-xl border-2 border-dashed border-border/50">
                      <div className="p-4 bg-muted rounded-full">
                        <FolderOpen className="w-10 h-10 text-muted-foreground/30" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-muted-foreground">Здесь пока пусто</p>
                        <p className="text-sm text-muted-foreground/60 max-w-[200px]">
                          Загрузите первый файл или выберите другую папку.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {folders.length ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
                            <Folder className="w-3 h-3" /> Подпапки
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {folders.map((f) => (
                              <Button
                                key={`folder-${f.name}`}
                                type="button"
                                variant="outline"
                                className="group h-12 justify-start gap-3 px-4 shadow-sm hover:border-primary/40 hover:bg-primary/5 transition-all"
                                onClick={() => setPath(joinPath(path, f.name))}
                              >
                                <Folder className="h-4 w-4 text-primary shrink-0 transition-transform group-hover:scale-110" />
                                <span className="truncate font-medium">{f.name}</span>
                                <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                              </Button>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {files.length ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
                            <FileImage className="w-3 h-3" /> Файлы в наборе
                          </div>
                          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                            {files.map((file) => {
                              const url = toPublicUrl(file.name);
                              return (
                                <Card key={`file-${file.name}`} className="group overflow-hidden border-border/60 hover:border-primary/40 hover:shadow-md transition-all">
                                  <FilePreview url={url} alt={file.name} />
                                  <div className="p-4 space-y-3 bg-card/50">
                                    <div className="text-sm font-semibold text-foreground truncate block" title={file.name}>
                                      {file.name}
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button type="button" variant="secondary" size="sm" className="h-8 flex-1 gap-2" asChild>
                                              <a href={url} target="_blank" rel="noreferrer">
                                                <ExternalLink className="w-3.5 h-3.5" /> Открыть
                                              </a>
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Открыть оригинал в новой вкладке</TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>

                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                                        onClick={() => {
                                          if (confirm(`Удалить файл ${file.name}?`)) onDelete(file.name);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
