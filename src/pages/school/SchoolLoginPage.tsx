import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, LogIn, User, Mail, BookOpen, Info, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function SchoolLoginPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Проверяем, авторизован ли пользователь уже
    useEffect(() => {
        const checkAuth = async () => {
            const { data } = await supabase.auth.getSession();
            if (data.session) {
                // Уже авторизован - редирект на расписание
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
            
            // Редирект на расписание после входа
            navigate("/school/schedule", { replace: true });
            
        } catch (error: any) {
            toast.error("Ошибка входа: " + (error.message || "Неверный email или пароль"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
            <Helmet>
                <title>Вход | Электронный дневник</title>
            </Helmet>

            <Card className="w-full max-w-md border-2 border-border rounded-[32px] shadow-2xl bg-background">
                <CardHeader className="pb-6 text-center">
                    <div className="mx-auto mb-4 w-20 h-20 rounded-[24px] bg-primary/10 flex items-center justify-center shadow-lg shadow-primary/20">
                        <BookOpen className="w-10 h-10 text-primary" />
                    </div>
                    <CardTitle className="text-3xl font-black text-foreground text-center">
                        Электронный дневник
                    </CardTitle>
                    <CardDescription className="text-muted-foreground font-bold text-center">
                        Личность ПЛЮС • Расписание и оценки
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                    {/* Подсказка для новых пользователей */}
                    <Alert className="mb-4 bg-white/80 border-primary/20 shadow-sm">
                        <Info className="h-4 w-4 text-primary" />
                        <AlertDescription className="text-sm font-medium ml-2">
                            <strong>Впервые здесь?</strong> Ваш логин — это email, который вы указали при записи в школу. Обратитесь к классному руководителю для получения пароля.
                        </AlertDescription>
                    </Alert>

                    {/* Быстрые подсказки */}
                    <div className="space-y-2 p-4 bg-muted/50 rounded-2xl border border-muted mb-4">
                        <div className="flex items-start gap-2 text-xs">
                            <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <p className="text-muted-foreground font-medium">
                                <strong className="text-foreground">Ученики:</strong> Логин — email родителя, пароль выдает классный руководитель
                            </p>
                        </div>
                        <div className="flex items-start gap-2 text-xs">
                            <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <p className="text-muted-foreground font-medium">
                                <strong className="text-foreground">Родители:</strong> Используйте email, указанный при записи ребенка
                            </p>
                        </div>
                        <div className="flex items-start gap-2 text-xs">
                            <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <p className="text-muted-foreground font-medium">
                                <strong className="text-foreground">Учителя:</strong> Логин — рабочий email, пароль в методическом кабинете
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">
                                Email
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="h-14 pl-12 rounded-2xl border-2 font-bold focus:ring-primary/20 bg-background"
                                    autoCapitalize="off"
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">
                                Пароль
                            </Label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="h-14 pl-12 rounded-2xl border-2 font-bold focus:ring-primary/20 bg-background"
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-16 rounded-[24px] bg-primary text-white font-black text-lg shadow-2xl shadow-primary/30 hover:shadow-primary/40 hover:translate-y-[-2px] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
                        >
                            {loading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5 mr-3" />
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
                            <span className="bg-background px-3 text-muted-foreground font-bold tracking-widest">
                                Или
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Button
                            onClick={() => navigate("/school/signup")}
                            variant="outline"
                            className="w-full h-14 rounded-2xl font-black border-2"
                        >
                            <User className="w-5 h-5 mr-3" />
                            Регистрация
                        </Button>

                        <Button
                            onClick={() => navigate("/")}
                            variant="ghost"
                            className="w-full h-14 rounded-2xl font-bold text-muted-foreground hover:bg-muted"
                        >
                            На главную сайта
                        </Button>
                    </div>

                    <p className="text-center text-[10px] text-muted-foreground font-medium uppercase tracking-widest pt-4">
                        Вход означает согласие с правилами школы
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
