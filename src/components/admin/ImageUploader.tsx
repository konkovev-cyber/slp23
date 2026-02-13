import { useCallback, useMemo, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useImageUpload } from "@/hooks/use-image-upload";
import { Loader2, Trash2, Upload, ExternalLink, X, FileImage, AlertCircle, HelpCircle, UploadCloud } from "lucide-react";
import { formatFileSize } from "@/lib/utils";

type Bucket = "images" | "news" | "avatars" | (string & {});

export type ImageValue = {
  bucket: Bucket;
  path: string;
  publicUrl: string;
  alt?: string;
  size?: number;
} | null;

type Props = {
  label?: string;
  helpText?: string;
  bucket: Bucket;
  prefix?: string;
  value: ImageValue;
  onChange: (next: ImageValue) => void;
  accept?: string;
  maxSizeMB?: number;
};

const MAX_FILE_SIZE_DEFAULT = 10; // MB

export default function ImageUploader({
  label = "Изображение",
  helpText,
  bucket,
  prefix,
  value,
  onChange,
  accept = "image/*",
  maxSizeMB = MAX_FILE_SIZE_DEFAULT,
}: Props) {
  const { toast } = useToast();
  const { upload, remove, isUploading } = useImageUpload({ bucket, prefix });
  const [alt, setAlt] = useState(value?.alt ?? "");
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const previewUrl = useMemo(() => value?.publicUrl ?? "", [value]);

  const validateFile = useCallback((file: File): string | null => {
    // Проверка размера
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `Размер файла превышает ${maxSizeMB}MB. Текущий размер: ${formatFileSize(file.size)}`;
    }
    // Проверка типа
    if (!file.type.startsWith("image/")) {
      return "Файл должен быть изображением";
    }
    return null;
  }, [maxSizeMB]);

  const onFile = useCallback(
    async (file: File | null) => {
      if (!file) return;

      setFileError(null);
      const error = validateFile(file);
      if (error) {
        setFileError(error);
        toast({
          title: "Ошибка валидации",
          description: error,
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      setUploadProgress(0);

      try {
        // Симуляция прогресса загрузки
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 100);

        const res = await upload(file);

        clearInterval(progressInterval);
        setUploadProgress(100);

        const next = {
          bucket: res.bucket as Bucket,
          path: res.path,
          publicUrl: res.publicUrl,
          alt,
          size: file.size
        };
        onChange(next);

        toast({
          title: "Загружено",
          description: `Файл "${file.name}" успешно загружен в хранилище.`
        });

        setSelectedFile(null);
        setUploadProgress(0);
      } catch (e: any) {
        setUploadProgress(0);
        setSelectedFile(null);
        toast({
          title: "Ошибка загрузки",
          description: e?.message ?? "Не удалось загрузить файл.",
          variant: "destructive",
        });
      }
    },
    [alt, onChange, toast, upload, validateFile]
  );

  const onDelete = useCallback(async () => {
    if (!value) return;
    try {
      await remove(value.path);
      onChange(null);
      toast({ title: "Удалено", description: "Файл удалён из хранилища." });
    } catch (e: any) {
      toast({
        title: "Ошибка удаления",
        description: e?.message ?? "Не удалось удалить файл.",
        variant: "destructive",
      });
    }
  }, [onChange, remove, toast, value]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFile(e.dataTransfer.files[0]);
    }
  }, [onFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFile(e.target.files[0]);
    }
  }, [onFile]);

  const handleBrowseClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const clearSelectedFile = useCallback(() => {
    setSelectedFile(null);
    setFileError(null);
    setUploadProgress(0);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, []);

  return (
    <Card className={`p-5 space-y-4 ${isUploading ? "ring-1 ring-primary/20" : ""}`}>
      <div className="space-y-1">
        <div className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Upload className="w-4 h-4 text-primary" />
          {label}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground">
                  <HelpCircle className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p>Перетащите файл в зону загрузки или нажмите для выбора. Поддерживаются PNG, JPG, WEBP до {maxSizeMB}MB.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {helpText ? <div className="text-xs text-muted-foreground">{helpText}</div> : null}
      </div>

      <div className="flex flex-col gap-6">
        <div className="space-y-4 min-w-0 flex-1">
          {/* Drag & Drop Zone */}
          <div
            className={`
              relative border-2 border-dashed rounded-xl p-8 transition-all
              ${dragActive
                ? "border-primary bg-primary/5"
                : "border-border/60 hover:border-primary/40 hover:bg-muted/30"
              }
              ${isUploading ? "pointer-events-none opacity-60" : "cursor-pointer"}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={handleBrowseClick}
          >
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              onChange={handleInputChange}
              disabled={isUploading}
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center space-y-3 text-center">
              <div className={`
                p-4 rounded-full transition-all
                ${dragActive ? "bg-primary/20" : "bg-muted"}
              `}>
                {isUploading ? (
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                ) : (
                  <UploadCloud className={`w-8 h-8 ${dragActive ? "text-primary" : "text-muted-foreground"}`} />
                )}
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {isUploading ? "Загрузка файла..." : "Перетащите файл сюда"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isUploading ? "Пожалуйста, подождите" : "или нажмите для выбора"}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full">
                <FileImage className="w-3.5 h-3.5" />
                <span>до {maxSizeMB}MB</span>
              </div>
            </div>

            {/* Progress Bar */}
            {isUploading && (
              <div className="mt-4 space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  {uploadProgress < 100 ? `Загрузка... ${uploadProgress}%` : "Завершение..."}
                </p>
              </div>
            )}
          </div>

          {/* Selected/Current File Info */}
          {(selectedFile || value) && (
            <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-4">
              <div className="flex items-start gap-4">
                {/* Compact Preview inside info box */}
                <div className="w-16 h-16 rounded-lg bg-muted border border-border overflow-hidden shrink-0">
                  {previewUrl ? (
                    <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileImage className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold truncate block" title={selectedFile?.name || value?.path}>
                      {selectedFile?.name || value?.path.split('/').pop()}
                    </span>
                    {(selectedFile && !isUploading) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={clearSelectedFile}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile?.size || value?.size || 0)}
                  </p>
                </div>
              </div>

              {/* Alt Text Input - only if needed or visible */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  SEO Alt описание
                </label>
                <Input
                  value={alt}
                  onChange={(e) => {
                    const nextAlt = e.target.value;
                    setAlt(nextAlt);
                    if (value) onChange({ ...value, alt: nextAlt });
                  }}
                  placeholder="Краткое описание для SEO..."
                  className="h-8 text-xs bg-background"
                />
              </div>

              {value && (
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={onDelete}
                    className="h-8 gap-2 text-xs flex-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Удалить
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    asChild
                    className="h-8 gap-2 text-xs flex-1"
                  >
                    <a href={value.publicUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Открыть
                    </a>
                  </Button>
                </div>
              )}
            </div>
          )}

          {fileError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">{fileError}</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
