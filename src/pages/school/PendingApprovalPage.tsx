import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, GraduationCap, LogOut, RefreshCw } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useEffect } from "react";

export default function PendingApprovalPage() {
    const navigate = useNavigate();
    const { isApproved, refresh, isLoading } = useProfile();

    useEffect(() => {
        if (isApproved && !isLoading) {
            navigate("/school/diary");
        }
    }, [isApproved, isLoading, navigate]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate("/school/login");
    };

    return (
        <div className="min-h-screen bg-[#FAFBFF] flex flex-col items-center justify-center p-4 text-center">
            <div className="mb-8 flex flex-col items-center">
                <div className="w-20 h-20 bg-amber-500 rounded-[32px] shadow-2xl shadow-amber-500/30 flex items-center justify-center text-white mb-4 animate-pulse">
                    <Clock className="w-10 h-10" />
                </div>
                <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">Доступ ограничен</h1>
                <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-[0.3em] mt-1">Ожидание подтверждения</p>
            </div>

            <Card className="w-full max-w-lg rounded-[40px] border-2 border-border shadow-2xl overflow-hidden bg-background px-10 py-12">
                <CardHeader className="p-0 mb-8">
                    <CardTitle className="text-2xl font-black">Ваш аккаунт на проверке</CardTitle>
                    <CardDescription className="text-muted-foreground font-bold mt-3">
                        Администратор проверяет ваши данные. Как только доступ будет разрешен, вы сможете войти в дневник.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0 space-y-6">
                    <div className="p-6 bg-muted rounded-3xl border-2 border-border text-left">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Что делать?</p>
                        <ul className="text-sm font-semibold text-muted-foreground space-y-2 list-disc pl-4">
                            <li>Сообщите классному руководителю о регистрации</li>
                            <li>Дождитесь уведомления (или просто обновите страницу)</li>
                            <li>Обычно проверка занимает не более 24 часов</li>
                        </ul>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={() => refresh()}
                            className="h-16 rounded-3xl bg-primary text-white font-black text-lg gap-3"
                        >
                            <RefreshCw className="w-5 h-5" /> Проверить статус
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={handleSignOut}
                            className="h-12 rounded-xl text-muted-foreground font-bold hover:bg-muted gap-2"
                        >
                            <LogOut className="w-4 h-4" /> Выйти
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="mt-10 flex items-center gap-3 text-muted-foreground font-bold text-xs uppercase tracking-widest">
                <GraduationCap className="w-4 h-4" /> Личность ПЛЮС
            </div>
        </div>
    );
}
