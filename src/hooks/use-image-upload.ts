import { useCallback, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UploadResult = {
  bucket: string;
  path: string;
  publicUrl: string;
};

type Options = {
  bucket: "images" | "news" | "avatars" | (string & {});
  /** Optional folder/prefix inside the bucket. Example: "hero" */
  prefix?: string;
};

const safeSegment = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_.]/g, "")
    .slice(0, 80);

export function useImageUpload({ bucket, prefix }: Options) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const basePath = useMemo(() => {
    const p = prefix ? safeSegment(prefix) : "";
    return p ? `${p}/` : "";
  }, [prefix]);

  const upload = useCallback(
    async (file: File): Promise<UploadResult> => {
      setIsUploading(true);
      setError(null);
      try {
        let fileToUpload: File | Blob = file;

        // Для изображений сначала аккуратно уменьшаем до разумного размера,
        // чтобы сохранить качество и не перегружать хранилище.
        if (file.type.startsWith("image/")) {
          try {
            const resized = await resizeImage(file, 1920, 1080, 0.9);
            fileToUpload = resized;
          } catch (resizeError) {
            console.warn("Image resize failed, uploading original file", resizeError);
          }
        }

        const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
        const name = safeSegment(file.name.replace(/\.[^/.]+$/, "")) || "image";
        const path = `${basePath}${Date.now()}_${name}${ext ? `.${safeSegment(ext)}` : ""}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, fileToUpload, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || undefined,
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        const publicUrl = data.publicUrl;

        return { bucket, path, publicUrl };
      } catch (e: any) {
        const message = e?.message ?? "Upload failed";
        setError(message);
        throw e;
      } finally {
        setIsUploading(false);
      }
    },
    [basePath, bucket]
  );

  const remove = useCallback(
    async (path: string) => {
      setError(null);
      const { error: removeError } = await supabase.storage.from(bucket).remove([path]);
      if (removeError) {
        setError(removeError.message);
        throw removeError;
      }
    },
    [bucket]
  );

  return { upload, remove, isUploading, error };
}

// Helpers для аккуратного ресайза изображений перед загрузкой

const isExternalUrl = (url: string): boolean => {
  if (url.startsWith("data:") || url.startsWith("blob:")) return false;
  try {
    return new URL(url).origin !== window.location.origin;
  } catch {
    return false;
  }
};

const loadImageToCanvas = (
  imageUrl: string
): Promise<{ canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    // Важно: сначала выставляем crossOrigin, затем src
    if (isExternalUrl(imageUrl)) {
      img.crossOrigin = "anonymous";
    }

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0);
      resolve({ canvas, ctx });
    };

    img.onerror = () => reject(new Error(`Failed to load image: ${imageUrl}`));
    img.src = imageUrl;
  });
};

const resizeImage = async (
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality = 0.85
): Promise<Blob> => {
  const imageUrl = URL.createObjectURL(file);

  try {
    const { canvas } = await loadImageToCanvas(imageUrl);

    // Пропорционально уменьшаем до нужных размеров
    let { width, height } = canvas;
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }
    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    const resizedCanvas = document.createElement("canvas");
    resizedCanvas.width = width;
    resizedCanvas.height = height;

    const ctx = resizedCanvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(canvas, 0, 0, width, height);

    return new Promise((resolve, reject) => {
      resizedCanvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Blob failed"))),
        "image/jpeg",
        quality
      );
    });
  } finally {
    // Обязательно очищаем URL, чтобы не было утечек памяти
    URL.revokeObjectURL(imageUrl);
  }
};
