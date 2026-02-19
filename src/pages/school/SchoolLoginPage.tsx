import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LogIn, User, Mail, BookOpen, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";

const SITE_URL = "https://slp23.ru";

export default function SchoolLoginPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Синхронная проверка - работает сразу при рендере
    const isCapacitor = Capacitor.isNativePlatform();

    useEffect(() => {
        const checkAuth = async () => {
            const { data } = await supabase.auth.getSession();
            if (data.session) {
                navigate("/school/schedule", { replace: true });
            }
        };
        checkAuth();
    }, [navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email || !password) {
            toast.error("Введите email и пароль");
            return;
        }

        try {
            setLoading(true);
            
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (error) throw error;

            toast.success("Вход выполнен!");
            navigate("/school/schedule", { replace: true });
            
        } catch (error: any) {
            toast.error("Ошибка входа: " + (error.message || "Неверный email или пароль"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4 sm:p-6">
            <Helmet>
                <title>Вход | Электронный дневник</title>
            </Helmet>

            <Card className="w-full max-w-sm mx-auto border-2 border-border rounded-2xl shadow-xl bg-background">
                <CardHeader className="pb-4 text-center">
                    <div className="mx-auto mb-3 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shadow-md shadow-primary/20">
                        <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl font-bold text-foreground text-center">
                        Электронный дневник
                    </CardTitle>
                    <CardDescription className="text-muted-foreground font-medium text-center text-sm">
                        Вход в систему
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 p-4 sm:p-6">
                    <form onSubmit={handleLogin} className="space-y-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-xs font-bold text-muted-foreground pl-1">
                                Email
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="h-10 pl-10 rounded-xl border-2 font-medium focus:ring-primary/20 bg-background text-sm"
                                    autoCapitalize="off"
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="text-xs font-bold text-muted-foreground pl-1">
                                Пароль
                            </Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="h-10 pl-10 rounded-xl border-2 font-medium focus:ring-primary/20 bg-background text-sm"
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 rounded-xl bg-primary text-white font-bold text-base shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:translate-y-[-1px] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <LogIn className="w-4 h-4 mr-2" />
                                    Войти
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground font-bold">
                                Или
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Button
                            onClick={() => navigate("/school/signup")}
                            variant="outline"
                            className="w-full h-10 rounded-xl font-bold border-2 text-sm text-foreground hover:bg-muted"
                        >
                            <User className="w-4 h-4 mr-2" />
                            Регистрация
                        </Button>

                        <Button
                            onClick={async () => {
                                if (isCapacitor) {
                                    // В APK открываем главную сайта в браузере
                                    await Browser.open({ url: SITE_URL });
                                } else {
                                    // В вебе переходим на главную лендинга
                                    window.location.href = "/";
                                }
                            }}
                            variant="outline"
                            className="w-full h-10 rounded-xl font-medium border-2 text-sm text-foreground hover:bg-muted"
                        >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            На главную
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
