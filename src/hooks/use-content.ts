import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

type SiteContentRow<TContent = unknown> = {
  id: string;
  section_name: string;
  is_visible: boolean;
  content: TContent;
};

/**
 * Public content reader for sections stored in `site_content`.
 * Uses `maybeSingle()` to avoid throwing when the row doesn't exist.
 */
export function useContent<TContent = Record<string, unknown>>(id: string) {
  return useQuery({
    queryKey: ["site_content", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("id, section_name, is_visible, content")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return (data ?? null) as SiteContentRow<TContent> | null;
    },
    staleTime: 60_000,
  });
}
