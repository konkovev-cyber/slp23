import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type State = {
  isLoading: boolean;
  isAdmin: boolean;
};

export function useIsAdmin(userId: string | null): State {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!userId) {
        if (!cancelled) {
          setIsAdmin(false);
          setIsLoading(false);
        }
        return;
      }
      setIsLoading(true);
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .limit(1);
      if (cancelled) return;
      if (error) {
        // If RLS blocks or any error occurs, treat as not admin.
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }
      setIsAdmin((data?.length ?? 0) > 0);
      setIsLoading(false);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { isLoading, isAdmin };
}
