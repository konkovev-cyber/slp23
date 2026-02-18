import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-is-admin";

export default function AdminLogin() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useAuth();
  const { isAdmin } = useIsAdmin(userId);

  const redirectPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const raw = params.get("redirect");
    if (!raw || !raw.startsWith("/")) return null;
    return raw;
  }, [location.search]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (redirectPath) {
        navigate(redirectPath, { replace: true });
        return;
      }
      navigate("/admin/dashboard", { replace: true });
    } catch (err: any) {
      toast({
        title: "Не удалось войти",
        description: err?.message ?? "Проверьте email/пароль.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Helmet>
        <title>Admin Login</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <Card className="w-full max-w-md p-6">
        <h1 className="text-2xl font-bold text-foreground">Вход в админку</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Доступ только для администраторов.
        </p>

        {userId ? (
          <div className="mt-6 space-y-3">
            <Button
              className="w-full"
              onClick={() => {
                if (redirectPath) return navigate(redirectPath, { replace: true });
                return navigate(isAdmin ? "/admin/dashboard" : "/admin/access", { replace: true });
              }}
            >
              {redirectPath ? "Продолжить" : "Перейти в дашборд"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/school/login", { replace: true });
              }}
            >
              Выйти
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Входим…" : "Войти"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => navigate("/school/login", { replace: true })}
            >
              На сайт
            </Button>

            <div className="text-center pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">Нет аккаунта?</p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate("/school/signup")}
              >
                Зарегистрироваться
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
