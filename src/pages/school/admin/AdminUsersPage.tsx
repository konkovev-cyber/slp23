import { useEffect, useState } from "react";
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
import { CheckCircle, XCircle, Clock, User, Shield, Loader2, RefreshCw, Edit2, Trash2 } from "lucide-react";
import SchoolLayout from "@/components/school/SchoolLayout";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedUserClass, setSelectedUserClass] = useState<string>("");

    useEffect(() => {
        const fetchClasses = async () => {
            const { data } = await supabase.from("school_classes").select("*").order("name");
            setClasses(data || []);
        };
        fetchClasses();
    }, []);

    const handleEditUser = async (user: Profile) => {
        setEditingUser(user);
        if (user.role === 'student') {
            const { data } = await supabase
                .from("students_info")
                .select("class_id")
                .eq("student_id", user.auth_id)
                .maybeSingle();
            setSelectedUserClass(data?.class_id?.toString() || "");
        } else {
            setSelectedUserClass("");
        }
    };

    const updateProfileMutation = useMutation({
        mutationFn: async (payload: { user: Profile; class_id?: string }) => {
            // 1. Update Profile
            const { error: pErr } = await supabase
                .from("profiles")
                .update({ full_name: payload.user.full_name, role: payload.user.role })
                .eq("auth_id", payload.user.auth_id);
            if (pErr) throw pErr;

            // 2. Update Class if student
            if (payload.user.role === 'student' && payload.class_id) {
                const classId = parseInt(payload.class_id);
                // Check if exists
                const { data: existing } = await supabase
                    .from("students_info")
                    .select("id")
                    .eq("student_id", payload.user.auth_id)
                    .maybeSingle();

                if (existing) {
                    const { error: sErr } = await supabase
                        .from("students_info")
                        .update({ class_id: classId })
                        .eq("student_id", payload.user.auth_id);
                    if (sErr) throw sErr;
                } else {
                    const { error: sErr } = await supabase
                        .from("students_info")
                        .insert({ student_id: payload.user.auth_id, class_id: classId });
                    if (sErr) throw sErr;
                }
            }
        },
        onSuccess: () => {
            toast.success("Профиль сохранен");
            qc.invalidateQueries({ queryKey: ["admin_users"] });
            setEditingUser(null);
        },
        onError: (error: any) => toast.error(error.message),
    });

    const deleteUserMutation = useMutation({
        mutationFn: async (userId: string) => {
            const { error } = await supabase.auth.admin.deleteUser(userId);
            if (error) {
                const { error: pErr } = await supabase.from("profiles").delete().eq("auth_id", userId);
                if (pErr) throw pErr;
            }
        },
        onSuccess: () => {
            toast.success("Пользователь удален");
            qc.invalidateQueries({ queryKey: ["admin_users"] });
            setEditingUser(null);
        },
        onError: (error: any) => toast.error(error.message),
    });

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
            return (data || []) as any[];
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
            teacher: "bg-primary/50 text-white",
            student: "bg-emerald-500 text-white",
            parent: "bg-amber-500 text-white",
        };
        return colors[role] || "bg-muted0 text-white";
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
                <Card className="border-2 border-border rounded-[32px] shadow-lg">
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
                                <h3 className="text-lg font-black text-foreground mb-2">Пользователей нет</h3>
                                <p className="text-muted-foreground font-bold text-sm">
                                    {filter === "pending" && "Нет пользователей, ожидающих одобрения"}
                                    {filter === "approved" && "Нет одобренных пользователей"}
                                    {filter === "all" && "В системе пока нет пользователей"}
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-2xl border-2 border-border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                                            <TableHead className="font-black uppercase text-[10px] tracking-widest">Пользователь</TableHead>
                                            <TableHead className="font-black uppercase text-[10px] tracking-widest">Роль</TableHead>
                                            <TableHead className="font-black uppercase text-[10px] tracking-widest">Статус</TableHead>
                                            <TableHead className="font-black uppercase text-[10px] tracking-widest">Дата</TableHead>
                                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-right">Действия</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.map((user) => (
                                            <TableRow key={user.auth_id} className="hover:bg-muted/50">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="w-10 h-10 rounded-2xl border-2 border-white shadow-sm">
                                                            <AvatarImage src={user.avatar_url || undefined} />
                                                            <AvatarFallback className="rounded-2xl bg-muted text-muted-foreground font-black">
                                                                {user.full_name?.[0] || "?"}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-bold text-foreground">{user.full_name || "Без имени"}</p>
                                                            <p className="text-xs text-muted-foreground font-mono">{user.auth_id.slice(0, 8)}...</p>
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
                                                    <p className="text-xs font-bold text-muted-foreground">
                                                        {new Date(user.created_at).toLocaleDateString("ru-RU")}
                                                    </p>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {user.is_approved && (
                                                            <Button
                                                                size="icon"
                                                                variant="outline"
                                                                onClick={() => handleEditUser(user)}
                                                                className="h-9 w-9 rounded-xl hover:text-primary"
                                                                title="Редактировать профиль"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </Button>
                                                        )}
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
                    <Card className="border-2 border-border rounded-3xl p-6 bg-gradient-to-br from-emerald-50 to-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Одобренные</p>
                                <p className="text-3xl font-black text-foreground">
                                    {users.filter(u => u.is_approved).length}
                                </p>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle className="w-7 h-7 text-emerald-500" />
                            </div>
                        </div>
                    </Card>

                    <Card className="border-2 border-border rounded-3xl p-6 bg-gradient-to-br from-amber-50 to-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Ожидают</p>
                                <p className="text-3xl font-black text-foreground">
                                    {users.filter(u => !u.is_approved).length}
                                </p>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                                <Clock className="w-7 h-7 text-amber-500" />
                            </div>
                        </div>
                    </Card>

                    <Card className="border-2 border-border rounded-3xl p-6 bg-gradient-to-br from-blue-50 to-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Всего</p>
                                <p className="text-3xl font-black text-foreground">
                                    {users.length}
                                </p>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-primary/50/10 flex items-center justify-center">
                                <User className="w-7 h-7 text-blue-500" />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Edit User Modal */}
            <Dialog open={!!editingUser} onOpenChange={(v) => !v && setEditingUser(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Редактирование профиля</DialogTitle>
                    </DialogHeader>
                    {editingUser && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>ФИО</Label>
                                <Input
                                    value={editingUser.full_name}
                                    onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Роль</Label>
                                <Select
                                    value={editingUser.role}
                                    onValueChange={(val) => setEditingUser({ ...editingUser, role: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="student">Ученик</SelectItem>
                                        <SelectItem value="teacher">Учитель</SelectItem>
                                        <SelectItem value="parent">Родитель</SelectItem>
                                        <SelectItem value="admin">Администратор</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {editingUser.role === 'student' && (
                                <div className="space-y-2">
                                    <Label>Класс обучения</Label>
                                    <Select
                                        value={selectedUserClass}
                                        onValueChange={setSelectedUserClass}
                                    >
                                        <SelectTrigger className="rounded-xl border-2 font-bold">
                                            <SelectValue placeholder="Выберите класс..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {classes.map(c => (
                                                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter className="flex flex-row justify-between w-full sm:justify-between items-center mt-6">
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (confirm("Удалить пользователя из системы? (Это действие нельзя отменить)")) {
                                    deleteUserMutation.mutate(editingUser!.auth_id);
                                }
                            }}
                            disabled={deleteUserMutation.isPending}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Удалить
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setEditingUser(null)}>Отмена</Button>
                            <Button
                                onClick={() => updateProfileMutation.mutate({ user: editingUser!, class_id: selectedUserClass })}
                                disabled={updateProfileMutation.isPending}
                            >
                                {updateProfileMutation.isPending ? "Сохранение..." : "Сохранить"}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </SchoolLayout>
    );
}
