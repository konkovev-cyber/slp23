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
import { Folder, FileImage, RefreshCw, Trash2, ChevronRight } from "lucide-react";

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

      <div>
        <h1 className="text-2xl font-bold text-foreground">Медиа</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Загрузка и управление файлами в хранилище. Рекомендуемые папки: hero/, about/, programs/, gallery/.
        </p>
      </div>

      <Tabs
        value={bucket}
        onValueChange={(v) => {
          setBucket(v as BucketId);
          setPath("");
        }}
      >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <TabsList>
              <TabsTrigger value="images">images</TabsTrigger>
              <TabsTrigger value="news">news</TabsTrigger>
              <TabsTrigger value="avatars">avatars</TabsTrigger>
            </TabsList>

            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => {
                setRefreshKey((x) => x + 1);
                refetch();
              }}
            >
              <RefreshCw className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Обновить
            </Button>
          </div>

          <Separator className="my-6" />

          <TabsContent value={bucket}>
            <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
              <div className="space-y-6">
                <Card className="p-4 space-y-3">
                  <div className="text-sm font-medium text-foreground">Текущая папка</div>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Button type="button" variant="secondary" size="sm" onClick={goToRoot}>
                      {bucket}
                    </Button>
                    {segments.map((seg, idx) => (
                      <div key={`${seg}-${idx}`} className="flex items-center gap-2">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <Button type="button" variant="ghost" size="sm" onClick={() => goToSegment(idx)}>
                          {seg}
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">Prefix для загрузки: {path ? `${path}/` : "(root)"}</div>
                </Card>

                <ImageUploader
                  bucket={bucket}
                  prefix={path || undefined}
                  label="Загрузить изображение"
                  helpText="Файл будет загружен в выбранный bucket и текущую папку (prefix)."
                  value={lastUploaded}
                  onChange={(v) => {
                    setLastUploaded(v);
                    setRefreshKey((x) => x + 1);
                  }}
                />

                <Card className="p-4 space-y-3">
                  <div className="text-sm font-medium text-foreground">Быстрые папки</div>
                  <div className="flex flex-wrap gap-2">
                    {["hero", "about", "programs", "gallery", "news", "testimonials"].map((p) => (
                      <Button key={p} type="button" variant="outline" size="sm" onClick={() => setPath(p)}>
                        {p}/
                      </Button>
                    ))}
                  </div>
                </Card>
              </div>

              <Card className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-foreground">Файлы</div>
                    <div className="text-xs text-muted-foreground">
                      Папок: {folders.length} · Файлов: {files.length}
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <ScrollArea className="h-[70vh] pr-3">
                  {folders.length === 0 && files.length === 0 ? (
                    <div className="text-sm text-muted-foreground">В этой папке пока нет файлов.</div>
                  ) : (
                    <div className="space-y-6">
                      {folders.length ? (
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Папки
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {folders.map((f) => (
                              <Button
                                key={`folder-${f.name}`}
                                type="button"
                                variant="outline"
                                className="justify-start gap-2"
                                onClick={() => setPath(joinPath(path, f.name))}
                              >
                                <Folder className="h-4 w-4" />
                                {f.name}/
                              </Button>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {files.length ? (
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Файлы
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {files.map((file) => {
                              const url = toPublicUrl(file.name);
                              return (
                                <Card key={`file-${file.name}`} className="overflow-hidden">
                                  <FilePreview url={url} alt={file.name} />
                                  <div className="p-3 space-y-2">
                                    <div className="text-sm font-medium text-foreground truncate" title={file.name}>
                                      {file.name}
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                      <Button type="button" variant="outline" size="sm" asChild>
                                        <a href={url} target="_blank" rel="noreferrer">
                                          Открыть
                                        </a>
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        className="gap-2"
                                        onClick={() => onDelete(file.name)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        Удалить
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
                </ScrollArea>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
    </div>
  );
}
