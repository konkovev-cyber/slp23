import { useEffect, useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, Settings, Mail, User, Phone, MapPin, Award, Loader2, Save, X, ImageIcon, Link as LinkIcon, Upload, Check, Github } from "lucide-react";
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
import { APP_VERSION } from "@/config/app-info";
import { Capacitor } from "@capacitor/core";

const isNative = Capacitor.isNativePlatform();

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
    const [checkingUpdate, setCheckingUpdate] = useState(false);
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [latestVersion, setLatestVersion] = useState<string | null>(null);

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

    const checkForUpdates = async () => {
        try {
            setCheckingUpdate(true);
            const response = await fetch('https://api.github.com/repos/konkovev-cyber/slp23/releases/latest');
            const data = await response.json();
            const latestTag = data.tag_name?.replace('v', '');
            
            if (latestTag) {
                setLatestVersion(latestTag);
                // Сравниваем версии (простое сравнение)
                if (latestTag !== APP_VERSION) {
                    setUpdateAvailable(true);
                }
            }
        } catch (error) {
            console.error('Error checking for updates:', error);
        } finally {
            setCheckingUpdate(false);
        }
    };

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

            <div className="max-w-4xl mx-auto space-y-6 md:space-y-10 pb-20">
                {/* Profile Header Card */}
                <Card className="border-2 border-border rounded-[32px] md:rounded-[40px] overflow-hidden shadow-2xl bg-background">
                    <div className="h-32 md:h-40 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b-2 border-border" />
                    <CardContent className="px-6 md:px-10 pb-6 md:pb-10 -mt-16 md:-mt-20">
                        <div className="flex flex-col md:flex-row items-end gap-6 md:gap-10">
                            <div className="relative">
                                <Avatar className="w-28 h-28 md:w-40 md:h-40 border-4 md:border-8 border-background shadow-2xl rounded-[32px] md:rounded-[48px]">
                                    <AvatarImage src={profile?.avatar_url || DEFAULT_AVATAR} className="object-cover" />
                                    <AvatarFallback className="text-3xl md:text-4xl font-black bg-muted text-muted-foreground">
                                        {profile?.full_name?.[0] || "?"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 w-10 h-10 md:w-12 md:h-12 bg-emerald-500 rounded-xl md:rounded-2xl border-2 md:border-4 border-background flex items-center justify-center text-white shadow-lg">
                                    <Shield className="w-4 h-4 md:w-5 md:h-5" />
                                </div>
                            </div>

                            <div className="flex-1 pb-2 md:pb-4">
                                <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-2 md:mb-3">
                                    <h2 className="text-2xl md:text-4xl font-black text-foreground tracking-tight">{profile?.full_name || "Пользователь"}</h2>
                                    <div className="px-3 md:px-5 py-1 md:py-1.5 rounded-full bg-primary text-white text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">
                                        {profile?.role || "user"}
                                    </div>
                                </div>
                                <p className="text-sm md:text-base font-bold text-muted-foreground flex items-center gap-2">
                                    <Mail className="w-4 h-4" /> {profile?.auth_id ? "Привязано к системе" : "Личность+"}
                                </p>
                            </div>

                            {canEdit && (
                                <Button
                                    onClick={() => setIsEditing(true)}
                                    className="h-12 md:h-14 rounded-2xl md:rounded-3xl px-6 md:px-8 font-black bg-muted text-foreground shadow-sm border-2 border-border hover:bg-primary/10 transition-all text-sm md:text-base"
                                >
                                    <Settings className="w-4 h-4 md:w-5 md:h-5 mr-2" /> Редактировать
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Info Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
                    <Card className="border-2 border-border rounded-[24px] md:rounded-[32px] p-6 md:p-8 space-y-3 md:space-y-4 bg-background shadow-sm">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                            <User className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <div>
                            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">ID пользователя</p>
                            <p className="font-bold text-foreground truncate text-xs">{targetId}</p>
                        </div>
                    </Card>

                    <Card className="border-2 border-border rounded-[24px] md:rounded-[32px] p-6 md:p-8 space-y-3 md:space-y-4 bg-background shadow-sm">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                            <MapPin className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <div>
                            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Школа</p>
                            <p className="font-bold text-foreground text-sm md:text-base">МБОУ Гимназия №1</p>
                        </div>
                    </Card>

                    <Card className="border-2 border-border rounded-[24px] md:rounded-[32px] p-6 md:p-8 space-y-3 md:space-y-4 bg-background shadow-sm hover:border-primary/30 transition-all group">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                            <Award className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <div>
                            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Рейтинг</p>
                            <p className="font-bold text-foreground text-sm md:text-base">Топ 10% школы</p>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="rounded-[32px] md:rounded-[40px] border-2 p-0 max-w-lg w-[95vw] max-h-[95vh] bg-background overflow-hidden shadow-2xl flex flex-col">
                    <div className="p-6 md:p-10 pb-4 md:pb-6 bg-muted/30 border-b-2 border-border shrink-0">
                        <DialogHeader>
                            <DialogTitle className="text-2xl md:text-3xl font-black mb-1 text-foreground">Настройки профиля</DialogTitle>
                            <DialogDescription className="font-bold text-muted-foreground text-sm">
                                Измените свои персональные данные
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-6 md:p-10 space-y-4 md:space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                        {/* Version Info */}
                        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/20">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-foreground">Версия приложения</p>
                                    <p className="text-[10px] font-bold text-muted-foreground">v{APP_VERSION}</p>
                                </div>
                            </div>
                            <Button
                                onClick={checkForUpdates}
                                disabled={checkingUpdate}
                                variant="outline"
                                size="sm"
                                className="h-10 px-4 rounded-xl border-2 font-bold text-xs"
                            >
                                {checkingUpdate ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : updateAvailable ? (
                                    <span className="text-emerald-600">✓ Обновление</span>
                                ) : (
                                    <>
                                        <Github className="w-4 h-4 mr-2" />
                                        Проверить
                                    </>
                                )}
                            </Button>
                        </div>

                        {updateAvailable && latestVersion && !isNative && (
                            <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-2xl">
                                <p className="text-sm font-bold text-emerald-700 mb-2">
                                    🎉 Доступно обновление v{latestVersion}!
                                </p>
                                <a
                                    href="https://slp23.ru/slp23.apk"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    className="inline-flex items-center text-xs font-bold text-emerald-600 hover:text-emerald-700 underline"
                                >
                                    <Github className="w-3.5 h-3.5 mr-2" />
                                    Скачать APK (v{latestVersion})
                                </a>
                            </div>
                        )}

                        {/* Live Preview Area */}
                        <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-[32px] border-2 border-dashed border-border">
                            <Avatar className="w-24 h-24 border-4 border-background shadow-xl rounded-3xl mb-3">
                                <AvatarImage src={avatarUrl || DEFAULT_AVATAR} className="object-cover" />
                                <AvatarFallback className="font-black bg-muted text-muted-foreground">?</AvatarFallback>
                            </Avatar>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Предпросмотр выбора</p>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Ваше полное имя</Label>
                            <Input
                                placeholder="Напр.: Иванов Иван Иванович"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                className="h-14 rounded-2xl border-2 font-bold px-6 focus:ring-primary/20 bg-background"
                            />
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Аватар профиля</Label>

                            <Tabs defaultValue="presets" className="w-full">
                                <TabsList className="grid w-full grid-cols-3 h-12 rounded-2xl bg-muted p-1 mb-6 border-2 border-border shadow-sm">
                                    <TabsTrigger
                                        value="presets"
                                        className="rounded-xl font-bold text-[11px] uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-primary transition-all gap-2"
                                    >
                                        <ImageIcon className="w-3.5 h-3.5" /> Пресеты
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="upload"
                                        className="rounded-xl font-bold text-[11px] uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-primary transition-all gap-2"
                                    >
                                        <Upload className="w-3.5 h-3.5" /> Загрузить
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="link"
                                        className="rounded-xl font-bold text-[11px] uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-primary transition-all gap-2"
                                    >
                                        <LinkIcon className="w-3.5 h-3.5" /> Ссылка
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="presets" className="mt-0 focus-visible:outline-none">
                                    <div className="bg-muted/30 rounded-[32px] border-2 border-border p-4">
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
                                                            : 'border-background hover:border-primary/30 hover:scale-105 shadow-sm active:scale-95'
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
                                    <div className="bg-muted/30 rounded-[32px] border-2 border-border p-2">
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
                                    <div className="p-6 bg-muted/30 rounded-[32px] border-2 border-border space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Прямая ссылка</Label>
                                            <Input
                                                value={avatarUrl}
                                                onChange={(e) => setAvatarUrl(e.target.value)}
                                                placeholder="https://example.com/image.jpg"
                                                className="h-14 rounded-2xl border-2 font-bold focus:ring-primary/20 bg-background"
                                            />
                                        </div>
                                        <div className="flex items-center gap-4 p-4 bg-background rounded-2xl border-2 border-border shadow-sm">
                                            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-border bg-muted shrink-0">
                                                {avatarUrl ? (
                                                    <img
                                                        src={avatarUrl}
                                                        alt="Preview"
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => (e.currentTarget.src = DEFAULT_AVATAR)}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                        <ImageIcon className="w-8 h-8" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs font-black text-foreground">Предпросмотр</p>
                                                <p className="text-[10px] text-muted-foreground font-bold leading-tight italic">
                                                    Используйте ссылки на проверенные ресурсы. Изображение обновится автоматически.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>

                    <DialogFooter className="p-6 md:p-10 pt-0 flex flex-col gap-3 sm:flex-col shrink-0">
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
                            className="w-full h-12 rounded-xl font-bold text-muted-foreground hover:bg-muted transition-colors"
                        >
                            Отмена
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </SchoolLayout>
    );
}
