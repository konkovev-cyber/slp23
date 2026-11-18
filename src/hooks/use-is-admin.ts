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

      // 1. Прямой запрос к user_roles (надёжнее, чем RPC с двойным overload)
      try {
        const { data: ur, error: urErr } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();

        if (!urErr && ur && (ur as any).role === "admin") {
          if (!cancelled) {
            setIsAdmin(true);
            setIsLoading(false);
          }
          return;
        }
      } catch {
        // продолжаем к следующему варианту
      }

      // 2. Проверка через profiles.role
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("auth_id", userId)
          .maybeSingle();

        if (profile && (profile as any).role === "admin") {
          if (!cancelled) {
            setIsAdmin(true);
            setIsLoading(false);
          }
          return;
        }
      } catch {
        // продолжаем
      }

      // 3. Попытка через RPC has_role (может вернуть PGRST203, тогда игнорируем)
      try {
        const { data, error } = await supabase.rpc("has_role", {
          _user_id: userId,
          _role: "admin",
        });

        if (!error && data === true) {
          if (!cancelled) {
            setIsAdmin(true);
            setIsLoading(false);
          }
          return;
        }
      } catch {
        // игнорируем
      }

      if (!cancelled) {
        setIsAdmin(false);
        setIsLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { isLoading, isAdmin };
}
