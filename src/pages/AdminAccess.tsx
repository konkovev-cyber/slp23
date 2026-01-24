import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, RefreshCw } from "lucide-react";

export default function AdminAccess() {
  const { toast } = useToast();
  const { userId } = useAuth();

  const { data: roles = [], isFetching, refetch } = useQuery({
    queryKey: ["admin_access_roles", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const copyUserId = async () => {
    if (!userId) return;
    try {
      await navigator.clipboard.writeText(userId);
      toast({ title: "Скопировано", description: "userId скопирован в буфер обмена." });
    } catch {
      toast({
        title: "Не удалось скопировать",
        description: "Браузер не дал доступ к буферу обмена.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Admin Access</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Доступ</h1>
        <p className="text-sm text-muted-foreground mt-1">Текущий пользователь и его роли.</p>
      </div>

      <Card className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-foreground">userId</div>
            <div className="mt-1 text-sm text-muted-foreground break-all">{userId ?? "—"}</div>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={copyUserId} disabled={!userId}>
              <Copy className="h-4 w-4" />
              Скопировать
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => refetch()}
              disabled={!userId}
            >
              <RefreshCw className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Обновить
            </Button>
          </div>
        </div>

        <div>
          <div className="text-sm font-medium text-foreground">Роли</div>
          {roles.length ? (
            <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
              {roles.map((r: any, idx: number) => (
                <li key={`${r.role}-${idx}`}>{r.role}</li>
              ))}
            </ul>
          ) : (
            <div className="mt-2 text-sm text-muted-foreground">Ролей нет.</div>
          )}
        </div>
      </Card>
    </div>
  );
}
