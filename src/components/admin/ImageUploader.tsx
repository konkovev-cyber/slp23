import { useCallback, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useImageUpload } from "@/hooks/use-image-upload";
import { Loader2, Trash2, Upload, ExternalLink } from "lucide-react";

type Bucket = "images" | "news" | "avatars" | (string & {});

export type ImageValue = {
  bucket: Bucket;
  path: string;
  publicUrl: string;
  alt?: string;
} | null;

type Props = {
  label?: string;
  helpText?: string;
  bucket: Bucket;
  prefix?: string;
  value: ImageValue;
  onChange: (next: ImageValue) => void;
  accept?: string;
};

export default function ImageUploader({
  label = "Изображение",
  helpText,
  bucket,
  prefix,
  value,
  onChange,
  accept = "image/*",
}: Props) {
  const { toast } = useToast();
  const { upload, remove, isUploading } = useImageUpload({ bucket, prefix });
  const [alt, setAlt] = useState(value?.alt ?? "");

  const previewUrl = useMemo(() => value?.publicUrl ?? "", [value]);

  const onFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      try {
        const res = await upload(file);
        const next = { bucket: res.bucket as Bucket, path: res.path, publicUrl: res.publicUrl, alt };
        onChange(next);
        toast({ title: "Загружено", description: "Файл успешно загружен в хранилище." });
      } catch (e: any) {
        toast({
          title: "Ошибка загрузки",
          description: e?.message ?? "Не удалось загрузить файл.",
          variant: "destructive",
        });
      }
    },
    [alt, onChange, toast, upload]
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

  return (
    <Card className="p-4 space-y-3">
      <div className="space-y-1">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {helpText ? <div className="text-xs text-muted-foreground">{helpText}</div> : null}
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr,220px]">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Input
              type="file"
              accept={accept}
              onChange={(e) => onFile(e.target.files?.item(0) ?? null)}
              disabled={isUploading}
              className="bg-background"
            />
            <Button type="button" variant="outline" disabled className="gap-2 whitespace-nowrap">
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {isUploading ? "Загрузка…" : "Выберите файл"}
            </Button>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Alt (для SEO/доступности)</div>
            <Input
              value={alt}
              onChange={(e) => {
                const nextAlt = e.target.value;
                setAlt(nextAlt);
                if (value) onChange({ ...value, alt: nextAlt });
              }}
              placeholder="Например: Дети на занятиях"
              className="bg-background"
            />
          </div>

          {value ? (
            <div className="flex items-center gap-2">
              <Button type="button" variant="destructive" onClick={onDelete} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Удалить
              </Button>
              <Button type="button" variant="outline" asChild className="gap-2">
                <a href={value.publicUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Открыть
                </a>
              </Button>
              <div className="text-xs text-muted-foreground truncate">
                {value.bucket}/{value.path}
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              Файл ещё не загружен.
            </div>
          )}
        </div>

        <div className="rounded-md border border-border bg-muted overflow-hidden aspect-video">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={value?.alt || "Загруженное изображение"}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
              Preview
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
