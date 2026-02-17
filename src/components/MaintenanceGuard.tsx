import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { Construction } from "lucide-react";
import { useEffect, useState } from "react";

export const MaintenanceGuard = ({ children }: { children: React.ReactNode }) => {
    const [userId, setUserId] = useState<string | null>(null);
    const isMaintenancePath = !window.location.pathname.startsWith("/admin");

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setUserId(data.user?.id ?? null);
        });
    }, []);

    const { isAdmin } = useIsAdmin(userId);

    const { data: settings } = useQuery({
        queryKey: ["site_settings"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("site_content")
                .select("content")
                .eq("id", "settings")
                .maybeSingle();
            if (error) throw error;
            return data?.content as any;
        },
    });

    const isMaintenance = settings?.maintenance_mode === true;

    if (isMaintenance && isMaintenancePath && !isAdmin) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-center">
                <div className="p-4 bg-yellow-500/10 rounded-full mb-6">
                    <Construction className="h-16 w-16 text-yellow-600 animate-pulse" />
                </div>
                <h1 className="text-4xl font-black text-foreground mb-4 uppercase tracking-tighter">
                    Сайт на техническом обслуживании
                </h1>
                <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Мы обновляем систему, чтобы стать еще лучше. Вернемся совсем скоро!
                </p>
                <div className="mt-10 text-sm text-muted-foreground/50 font-mono">
                    © {new Date().getFullYear()} Личность ПЛЮС
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
