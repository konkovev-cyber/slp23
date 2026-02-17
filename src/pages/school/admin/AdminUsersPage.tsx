import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, User, Mail, Shield, Loader2, RefreshCw } from "lucide-react";
import SchoolLayout from "@/components/school/SchoolLayout";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type Profile = {
    auth_id: string;
    full_name: string;
    role: string;
    is_approved: boolean;
    created_at: string;
    avatar_url: string | null;
};

export default function AdminUsersPage() {
    const qc = useQueryClient();
    const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");

    const { data: users = [], isLoading, refetch } = useQuery({
        queryKey: ["admin_users", filter],
        queryFn: async () => {
            let query = supabase
                .from("profiles")
                .select("*")
                .order("created_at", { ascending: false });

            if (filter === "pending") {
                query = query.eq("is_approved", false);
            } else if (filter === "approved") {
                query = query.eq("is_approved", true);
            }

            const { data, error } = await query;
            if (error) throw error;
            return (data || []) as Profile[];
        },
    });

    const approveMutation = useMutation({
        mutationFn: async (userId: string) => {
            const { error } = await supabase
                .from("profiles")
                .update({ is_approved: true })
                .eq("auth_id", userId);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Пользователь одобрен");
            qc.invalidateQueries({ queryKey: ["admin_users"] });
        },
        onError: (error: any) => {
            toast.error("Ошибка: " + error.message);
        },
    });

    const rejectMutation = useMutation({
        mutationFn: async (userId: string) => {
            // Delete user from auth and profile will cascade
            const { error } = await supabase.auth.admin.deleteUser(userId);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Пользователь отклонен и удален");
            qc.invalidateQueries({ queryKey: ["admin_users"] });
        },
        onError: (error: any) => {
            toast.error("Ошибка: " + error.message);
        },
    });

    const changeRoleMutation = useMutation({
        mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
            const { error } = await supabase
                .from("profiles")
                .update({ role: newRole })
                .eq("auth_id", userId);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Роль изменена");
            qc.invalidateQueries({ queryKey: ["admin_users"] });
        },
        onError: (error: any) => {
            toast.error("Ошибка: " + error.message);
        },
    });

    const getRoleBadge = (role: string) => {
        const colors: Record<string, string> = {
            admin: "bg-rose-500 text-white",
            teacher: "bg-blue-500 text-white",
            student: "bg-emerald-500 text-white",
            parent: "bg-amber-500 text-white",
        };
        return colors[role] || "bg-slate-500 text-white";
    };

    const getRoleLabel = (role: string) => {
        const labels: Record<string, string> = {
            admin: "Администратор",
            teacher: "Учитель",
            student: "Ученик",
            parent: "Родитель",
        };
        return labels[role] || role;
    };

    return (
        <SchoolLayout title="Управление пользователями">
            <Helmet>
                <title>Пользователи | Админ-панель</title>
            </Helmet>

            <div className="space-y-6">
                <Card className="border-2 border-slate-100 rounded-[32px] shadow-lg">
                    <CardHeader className="pb-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-2xl font-black flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                                        <Shield className="w-5 h-5 text-primary" />
                                    </div>
                                    Управление пользователями
                                </CardTitle>
                                <CardDescription className="mt-2 font-bold">
                                    Одобрение регистраций и управление ролями
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-3">
                                <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
                                    <SelectTrigger className="w-[180px] h-12 rounded-2xl border-2 font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Все пользователи</SelectItem>
                                        <SelectItem value="pending">Ожидают одобрения</SelectItem>
                                        <SelectItem value="approved">Одобренные</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => refetch()}
                                    className="h-12 w-12 rounded-2xl border-2"
                                >
                                    <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="py-20 flex justify-center">
                                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                            </div>
                        ) : users.length === 0 ? (
                            <div className="py-20 text-center">
                                <Clock className="w-16 h-16 mx-auto text-slate-200 mb-4" />
                                <h3 className="text-lg font-black text-slate-900 mb-2">Пользователей нет</h3>
                                <p className="text-slate-400 font-bold text-sm">
                                    {filter === "pending" && "Нет пользователей, ожидающих одобрения"}
                                    {filter === "approved" && "Нет одобренных пользователей"}
                                    {filter === "all" && "В системе пока нет пользователей"}
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-2xl border-2 border-slate-100 overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                            <TableHead className="font-black uppercase text-[10px] tracking-widest">Пользователь</TableHead>
                                            <TableHead className="font-black uppercase text-[10px] tracking-widest">Роль</TableHead>
                                            <TableHead className="font-black uppercase text-[10px] tracking-widest">Статус</TableHead>
                                            <TableHead className="font-black uppercase text-[10px] tracking-widest">Дата</TableHead>
                                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-right">Действия</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.map((user) => (
                                            <TableRow key={user.auth_id} className="hover:bg-slate-50/50">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="w-10 h-10 rounded-2xl border-2 border-white shadow-sm">
                                                            <AvatarImage src={user.avatar_url || undefined} />
                                                            <AvatarFallback className="rounded-2xl bg-slate-100 text-slate-400 font-black">
                                                                {user.full_name?.[0] || "?"}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-bold text-slate-900">{user.full_name || "Без имени"}</p>
                                                            <p className="text-xs text-slate-400 font-mono">{user.auth_id.slice(0, 8)}...</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {user.is_approved ? (
                                                        <Select
                                                            value={user.role}
                                                            onValueChange={(newRole) =>
                                                                changeRoleMutation.mutate({ userId: user.auth_id, newRole })
                                                            }
                                                        >
                                                            <SelectTrigger className="w-[140px] h-9 rounded-xl border-2 font-bold text-xs">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="student">Ученик</SelectItem>
                                                                <SelectItem value="teacher">Учитель</SelectItem>
                                                                <SelectItem value="parent">Родитель</SelectItem>
                                                                <SelectItem value="admin">Администратор</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        <Badge className={`${getRoleBadge(user.role)} rounded-xl px-3 py-1 font-black text-[10px] uppercase tracking-wider`}>
                                                            {getRoleLabel(user.role)}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {user.is_approved ? (
                                                        <Badge className="bg-emerald-50 text-emerald-600 border-2 border-emerald-100 rounded-xl px-3 py-1 font-black text-[10px] uppercase tracking-wider">
                                                            <CheckCircle className="w-3 h-3 mr-1" /> Одобрен
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-amber-50 text-amber-600 border-2 border-amber-100 rounded-xl px-3 py-1 font-black text-[10px] uppercase tracking-wider">
                                                            <Clock className="w-3 h-3 mr-1" /> Ожидает
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <p className="text-xs font-bold text-slate-400">
                                                        {new Date(user.created_at).toLocaleDateString("ru-RU")}
                                                    </p>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {!user.is_approved && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => approveMutation.mutate(user.auth_id)}
                                                                    disabled={approveMutation.isPending}
                                                                    className="h-9 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold gap-2"
                                                                >
                                                                    <CheckCircle className="w-4 h-4" /> Одобрить
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => rejectMutation.mutate(user.auth_id)}
                                                                    disabled={rejectMutation.isPending}
                                                                    className="h-9 rounded-xl border-2 border-rose-200 text-rose-600 hover:bg-rose-50 font-bold gap-2"
                                                                >
                                                                    <XCircle className="w-4 h-4" /> Отклонить
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-2 border-slate-100 rounded-3xl p-6 bg-gradient-to-br from-emerald-50 to-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Одобренные</p>
                                <p className="text-3xl font-black text-slate-900">
                                    {users.filter(u => u.is_approved).length}
                                </p>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle className="w-7 h-7 text-emerald-500" />
                            </div>
                        </div>
                    </Card>

                    <Card className="border-2 border-slate-100 rounded-3xl p-6 bg-gradient-to-br from-amber-50 to-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Ожидают</p>
                                <p className="text-3xl font-black text-slate-900">
                                    {users.filter(u => !u.is_approved).length}
                                </p>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                                <Clock className="w-7 h-7 text-amber-500" />
                            </div>
                        </div>
                    </Card>

                    <Card className="border-2 border-slate-100 rounded-3xl p-6 bg-gradient-to-br from-blue-50 to-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Всего</p>
                                <p className="text-3xl font-black text-slate-900">
                                    {users.length}
                                </p>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                                <User className="w-7 h-7 text-blue-500" />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </SchoolLayout>
    );
}
