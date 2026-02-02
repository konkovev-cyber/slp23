import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, Settings, Mail, User, Phone, MapPin, Award, Loader2, Save, X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SchoolLayout from "@/components/school/SchoolLayout";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed=user";

export default function StudentProfilePage() {
    const { userId: currentUserId } = useAuth();
    const [searchParams] = useSearchParams();
    const targetId = searchParams.get("id") || currentUserId;

    const { role: currentUserRole } = useRole(currentUserId);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    const isOwnProfile = targetId === currentUserId;
    const canEdit = isOwnProfile || currentUserRole === 'admin';

    // Form states
    const [fullName, setFullName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (targetId) {
            fetchProfile();
        }
    }, [targetId]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("auth_id", targetId)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setProfile(data);
                setFullName(data.full_name || "");
                setAvatarUrl(data.avatar_url || "");
            }
        } catch (error: any) {
            toast.error("Ошибка при загрузке профиля: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!fullName.trim()) {
            toast.error("Имя не может быть пустым");
            return;
        }

        try {
            setSaving(true);
            const { error } = await supabase
                .from("profiles")
                .update({
                    full_name: fullName,
                    avatar_url: avatarUrl,
                    updated_at: new Date().toISOString()
                })
                .eq("auth_id", targetId);

            if (error) throw error;

            toast.success("Профиль обновлен");
            setIsEditing(false);
            fetchProfile();
        } catch (error: any) {
            toast.error("Ошибка при сохранении: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading && !profile) {
        return (
            <SchoolLayout title="Загрузка...">
                <div className="py-20 flex justify-center items-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
            </SchoolLayout>
        );
    }

    return (
        <SchoolLayout title="Мой профиль">
            <Helmet>
                <title>Профиль | {profile?.full_name || "Загрузка..."}</title>
            </Helmet>

            <div className="max-w-4xl mx-auto space-y-10">
                <Card className="border-2 border-slate-100 rounded-[40px] overflow-hidden shadow-2xl bg-white">
                    <div className="h-40 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b-2 border-slate-50" />
                    <CardContent className="px-10 pb-10 -mt-20">
                        <div className="flex flex-col md:flex-row items-end gap-10">
                            <div className="relative">
                                <Avatar className="w-40 h-40 border-8 border-white shadow-2xl rounded-[48px]">
                                    <AvatarImage src={profile?.avatar_url || DEFAULT_AVATAR} className="object-cover" />
                                    <AvatarFallback className="text-4xl font-black bg-slate-50 text-slate-300">
                                        {profile?.full_name?.[0] || "?"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-emerald-500 rounded-2xl border-4 border-white flex items-center justify-center text-white shadow-lg">
                                    <Shield className="w-5 h-5" />
                                </div>
                            </div>

                            <div className="flex-1 pb-4">
                                <div className="flex flex-wrap items-center gap-4 mb-3">
                                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">{profile?.full_name || "Пользователь"}</h2>
                                    <div className="px-5 py-1.5 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">
                                        {profile?.role || "user"}
                                    </div>
                                </div>
                                <p className="text-slate-400 font-bold flex items-center gap-2">
                                    <Mail className="w-4 h-4" /> {profile?.auth_id ? "Привязано к системе" : "Личность+"}
                                </p>
                            </div>

                            {canEdit && (
                                <Button
                                    onClick={() => setIsEditing(true)}
                                    className="h-14 rounded-3xl px-8 font-black bg-slate-100 text-slate-900 shadow-sm border-2 border-slate-200 hover:bg-slate-200"
                                >
                                    <Settings className="w-5 h-5 mr-3" /> Редактировать
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-20">
                    <Card className="border-2 border-slate-100 rounded-[32px] p-8 space-y-4 bg-white shadow-sm">
                        <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">ID пользователя</p>
                            <p className="font-bold text-slate-600 truncate text-xs">{targetId}</p>
                        </div>
                    </Card>

                    <Card className="border-2 border-slate-100 rounded-[32px] p-8 space-y-4 bg-white shadow-sm">
                        <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                            <MapPin className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Школа</p>
                            <p className="font-bold text-slate-900">МБОУ Гимназия №1</p>
                        </div>
                    </Card>

                    <Card className="border-2 border-slate-100 rounded-[32px] p-8 space-y-4 bg-white shadow-sm hover:border-primary/30 transition-all group">
                        <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                            <Award className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Рейтинг</p>
                            <p className="font-bold text-slate-900">Топ 10% школы</p>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="rounded-[40px] border-2 p-10 max-w-md bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black mb-2">Настройки профиля</DialogTitle>
                        <DialogDescription className="font-bold text-slate-500">
                            Измените свои персональные данные
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-8 py-8">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Ваше полное имя</Label>
                            <Input
                                placeholder="Напр.: Иванов Иван Иванович"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                className="h-14 rounded-2xl border-2 font-bold px-6 focus:ring-primary/20"
                            />
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Выберите персонажа (пресеты)</Label>
                            <div className="flex flex-wrap gap-3 p-2 bg-slate-50 rounded-2xl border-2 border-slate-100">
                                {[
                                    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
                                    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
                                    "https://api.dicebear.com/7.x/avataaars/svg?seed=Scooter",
                                    "https://api.dicebear.com/7.x/avataaars/svg?seed=Buddy",
                                    "https://api.dicebear.com/7.x/avataaars/svg?seed=Ginger",
                                    // New cartoon avatars
                                    "https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg",
                                    "https://img.freepik.com/premium-vector/woman-avatar-profile-picture-vector-illustration_268834-541.jpg",
                                    "https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-535.jpg",
                                    "https://img.freepik.com/premium-vector/woman-avatar-profile-picture-vector-illustration_268834-537.jpg"
                                ].map(url => (
                                    <button
                                        key={url}
                                        type="button"
                                        onClick={() => setAvatarUrl(url)}
                                        className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${avatarUrl === url ? 'border-primary ring-2 ring-primary/20 scale-110' : 'border-white hover:border-slate-300'}`}
                                    >
                                        <img src={url} alt="avatar" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Ссылка на аватар</Label>
                            <Input
                                value={avatarUrl}
                                onChange={(e) => setAvatarUrl(e.target.value)}
                                placeholder="URL изображения..."
                                className="h-14 rounded-2xl border-2 font-bold focus:ring-primary/20"
                            />
                            <p className="text-[10px] text-slate-400 font-bold px-2 italic">Вы можете использовать прямую ссылку на любое изображение</p>
                        </div>
                    </div>

                    <DialogFooter className="flex flex-col gap-3 sm:flex-col">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full h-16 rounded-[24px] bg-primary text-white font-black text-xl shadow-2xl shadow-primary/30 hover:translate-y-[-2px] transition-all"
                        >
                            {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6 mr-2" />}
                            Сохранить изменения
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setIsEditing(false)}
                            className="w-full h-12 rounded-xl font-bold text-slate-400"
                        >
                            Отмена
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </SchoolLayout>
    );
}
