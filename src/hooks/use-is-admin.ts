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

      // Use a SECURITY DEFINER DB function to avoid any RLS edge-cases.
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });
      if (cancelled) return;
      if (error) {
        // If RLS blocks or any error occurs, treat as not admin.
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      setIsAdmin(Boolean(data));
      setIsLoading(false);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { isLoading, isAdmin };
}
