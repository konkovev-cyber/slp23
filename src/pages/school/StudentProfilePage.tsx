import { useEffect, useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, Settings, Mail, User, Phone, MapPin, Award, Loader2, Save, X, ImageIcon, Link as LinkIcon, Upload, Check } from "lucide-react";
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
import ImageUploader, { ImageValue } from "@/components/admin/ImageUploader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Preset avatars from public folder
const PRESET_AVATARS = [
    ...Array.from({ length: 10 }, (_, i) => `/avatars/avatar_${i + 1}.jpg`),
    ...Array.from({ length: 10 }, (_, i) => `/avatars/human_${i + 1}.jpg`),
    ...Array.from({ length: 5 }, (_, i) => `/avatars/dicebear_${i + 1}.png`),
    ...Array.from({ length: 5 }, (_, i) => `/avatars/pravatar_${i + 1}.jpg`),
    ...Array.from({ length: 5 }, (_, i) => `/avatars/robot_${i + 1}.png`),
];

const DEFAULT_AVATAR = PRESET_AVATARS[0];

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

    // ImageUploader state mapping
    const imageValue = useMemo<ImageValue>(() => {
        if (!avatarUrl) return null;
        if (avatarUrl.includes("supabase.co") || avatarUrl.includes("/storage/v1/object/public/avatars/")) {
            return {
                bucket: "avatars",
                path: avatarUrl.split('/').pop() || "",
                publicUrl: avatarUrl
            };
        }
        return null;
    }, [avatarUrl]);

    useEffect(() => {
        if (targetId) {
            fetchProfile();
        }
    }, [targetId]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            // Try fetching by auth_id first (most common link)
            let { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("auth_id", targetId)
                .maybeSingle();

            // Fallback to id if auth_id didn't work
            if (!data && !error) {
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", targetId)
                    .maybeSingle();
                data = fallbackData;
                error = fallbackError;
            }

            if (error) throw error;

            if (data) {
                setProfile(data);
                setFullName(data.full_name || "");
                setAvatarUrl(data.avatar_url || "");
            } else {
                console.warn("Profile not found for ID:", targetId);
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

            // First, try to update by auth_id
            const { data: updateData, error, count } = await supabase
                .from("profiles")
                .update({
                    full_name: fullName,
                    avatar_url: avatarUrl,
                    updated_at: new Date().toISOString()
                }, { count: 'exact' })
                .eq("auth_id", targetId)
                .select();

            if (error) throw error;

            // If no rows were updated by auth_id, try by id
            if (!updateData || updateData.length === 0) {
                const { data: retryData, error: retryError } = await supabase
                    .from("profiles")
                    .update({
                        full_name: fullName,
                        avatar_url: avatarUrl,
                        updated_at: new Date().toISOString()
                    })
                    .eq("auth_id", targetId)
                    .select();

                if (retryError) throw retryError;

                if (!retryData || retryData.length === 0) {
                    throw new Error("Не удалось найти профиль для обновления. Возможно, у вас нет прав.");
                }
            }

            toast.success("Профиль обновлен");
            setIsEditing(false);

            // Update local state immediately to avoid flickers
            setProfile(prev => ({
                ...prev,
                full_name: fullName,
                avatar_url: avatarUrl
            }));

            // Still refetch to be sure
            fetchProfile();
        } catch (error: any) {
            toast.error("Ошибка при сохранении: " + error.message);
            console.error("Save error:", error);
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
                                    className="h-14 rounded-3xl px-8 font-black bg-slate-100 text-slate-900 shadow-sm border-2 border-slate-200 hover:bg-slate-200 transition-all"
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
                <DialogContent className="rounded-[40px] border-2 p-0 max-w-lg bg-white overflow-hidden shadow-2xl">
                    <div className="p-10 pb-6 bg-slate-50/50 border-b-2 border-slate-100">
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-black mb-1">Настройки профиля</DialogTitle>
                            <DialogDescription className="font-bold text-slate-500">
                                Измените свои персональные данные
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        {/* Live Preview Area */}
                        <div className="flex flex-col items-center justify-center p-6 bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-200">
                            <Avatar className="w-24 h-24 border-4 border-white shadow-xl rounded-3xl mb-3">
                                <AvatarImage src={avatarUrl || DEFAULT_AVATAR} className="object-cover" />
                                <AvatarFallback className="font-black bg-white text-slate-200">?</AvatarFallback>
                            </Avatar>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Предпросмотр выбора</p>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Ваше полное имя</Label>
                            <Input
                                placeholder="Напр.: Иванов Иван Иванович"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                className="h-14 rounded-2xl border-2 font-bold px-6 focus:ring-primary/20 bg-white"
                            />
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Аватар профиля</Label>

                            <Tabs defaultValue="presets" className="w-full">
                                <TabsList className="grid w-full grid-cols-3 h-12 rounded-2xl bg-slate-100 p-1 mb-6 border-2 border-slate-100 shadow-sm">
                                    <TabsTrigger
                                        value="presets"
                                        className="rounded-xl font-bold text-[11px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary transition-all gap-2"
                                    >
                                        <ImageIcon className="w-3.5 h-3.5" /> Пресеты
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="upload"
                                        className="rounded-xl font-bold text-[11px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary transition-all gap-2"
                                    >
                                        <Upload className="w-3.5 h-3.5" /> Загрузить
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="link"
                                        className="rounded-xl font-bold text-[11px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary transition-all gap-2"
                                    >
                                        <LinkIcon className="w-3.5 h-3.5" /> Ссылка
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="presets" className="mt-0 focus-visible:outline-none">
                                    <div className="bg-slate-50/50 rounded-[32px] border-2 border-slate-100 p-4">
                                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                                            {PRESET_AVATARS.map((url, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => setAvatarUrl(url)}
                                                    className={`
                                                        relative group aspect-square rounded-2xl overflow-hidden border-4 transition-all duration-300
                                                        ${avatarUrl === url
                                                            ? 'border-primary ring-4 ring-primary/10 scale-95'
                                                            : 'border-white hover:border-primary/30 hover:scale-105 shadow-sm active:scale-95'
                                                        }
                                                    `}
                                                >
                                                    <img
                                                        src={url}
                                                        alt={`avatar-${idx}`}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    />
                                                    {avatarUrl === url && (
                                                        <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                                                            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white shadow-lg animate-in zoom-in-50">
                                                                <Check className="w-3.5 h-3.5 stroke-[4px]" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="upload" className="mt-0 focus-visible:outline-none">
                                    <div className="bg-slate-50/50 rounded-[32px] border-2 border-slate-100 p-2">
                                        <ImageUploader
                                            bucket="avatars"
                                            label="Ваша фотография"
                                            helpText="Загрузите файл PNG или JPG до 5МБ"
                                            value={imageValue}
                                            onChange={(next) => next && setAvatarUrl(next.publicUrl)}
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="link" className="mt-0 focus-visible:outline-none">
                                    <div className="p-6 bg-slate-50/50 rounded-[32px] border-2 border-slate-100 space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Прямая ссылка</Label>
                                            <Input
                                                value={avatarUrl}
                                                onChange={(e) => setAvatarUrl(e.target.value)}
                                                placeholder="https://example.com/image.jpg"
                                                className="h-14 rounded-2xl border-2 font-bold focus:ring-primary/20 bg-white"
                                            />
                                        </div>
                                        <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border-2 border-slate-50 shadow-sm">
                                            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-slate-100 bg-slate-50 shrink-0">
                                                {avatarUrl ? (
                                                    <img
                                                        src={avatarUrl}
                                                        alt="Preview"
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => (e.currentTarget.src = DEFAULT_AVATAR)}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-200">
                                                        <ImageIcon className="w-8 h-8" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs font-black text-slate-600">Предпросмотр</p>
                                                <p className="text-[10px] text-slate-400 font-bold leading-tight italic">
                                                    Используйте ссылки на проверенные ресурсы. Изображение обновится автоматически.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>

                    <DialogFooter className="p-10 pt-0 flex flex-col gap-3 sm:flex-col mt-4">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full h-16 rounded-[24px] bg-primary text-white font-black text-xl shadow-2xl shadow-primary/30 hover:translate-y-[-2px] hover:shadow-primary/40 transition-all active:scale-[0.98]"
                        >
                            {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6 mr-2" />}
                            Сохранить изменения
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setIsEditing(false)}
                            className="w-full h-12 rounded-xl font-bold text-slate-400 hover:bg-slate-50 transition-colors"
                        >
                            Отмена
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </SchoolLayout>
    );
}
