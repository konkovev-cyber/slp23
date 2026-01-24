import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type LookupResult = {
  userId: string;
  email: string;
  roles: Array<{ role: string }>;
};

export default function AdminRoles() {
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const onSearch = async () => {
    if (!normalizedEmail) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-user-lookup", {
        body: { email: normalizedEmail },
      });
      if (error) throw error;
      setResult(data as LookupResult);
    } catch (err: any) {
      setResult(null);
      toast({
        title: "Не удалось найти пользователя",
        description: err?.message ?? "Проверьте email.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasRole = (role: string) => (result?.roles ?? []).some((r) => r.role === role);

  const setRole = async (role: "admin" | "moderator", enabled: boolean) => {
    if (!result?.userId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-set-role", {
        body: { userId: result.userId, role, enabled },
      });
      if (error) throw error;
      setResult(data as LookupResult);
      toast({
        title: enabled ? "Роль выдана" : "Роль снята",
        description: `${result.email}: ${role}`,
      });
    } catch (err: any) {
      toast({
        title: "Не удалось изменить роль",
        description: err?.message ?? "Попробуйте ещё раз.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Admin Roles</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Роли</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Поиск пользователя по email и управление ролями (admin/moderator).
        </p>
      </div>

      <Card className="p-5 space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email пользователя</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              autoComplete="off"
            />
            <Button type="button" onClick={onSearch} disabled={isLoading || !normalizedEmail}>
              {isLoading ? "Ищем…" : "Найти"}
            </Button>
          </div>
        </div>

        {result ? (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <div>
                <span className="text-foreground font-medium">userId:</span> {result.userId}
              </div>
              <div>
                <span className="text-foreground font-medium">email:</span> {result.email}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {(result.roles ?? []).length ? (
                result.roles.map((r, idx) => (
                  <Badge key={`${r.role}-${idx}`} variant="secondary">
                    {r.role}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline">Ролей нет</Badge>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="p-4">
                <div className="text-sm font-medium text-foreground">admin</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Полный доступ к админке.
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    variant={hasRole("admin") ? "outline" : "default"}
                    onClick={() => setRole("admin", true)}
                    disabled={isLoading || hasRole("admin")}
                  >
                    Выдать
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRole("admin", false)}
                    disabled={isLoading || !hasRole("admin")}
                  >
                    Снять
                  </Button>
                </div>
              </Card>

              <Card className="p-4">
                <div className="text-sm font-medium text-foreground">moderator</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Роль для редакторов/контент‑менеджеров.
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    variant={hasRole("moderator") ? "outline" : "default"}
                    onClick={() => setRole("moderator", true)}
                    disabled={isLoading || hasRole("moderator")}
                  >
                    Выдать
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRole("moderator", false)}
                    disabled={isLoading || !hasRole("moderator")}
                  >
                    Снять
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
