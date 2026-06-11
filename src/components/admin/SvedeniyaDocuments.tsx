import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  FileText, FileSpreadsheet, File, Upload, Trash2,
  X, Loader2, Eye, Download, GripVertical, Plus, Pencil, Check
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ACCEPTED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
};

const BUCKET = "documents";

// Транслитерация кириллицы и очистка имени файла для Supabase Storage
const CYR_TO_LAT: Record<string, string> = {
  а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',
  к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',
  х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
};

function sanitizeFileName(name: string): string {
  // Отделяем расширение
  const dotIdx = name.lastIndexOf(".");
  const base = dotIdx > 0 ? name.slice(0, dotIdx) : name;
  const ext = dotIdx > 0 ? name.slice(dotIdx) : "";

  const transliterated = base
    .toLowerCase()
    .split("")
    .map((ch) => CYR_TO_LAT[ch] ?? ch)
    .join("");

  // Заменяем всё кроме латиницы, цифр, дефисов и подчёркиваний
  const clean = transliterated
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  return (clean || "file") + ext.toLowerCase();
}

function getFileTypeIcon(type: string) {
  if (type === "pdf") return <FileText className="w-7 h-7 text-red-500" />;
  if (type === "xls" || type === "xlsx") return <FileSpreadsheet className="w-7 h-7 text-green-600" />;
  return <File className="w-7 h-7 text-blue-500" />;
}

function getFileTypeBadge(type: string) {
  const colors: Record<string, string> = {
    pdf: "bg-red-100 text-red-700 border-red-200",
    doc: "bg-blue-100 text-blue-700 border-blue-200",
    docx: "bg-blue-100 text-blue-700 border-blue-200",
    xls: "bg-green-100 text-green-700 border-green-200",
    xlsx: "bg-green-100 text-green-700 border-green-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${colors[type] || "bg-gray-100 text-gray-600"}`}>
      {type}
    </span>
  );
}

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

interface Props {
  sectionId: string;
}

interface DocRow {
  id: string;
  section_id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
}

export default function SvedeniyaDocuments({ sectionId }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDesc, setDraftDesc] = useState("");

  const queryKey = ["svedeniya_documents", sectionId];

  const { data: docs = [], isLoading } = useQuery<DocRow[]>({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("svedeniya_documents")
        .select("*")
        .eq("section_id", sectionId)
        .order("sort_order")
        .order("created_at");
      if (error) throw error;
      return (data as DocRow[]) || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (doc: DocRow) => {
      // Удаляем файл из Storage
      const path = doc.file_url.split(`/storage/v1/object/public/${BUCKET}/`)[1];
      if (path) {
        await supabase.storage.from(BUCKET).remove([path]);
      }
      // Удаляем запись из БД
      const { error } = await supabase
        .from("svedeniya_documents")
        .delete()
        .eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Удалено", description: "Документ удалён." });
    },
    onError: (e: any) =>
      toast({ title: "Ошибка удаления", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, title, description }: { id: string; title: string; description: string }) => {
      const { error } = await supabase
        .from("svedeniya_documents")
        .update({ title: title.trim(), description: description.trim() || null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setEditingDocId(null);
      toast({ title: "Сохранено", description: "Данные документа обновлены." });
    },
    onError: (e: any) =>
      toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const startEditDoc = (doc: DocRow) => {
    setEditingDocId(doc.id);
    setDraftTitle(doc.title);
    setDraftDesc(doc.description || "");
  };

  const handleFileSelect = (file: File) => {
    const mimeType = file.type;
    if (!ACCEPTED_TYPES[mimeType]) {
      toast({
        title: "Неподдерживаемый формат",
        description: "Допустимы: PDF, DOC, DOCX, XLS, XLSX",
        variant: "destructive",
      });
      return;
    }
    setSelectedFile(file);
    if (!newTitle) {
      setNewTitle(file.name.replace(/\.[^.]+$/, ""));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !newTitle.trim()) {
      toast({ title: "Заполните название", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = selectedFile.name.split(".").pop()?.toLowerCase() || "";
      const fileType = ACCEPTED_TYPES[selectedFile.type] || ext;
      const storagePath = `${sectionId}/${Date.now()}_${sanitizeFileName(selectedFile.name)}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, selectedFile, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(storagePath);

      const { error: dbError } = await supabase.from("svedeniya_documents").insert({
        section_id: sectionId,
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        file_url: urlData.publicUrl,
        file_name: selectedFile.name,
        file_type: fileType,
        file_size: selectedFile.size,
        sort_order: docs.length,
      });

      if (dbError) throw dbError;

      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Загружено", description: `${selectedFile.name} добавлен.` });
      setSelectedFile(null);
      setNewTitle("");
      setNewDescription("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e: any) {
      toast({ title: "Ошибка загрузки", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setNewTitle("");
    setNewDescription("");
    setShowForm(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="mt-4 space-y-4">
      {/* Превью PDF модалка */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-[90vw] h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="font-semibold text-sm text-gray-700">Просмотр документа</span>
              <Button variant="ghost" size="icon" onClick={() => setPreviewUrl(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <iframe src={previewUrl} className="flex-1 w-full" title="preview" />
          </div>
        </div>
      )}

      {/* Кнопка «Добавить документ» */}
      {!showForm && (
        <Button size="sm" variant="outline" className="gap-2 w-full border-dashed"
          onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" /> Добавить документ
        </Button>
      )}

      {/* Форма загрузки */}
      {showForm && (
      <div className="border border-dashed rounded-lg p-4 bg-muted/20">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Добавить документ
          </p>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-muted-foreground"
            onClick={resetForm}>
            <X className="w-3.5 h-3.5" /> Закрыть
          </Button>
        </div>

        {/* Drop zone */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          {selectedFile ? (
            <div className="flex items-center justify-center gap-2">
              {getFileTypeIcon(ACCEPTED_TYPES[selectedFile.type] || "")}
              <div className="text-left">
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{formatSize(selectedFile.size)}</p>
              </div>
              <button
                className="ml-2 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-muted-foreground">
                Перетащите файл или нажмите для выбора
              </p>
              <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX, XLS, XLSX</p>
            </>
          )}
        </div>

        {/* Поля названия и описания */}
        <div className="mt-3 space-y-2">
          <div>
            <Label className="text-xs">Название документа *</Label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Устав организации"
              className="mt-1 h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Описание (необязательно)</Label>
            <Textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Краткое описание документа..."
              className="mt-1 text-sm min-h-[60px] resize-none"
            />
          </div>
          <Button
            onClick={async () => { await handleUpload(); if (!uploading) resetForm(); }}
            disabled={uploading || !selectedFile || !newTitle.trim()}
            size="sm"
            className="w-full gap-2"
          >
            {uploading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Загрузка...</>
            ) : (
              <><Upload className="w-4 h-4" /> Загрузить документ</>
            )}
          </Button>
        </div>
      </div>
      )}

      {/* Список документов */}
      {isLoading ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Загрузка...
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-xs italic">
          Документов нет. Загрузите первый документ выше.
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Загруженные документы ({docs.length})
          </p>
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="rounded-lg border bg-card transition-colors"
            >
              {/* ── Основная строка ── */}
              <div className="flex items-start gap-3 p-3 hover:bg-muted/30 transition-colors">
                <GripVertical className="w-4 h-4 text-muted-foreground/40 mt-1 shrink-0 cursor-grab" />
                <div className="shrink-0 mt-0.5">{getFileTypeIcon(doc.file_type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">{doc.title}</span>
                    {getFileTypeBadge(doc.file_type)}
                    {doc.file_size && (
                      <span className="text-xs text-muted-foreground">{formatSize(doc.file_size)}</span>
                    )}
                  </div>
                  {doc.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{doc.description}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    {new Date(doc.created_at).toLocaleDateString("ru-RU")} · {doc.file_name}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {doc.file_type === "pdf" && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Просмотр"
                      onClick={() => setPreviewUrl(doc.file_url)}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Скачать" asChild>
                    <a href={doc.file_url} download={doc.file_name} target="_blank" rel="noreferrer">
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon"
                    className={`h-7 w-7 ${editingDocId === doc.id ? "text-primary bg-primary/10" : ""}`}
                    title="Редактировать"
                    onClick={() => editingDocId === doc.id ? setEditingDocId(null) : startEditDoc(doc)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon"
                        className="h-7 w-7 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                        title="Удалить">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Удалить документ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          «{doc.title}» будет удалён без возможности восстановления.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive hover:bg-destructive/90"
                          onClick={() => deleteMutation.mutate(doc)}>
                          Удалить
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* ── Инлайн редактирование ── */}
              {editingDocId === doc.id && (
                <div className="px-4 pb-4 pt-1 border-t border-border/60 bg-muted/20 space-y-3">
                  <div>
                    <Label className="text-xs">Название *</Label>
                    <Input
                      value={draftTitle}
                      onChange={e => setDraftTitle(e.target.value)}
                      className="mt-1 h-8 text-sm"
                      autoFocus
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Описание</Label>
                    <Textarea
                      value={draftDesc}
                      onChange={e => setDraftDesc(e.target.value)}
                      className="mt-1 text-sm min-h-[60px] resize-none"
                      placeholder="Краткое описание..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="gap-1.5 flex-1"
                      onClick={() => setEditingDocId(null)}>
                      <X className="w-3.5 h-3.5" /> Отмена
                    </Button>
                    <Button size="sm" className="gap-1.5 flex-1 bg-green-600 hover:bg-green-700"
                      disabled={!draftTitle.trim() || updateMutation.isPending}
                      onClick={() => updateMutation.mutate({ id: doc.id, title: draftTitle, description: draftDesc })}>
                      {updateMutation.isPending
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Check className="w-3.5 h-3.5" />}
                      Сохранить
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
