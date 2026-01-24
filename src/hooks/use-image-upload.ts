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
        const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
        const name = safeSegment(file.name.replace(/\.[^/.]+$/, "")) || "image";
        const path = `${basePath}${Date.now()}_${name}${ext ? `.${safeSegment(ext)}` : ""}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, file, {
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
