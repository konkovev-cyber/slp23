import { useMemo, useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import ImageUploader, { type ImageValue } from "@/components/admin/ImageUploader";
import ImageCard, { type StorageEntry } from "@/components/admin/ImageCard";
import ImagePreviewDialog from "@/components/admin/ImagePreviewDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Folder,
  FileImage,
  RefreshCw,
  Trash2,
  ChevronRight,
  Info,
  HardDrive,
  UploadCloud,
  FolderOpen,
  Search,
  ArrowUpDown,
  CheckSquare,
  Square,
  X,
  HelpCircle,
  Plus,
  LayoutGrid,
  List,
  Filter,
  MoreVertical,
  ChevronLeft,
  Settings2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatFileSize } from "@/lib/utils";
import { cn } from "@/lib/utils";

type BucketId = "images" | "news" | "avatars";

type SortOption = "name" | "date" | "size";
type SortOrder = "asc" | "desc";

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
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Search and filter
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Selection
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  // Preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

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
    return items.filter((i) => !i.id && !i.metadata);
  }, [data]);

  const files = useMemo(() => {
    const items = data ?? [];
    let filtered = items.filter((i) => !!i.id);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((f) =>
        f.name.toLowerCase().includes(query)
      );
    }

    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name": comparison = a.name.localeCompare(b.name); break;
        case "date":
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          comparison = dateA - dateB;
          break;
        case "size":
          const sizeA = a.metadata?.size || 0;
          const sizeB = b.metadata?.size || 0;
          comparison = sizeA - sizeB;
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [data, searchQuery, sortBy, sortOrder]);

  const previewFiles = useMemo(() => {
    return files.map((file) => ({
      file,
      url: toPublicUrl(file.name),
      bucket,
    }));
  }, [files, bucket]);

  const goToRoot = () => {
    setPath("");
    setSelectedFiles(new Set());
  };

  const goToSegment = (index: number) => {
    const next = segments.slice(0, index + 1).join("/");
    setPath(next);
    setSelectedFiles(new Set());
  };

  const onDelete = async (name: string) => {
    const fullPath = joinPath(path, name);
    const { error } = await supabase.storage.from(bucket).remove([fullPath]);
    if (error) {
      toast({ title: "Ошибка удаления", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Удалено", description: "Файл удалён." });
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
    refetch();
  };

  const onDeleteSelected = async () => {
    if (selectedFiles.size === 0) return;
    const count = selectedFiles.size;
    if (!confirm(`Удалить ${count} файл(ов)?`)) return;
    const paths = Array.from(selectedFiles).map((name) => joinPath(path, name));
    const { error } = await supabase.storage.from(bucket).remove(paths);
    if (error) {
      toast({ title: "Ошибка удаления", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Удалено", description: `${count} файл(ов) удалено.` });
    setSelectedFiles(new Set());
    refetch();
  };

  const toPublicUrl = (name: string) => {
    const fullPath = joinPath(path, name);
    const { data } = supabase.storage.from(bucket).getPublicUrl(fullPath);
    return data.publicUrl;
  };

  const toggleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(option);
      setSortOrder("asc");
    }
  };

  const toggleSelectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map((f) => f.name)));
    }
  };

  const handlePreview = useCallback((file: StorageEntry, url: string) => {
    const index = previewFiles.findIndex((pf) => pf.file.name === file.name);
    if (index !== -1) {
      setPreviewIndex(index);
      setPreviewOpen(true);
    }
  }, [previewFiles]);

  const handlePreviewDelete = useCallback((name: string) => {
    onDelete(name);
    if (previewFiles.length === 1) setPreviewOpen(false);
  }, [onDelete, previewFiles.length]);

  const totalStorageSize = useMemo(() => {
    return files.reduce((total, file) => total + (file.metadata?.size || 0), 0);
  }, [files]);

  return (
    <div className="flex flex-col h-full space-y-0 -m-6 overflow-hidden">
      <Helmet>
        <title>Управление медиа | Админ-панель</title>
      </Helmet>

      {/* Modern Header / Breadcrumbs */}
      <header className="bg-background/80 backdrop-blur-md border-b sticky top-0 z-10 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4 overflow-hidden">
          <div className="flex items-center gap-1.5 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 hover:bg-muted"
              onClick={goToRoot}
              disabled={path === ""}
            >
              <FolderOpen className={cn("w-4 h-4", path === "" ? "text-muted-foreground" : "text-primary")} />
            </Button>
            <nav className="flex items-center text-sm font-medium whitespace-nowrap overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-8 px-2 min-w-0", path === "" ? "font-bold text-foreground" : "text-muted-foreground")}
                onClick={goToRoot}
              >
                <span className="truncate">{bucket}</span>
              </Button>
              {segments.map((seg, idx) => (
                <div key={idx} className="flex items-center">
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 px-2 max-w-[150px] truncate",
                      idx === segments.length - 1 ? "font-bold text-foreground" : "text-muted-foreground"
                    )}
                    onClick={() => goToSegment(idx)}
                  >
                    <span className="truncate">{seg}</span>
                  </Button>
                </div>
              ))}
            </nav>
          </div>
          {isFetching && <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 shadow-sm">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Загрузить</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-none bg-transparent shadow-2xl">
              <ImageUploader
                bucket={bucket}
                prefix={path || undefined}
                label="Загрузка файлов"
                helpText={`Файлы будут загружены в ${bucket}/${path || "root"}`}
                value={null}
                onChange={(v) => {
                  setLastUploaded(v);
                  setRefreshKey(k => k + 1);
                  if (v) {
                    setTimeout(() => setIsUploadOpen(false), 800);
                    toast({ title: "Файл загружен", description: "Список обновлен" });
                  }
                }}
              />
            </DialogContent>
          </Dialog>

          <div className="w-[1px] h-4 bg-border mx-1 hidden sm:block" />

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={() => setRefreshKey(k => k + 1)}
          >
            <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 bg-muted/20">
        {/* Sidebar Mini */}
        <aside className="w-64 border-r bg-card hidden xl:flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">
                  Хранилища (Buckets)
                </label>
                <div className="space-y-1">
                  {[
                    { id: "images", label: "Общие медиа", icon: FileImage },
                    { id: "news", label: "Новости", icon: FolderOpen },
                    { id: "avatars", label: "Аватары", icon: Folder }
                  ].map((b) => (
                    <Button
                      key={b.id}
                      variant={bucket === b.id ? "secondary" : "ghost"}
                      size="sm"
                      className={cn(
                        "w-full justify-start gap-3 h-9 px-3",
                        bucket === b.id && "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary font-semibold"
                      )}
                      onClick={() => {
                        setBucket(b.id as BucketId);
                        setPath("");
                      }}
                    >
                      <b.icon className={cn("w-4 h-4", bucket === b.id ? "text-primary" : "text-muted-foreground")} />
                      {b.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">
                  Быстрый доступ
                </label>
                <div className="grid grid-cols-1 gap-1">
                  {[
                    { id: "hero", label: "Главная страница" },
                    { id: "about", label: "О школе" },
                    { id: "programs", label: "Курсы и секции" },
                    { id: "gallery", label: "Фотогалерея" },
                  ].map((p) => (
                    <Button
                      key={p.id}
                      variant="ghost"
                      size="sm"
                      className={cn("w-full justify-start gap-3 h-9 px-3 text-muted-foreground", path === p.id && "text-foreground font-medium")}
                      onClick={() => setPath(p.id)}
                    >
                      <Folder className="w-3.5 h-3.5" />
                      {p.label}
                    </Button>
                  ))}
                </div>
              </div>

              <Card className="p-4 bg-muted/40 border-none shadow-none space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <HardDrive className="w-3.5 h-3.5" />
                  Объем в папке
                </div>
                <div className="space-y-1">
                  <div className="text-xl font-bold font-mono tracking-tight leading-none">
                    {formatFileSize(totalStorageSize)}
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    {files.length} файла | {folders.length} папок
                  </p>
                </div>
              </Card>
            </div>
          </ScrollArea>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Main Toolbar */}
          <div className="bg-background border-b px-6 py-3 flex flex-wrap items-center justify-between gap-4 z-[9]">
            <div className="flex items-center gap-3 flex-1 min-w-[200px]">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по имени..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 bg-muted/20 border-border/50 focus-visible:ring-primary/20"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-lg border border-border/50">
                {[
                  { id: "name", label: "Имя", icon: ArrowUpDown },
                  { id: "date", label: "Дата", icon: ArrowUpDown },
                  { id: "size", label: "Вес", icon: ArrowUpDown },
                ].map((s) => (
                  <Button
                    key={s.id}
                    variant={sortBy === s.id ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-7 px-2.5 text-[11px] font-medium gap-1.5",
                      sortBy === s.id && "bg-background shadow-sm text-primary"
                    )}
                    onClick={() => toggleSort(s.id as SortOption)}
                  >
                    {s.label}
                    {sortBy === s.id && (
                      <span className="opacity-60">{sortOrder === "asc" ? "↑" : "↓"}</span>
                    )}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {selectedFiles.size > 0 ? (
                <div className="flex items-center gap-2 bg-destructive/5 px-3 py-1.5 rounded-full border border-destructive/20 animate-in fade-in slide-in-from-right-2">
                  <span className="text-xs font-bold text-destructive">Выбрано: {selectedFiles.size}</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-7 px-3 gap-2"
                    onClick={onDeleteSelected}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Удалить
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={() => setSelectedFiles(new Set())}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-2"
                  onClick={toggleSelectAll}
                  disabled={files.length === 0}
                >
                  <CheckSquare className="w-4 h-4" />
                  <span className="hidden lg:inline">Выбрать все</span>
                </Button>
              )}
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6">
              {folders.length === 0 && files.length === 0 && !isFetching ? (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                  <div className="relative mb-6">
                    <div className="absolute -inset-4 bg-primary/10 rounded-full blur-2xl opacity-50" />
                    <div className="relative p-8 bg-muted rounded-2xl border-2 border-dashed border-border/50">
                      <FolderOpen className="w-16 h-16 text-muted-foreground/30" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Здесь пока нет файлов</h3>
                  <p className="text-muted-foreground max-w-[300px] mb-8">
                    Загрузите первое изображение или перейдите в другую папку для работы с медиа-файлами.
                  </p>
                  <Button onClick={() => setIsUploadOpen(true)} className="gap-2 px-8 py-6 rounded-2xl text-lg shadow-xl shadow-primary/20">
                    <UploadCloud className="w-5 h-5" />
                    Добавить медиа
                  </Button>
                </div>
              ) : (
                <div className="space-y-12">
                  {/* Folder Grid */}
                  {folders.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-1">
                        <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                          <Folder className="w-3.5 h-3.5" />
                          Подпапки
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                        {folders.map((f) => (
                          <div
                            key={f.name}
                            className="group relative flex items-center gap-3 p-3 bg-background hover:bg-primary/5 border hover:border-primary/30 rounded-xl transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
                            onClick={() => setPath(joinPath(path, f.name))}
                          >
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                              <Folder className="w-5 h-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold truncate group-hover:text-primary transition-colors">
                                {f.name}
                              </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Files Grid */}
                  {files.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-1">
                        <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                          <FileImage className="w-3.5 h-3.5" />
                          Изображения
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                        {files.map((file) => (
                          <ImageCard
                            key={file.name}
                            file={file}
                            url={toPublicUrl(file.name)}
                            bucket={bucket}
                            isSelected={selectedFiles.has(file.name)}
                            onSelectChange={(selected) => {
                              setSelectedFiles((prev) => {
                                const next = new Set(prev);
                                if (selected) next.add(file.name);
                                else next.delete(file.name);
                                return next;
                              });
                            }}
                            onDelete={onDelete}
                            onPreview={handlePreview}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {isFetching && files.length === 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 animate-pulse pt-8">
                      {[...Array(10)].map((_, i) => (
                        <div key={i} className="aspect-square bg-muted rounded-2xl" />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </main>
      </div>

      <ImagePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        files={previewFiles}
        currentIndex={previewIndex}
        onIndexChange={setPreviewIndex}
        onDelete={handlePreviewDelete}
      />
    </div>
  );
}
