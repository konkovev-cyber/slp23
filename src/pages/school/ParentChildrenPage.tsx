import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Users,
    BookOpen,
    Award,
    ChevronRight,
    Loader2,
    GraduationCap,
    Heart
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import SchoolLayout from "@/components/school/SchoolLayout";
import { toast } from "sonner";

type Child = {
    auth_id: string;
    full_name: string;
    avatar_url: string | null;
    class_name: string | null;
};

export default function ParentChildrenPage() {
    const { userId } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [children, setChildren] = useState<Child[]>([]);

    useEffect(() => {
        if (userId) fetchChildren();
    }, [userId]);

    const fetchChildren = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("parents_children")
                .select("child_id")
                .eq("parent_id", userId);

            if (error) throw error;

            const childIds = (data || []).map(d => d.child_id);

            // Fetch profiles
            const { data: profiles } = await supabase
                .from("profiles")
                .select("auth_id, full_name, avatar_url, students_info(school_classes(name))")
                .in("auth_id", childIds);

            const list = (profiles || []).map((p: any) => ({
                auth_id: p.auth_id,
                full_name: p.full_name,
                avatar_url: p.avatar_url,
                class_name: p.students_info?.[0]?.school_classes?.name || null
            }));

            setChildren(list);
        } catch (error: any) {
            toast.error("Ошибка загрузки данных: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SchoolLayout title="Мои дети">
            <Helmet>
                <title>Дети | Родителю</title>
            </Helmet>

            <div className="max-w-4xl mx-auto space-y-10 pb-20">
                <div className="bg-background p-8 rounded-[40px] border-2 border-border shadow-2xl shadow-muted/10/50 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary">
                            <Heart className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-foreground">Семья</h2>
                            <p className="font-bold text-muted-foreground">Успеваемость и посещаемость ваших детей</p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="py-24 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="animate-spin text-primary w-12 h-12" />
                        <span className="font-black uppercase tracking-[0.2em] text-[10px] text-muted-foreground">Загрузка профилей...</span>
                    </div>
                ) : children.length === 0 ? (
                    <Card className="border-4 border-dashed border-border p-24 text-center rounded-[48px] bg-muted/50">
                        <Users className="w-20 h-20 text-slate-100 mx-auto mb-6" />
                        <h3 className="text-xl font-black text-muted-foreground mb-2 uppercase tracking-widest">Нет привязок</h3>
                        <p className="text-muted-foreground font-bold italic">Обратитесь к администратору для привязки вашего ребенка к аккаунту</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {children.map((child) => (
                            <Card key={child.auth_id} className="group overflow-hidden border-2 border-border rounded-[40px] bg-background hover:border-primary/20 hover:shadow-2xl transition-all duration-500">
                                <CardContent className="p-10 flex flex-col items-center text-center">
                                    <Avatar className="w-24 h-24 border-4 border-white shadow-xl rounded-[32px] mb-6 group-hover:scale-110 transition-transform duration-500">
                                        <AvatarImage src={child.avatar_url || ""} />
                                        <AvatarFallback className="text-2xl font-black bg-muted text-muted-foreground">
                                            {child.full_name[0]}
                                        </AvatarFallback>
                                    </Avatar>

                                    <h3 className="text-2xl font-black text-foreground mb-2">{child.full_name}</h3>
                                    <div className="flex items-center gap-2 mb-8">
                                        <GraduationCap className="w-4 h-4 text-primary/60" />
                                        <span className="font-bold text-muted-foreground uppercase tracking-widest text-xs">
                                            {child.class_name ? `КЛАСС ${child.class_name}` : 'Класс не назначен'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 w-full">
                                        <Button
                                            variant="outline"
                                            className="h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 border-border hover:bg-muted gap-2"
                                            onClick={() => navigate(`/school/grades?studentId=${child.auth_id}`)}
                                        >
                                            <Award className="w-4 h-4" /> Оценки
                                        </Button>
                                        <Button
                                            className="h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-foreground text-white shadow-lg gap-2"
                                            onClick={() => navigate(`/school/diary?studentId=${child.auth_id}`)}
                                        >
                                            <BookOpen className="w-4 h-4" /> Дневник
                                        </Button>
                                    </div>
                                </CardContent>
                                <div className="bg-muted/50 py-4 px-10 border-t border-slate-50 flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Активность сегодня</span>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </SchoolLayout>
    );
}
