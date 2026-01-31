import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = 'admin' | 'moderator' | 'teacher' | 'student' | 'parent' | 'user';

type State = {
    isLoading: boolean;
    role: AppRole | null;
    hasRole: (role: AppRole) => boolean;
};

export function useRole(userId: string | null): State {
    const [isLoading, setIsLoading] = useState(true);
    const [userRole, setUserRole] = useState<AppRole | null>(null);

    useEffect(() => {
        let cancelled = false;
        const fetchRole = async () => {
            if (!userId) {
                if (!cancelled) {
                    setUserRole(null);
                    setIsLoading(false);
                }
                return;
            }

            setIsLoading(true);

            // We check each possible role starting from admin
            // In a more complex system, we might have a dedicated RPC for this,
            // but here we check the user_roles table.
            const { data, error } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', userId)
                .maybeSingle();

            if (cancelled) return;

            if (error || !data) {
                setUserRole('user');
            } else {
                setUserRole(data.role as AppRole);
            }

            setIsLoading(false);
        };

        fetchRole();
        return () => {
            cancelled = true;
        };
    }, [userId]);

    const hasRole = (role: AppRole) => {
        if (!userRole) return false;
        if (userRole === 'admin') return true; // Admin has all roles
        return userRole === role;
    };

    return { isLoading, role: userRole, hasRole };
}
