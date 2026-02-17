import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, GraduationCap, User, Users, ShieldCheck, ArrowRight } from "lucide-react";

export default function SignupPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [role, setRole] = useState<string>("student");

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password || !fullName) {
            toast.error("Пожалуйста, заполните все поля");
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    }
                }
            });

            if (error) throw error;

            if (data.user) {
                // Upsert profile with selected role
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({
                        full_name: fullName,
                        role: role as any,
                        is_approved: false
                    })
                    .eq('auth_id', data.user.id);

                if (profileError) {
                    // Profile might not exist yet if internal trigger didn't fire fast enough
                    console.warn("Profile update failed, will try insert");
                    await supabase.from('profiles').insert([{
                        auth_id: data.user.id,
                        full_name: fullName,
                        role: role as any,
                        is_approved: false
                    }]);
                }

                toast.success("Регистрация успешна! Ожидайте подтверждения администратором.");
                navigate("/school/pending");
            }
        } catch (error: any) {
            toast.error("Ошибка регистрации: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FAFBFF] flex flex-col items-center justify-center p-4">
            <div className="mb-8 flex flex-col items-center">
                <div className="w-20 h-20 bg-primary rounded-[32px] shadow-2xl shadow-primary/30 flex items-center justify-center text-white mb-4">
                    <GraduationCap className="w-10 h-10" />
                </div>
                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Личность ПЛЮС</h1>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-1">Электронный портал</p>
            </div>

            <Card className="w-full max-w-lg rounded-[40px] border-2 border-slate-100 shadow-2xl overflow-hidden bg-white">
                <CardHeader className="bg-slate-50/50 p-10 pb-6 border-b-2 border-slate-100">
                    <CardTitle className="text-3xl font-black">Регистрация</CardTitle>
                    <CardDescription className="text-slate-500 font-bold">
                        Создайте аккаунт для доступа к дневнику и журналу
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-10 space-y-8">
                    <form onSubmit={handleSignup} className="space-y-6">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Как вас зовут?</Label>
                            <Input
                                placeholder="ФИО полностью"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="h-14 rounded-2xl border-2 font-bold px-6 bg-white"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Email</Label>
                                <Input
                                    type="email"
                                    placeholder="mail@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-14 rounded-2xl border-2 font-bold px-6 bg-white"
                                    required
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Пароль</Label>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-14 rounded-2xl border-2 font-bold px-6 bg-white"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Ваша роль в школе</Label>
                            <RadioGroup value={role} onValueChange={setRole} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="relative">
                                    <RadioGroupItem value="student" id="student" className="sr-only" />
                                    <Label
                                        htmlFor="student"
                                        className={`flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all cursor-pointer ${role === 'student' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 bg-white text-slate-400 hover:border-primary/30'}`}
                                    >
                                        <User className="w-6 h-6 mb-2" />
                                        <span className="text-xs font-black uppercase">Ученик</span>
                                    </Label>
                                </div>
                                <div className="relative">
                                    <RadioGroupItem value="parent" id="parent" className="sr-only" />
                                    <Label
                                        htmlFor="parent"
                                        className={`flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all cursor-pointer ${role === 'parent' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 bg-white text-slate-400 hover:border-primary/30'}`}
                                    >
                                        <Users className="w-6 h-6 mb-2" />
                                        <span className="text-xs font-black uppercase">Родитель</span>
                                    </Label>
                                </div>
                                <div className="relative">
                                    <RadioGroupItem value="teacher" id="teacher" className="sr-only" />
                                    <Label
                                        htmlFor="teacher"
                                        className={`flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all cursor-pointer ${role === 'teacher' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 bg-white text-slate-400 hover:border-primary/30'}`}
                                    >
                                        <ShieldCheck className="w-6 h-6 mb-2" />
                                        <span className="text-xs font-black uppercase">Учитель</span>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-16 rounded-[24px] bg-primary text-white font-black text-xl shadow-2xl shadow-primary/30 mt-4 hover:translate-y-[-2px] transition-all"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                <span className="flex items-center gap-3">Зарегистрироваться <ArrowRight className="w-6 h-6" /></span>
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="p-10 pt-0 bg-slate-50/30 flex justify-center">
                    <p className="text-slate-400 font-bold text-sm">
                        Уже есть аккаунт?{" "}
                        <Link to="/admin" className="text-primary hover:underline">Войти</Link>
                    </p>
                </CardFooter>
            </Card>

            <div className="mt-10 text-slate-300 font-bold text-xs uppercase tracking-widest">
                Личность ПЛЮС • Версия 1.0.1
            </div>
        </div>
    );
}
