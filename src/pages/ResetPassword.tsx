import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Режим: "reset" - отправить ссылку, "update" - обновить пароль
    const [mode, setMode] = useState<"reset" | "update">("reset");

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + "/reset-password?type=update",
            });
            if (error) throw error;
            setMessage("Ссылка для сброса пароля отправлена на email!");
        } catch (err: any) {
            setMessage("Ошибка: " + (err?.message ?? "Unknown error"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            setMessage("Пароль успешно обновлён! Теперь войдите.");
            setTimeout(() => navigate("/admin/login"), 2000);
        } catch (err: any) {
            setMessage("Ошибка: " + (err?.message ?? "Unknown error"));
        } finally {
            setIsLoading(false);
        }
    };

    // Проверяем URL параметр для режима обновления
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get("type");

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <Helmet>
                <title>{mode === "reset" ? "Сброс пароля" : "Новый пароль"}</title>
            </Helmet>

            <Card className="w-full max-w-md p-6">
                <h1 className="text-2xl font-bold text-foreground">
                    {mode === "reset" ? "Сброс пароля" : "Введите новый пароль"}
                </h1>

                {message && (
                    <div className="mt-4 p-3 bg-muted rounded text-sm">{message}</div>
                )}

                {type === "update" || mode === "update" ? (
                    <form onSubmit={handleUpdate} className="mt-6 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Новый пароль (минимум 6 символов)</Label>
                            <Input
                                id="password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Обновляем…" : "Обновить пароль"}
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={handleReset} className="mt-6 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Отправляем…" : "Отправить ссылку"}
                        </Button>
                    </form>
                )}

                <Button
                    type="button"
                    variant="ghost"
                    className="w-full mt-4"
                    onClick={() => navigate("/admin/login")}
                >
                    Назад ко входу
                </Button>
            </Card>
        </div>
    );
}
