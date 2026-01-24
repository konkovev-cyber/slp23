import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AuthState = {
  isLoading: boolean;
  userId: string | null;
};

export function useAuth(): AuthState {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initialSessionResolvedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    // Important: subscribe first, then fetch current session.
    // The auth library may emit an INITIAL_SESSION event before getSession() resolves.
    // If we immediately mark loading=false on that event (sometimes with session=null),
    // ProtectedRoute can redirect back to /admin even though a valid session exists.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      setUserId(session?.user?.id ?? null);

      // Only stop loading once we've resolved the initial session (via getSession)
      // OR we receive a non-initial auth event.
      if (initialSessionResolvedRef.current || event !== "INITIAL_SESSION") {
        setIsLoading(false);
      }
    });

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (cancelled) return;
        initialSessionResolvedRef.current = true;
        setUserId(data.session?.user?.id ?? null);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { isLoading, userId };
}
