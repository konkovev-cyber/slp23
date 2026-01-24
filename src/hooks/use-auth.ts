import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AuthState = {
  isLoading: boolean;
  userId: string | null;
};

export function useAuth(): AuthState {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Important: subscribe first, then fetch current session.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      setIsLoading(false);
    });

    supabase.auth
      .getSession()
      .then(({ data }) => {
        setUserId(data.session?.user?.id ?? null);
      })
      .finally(() => setIsLoading(false));

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  return { isLoading, userId };
}
