import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Search,
    UserPlus,
    Filter,
    ShieldCheck,
    Mail,
    Loader2,
    MoreHorizontal,
    UserCog,
    GraduationCap,
    Users,
    Shield,
    Check,
    LinkIcon,
    Baby,
    BookOpen,
    User as UserIcon
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import SchoolLayout from "@/components/school/SchoolLayout";
import { toast } from "sonner";

type UserProfile = {
    id: string;
    auth_id: string | null;
    full_name: string;
    avatar_url: string | null;
    email?: string;
    role: string;
    class_name?: string;
};

const ROLES = [
    { value: "admin", label: "Администратор", icon: Shield },
    { value: "teacher", label: "Учитель", icon: GraduationCap },
    { value: "student", label: "Ученик", icon: Users },
    { value: "parent", label: "Родитель", icon: Users },
    { value: "user", label: "Пользователь", icon: UserCog },
];

export default function AdminUsersPage() {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    // Link states
    const [isClassLinkOpen, setIsClassLinkOpen] = useState(false);
    const [isChildLinkOpen, setIsChildLinkOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [selectedId, setSelectedId] = useState<string>("");

    useEffect(() => {
        fetchUsers();
        fetchMetadata();
    }, []);

    const fetchMetadata = async () => {
        const { data } = await supabase.from("school_classes").select("*").order("name");
        setClasses(data || []);
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data: profiles, error: profileError } = await supabase.from("profiles").select("*");
            if (profileError) throw profileError;

            const { data: roles, error: rolesError } = await supabase.from("user_roles").select("user_id, role");
            if (rolesError) throw rolesError;

            const { data: students, error: studentError } = await supabase
                .from("students_info")
                .select("student_id, school_classes(name)");
            if (studentError) throw studentError;

            const combined: UserProfile[] = (profiles || []).map(p => {
                const userRole = roles?.find(r => r.user_id === p.auth_id)?.role || "user";
                const studentInfo = students?.find(s => s.student_id === p.auth_id);
                return {
                    ...p,
                    role: userRole,
                    class_name: (studentInfo?.school_classes as any)?.name
                };
            });

            setUsers(combined);
        } catch (error: any) {
            toast.error("Ошибка загрузки пользователей: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRole = async (authId: string | null, newRole: string) => {
        if (!authId) return;
        try {
            setUpdatingId(authId);
            const { error } = await supabase
                .from("user_roles")
                .upsert({ user_id: authId, role: newRole as any }, { onConflict: 'user_id' });
            if (error) throw error;
            toast.success("Роль успешно обновлена");
            fetchUsers();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleLinkToClass = async () => {
        if (!selectedUser?.auth_id || !selectedId) return;
        try {
            const { error } = await supabase
                .from("students_info")
                .upsert({ student_id: selectedUser.auth_id, class_id: parseInt(selectedId) }, { onConflict: 'student_id' });
            if (error) throw error;
            toast.success(`Ученик ${selectedUser.full_name} прикреплен к классу`);
            setIsClassLinkOpen(false);
            fetchUsers();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleLinkChild = async () => {
        if (!selectedUser?.auth_id || !selectedId) return;
        try {
            const { error } = await supabase
                .from("parents_children")
                .insert({ parent_id: selectedUser.auth_id, child_id: selectedId });
            if (error) throw error;
            toast.success("Связь Родитель-Ребенок создана");
            setIsChildLinkOpen(false);
            fetchUsers();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getRoleBadge = (role: string) => {
        const variants: Record<string, string> = {
            admin: "bg-rose-100 text-rose-600 border-rose-200 shadow-rose-100",
            teacher: "bg-blue-100 text-blue-600 border-blue-200 shadow-blue-100",
            student: "bg-emerald-100 text-emerald-600 border-emerald-200 shadow-emerald-100",
            parent: "bg-amber-100 text-amber-600 border-amber-200 shadow-amber-100",
            user: "bg-slate-100 text-slate-600 border-slate-200 shadow-slate-100"
        };
        return variants[role] || variants.user;
    };

    return (
        <SchoolLayout title="База пользователей">
            <Helmet>
                <title>Пользователи | Админ-панель</title>
            </Helmet>

            <div className="space-y-8">
                <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                            placeholder="Поиск по имени..."
                            className="pl-12 h-14 rounded-2xl border-2 border-slate-100 shadow-xl shadow-slate-100/30"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button className="h-14 rounded-2xl gap-2 font-black px-8 shadow-xl shadow-primary/20 bg-slate-900 hover:bg-slate-800 transition-all">
                        <UserPlus className="w-5 h-5" /> Добавить
                    </Button>
                </div>

                <Card className="border-2 border-slate-100 rounded-[40px] overflow-hidden shadow-2xl bg-white">
                    <CardHeader className="p-10 border-b bg-slate-50/50">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-3xl bg-white border-2 border-slate-100 flex items-center justify-center text-slate-900 shadow-sm">
                                <ShieldCheck className="w-8 h-8" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-black">Управление доступом</CardTitle>
                                <CardDescription className="font-bold text-slate-500">Права пользователей и привязки к ролям</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="py-24 flex flex-col items-center justify-center gap-4 text-slate-300">
                                <Loader2 className="animate-spin w-12 h-12 text-primary" />
                                <span className="font-black uppercase tracking-[0.2em] text-[10px]">Подключение к базе...</span>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/30">
                                            <TableHead className="py-6 px-10 font-black text-[11px] uppercase tracking-widest text-slate-400">Пользователь</TableHead>
                                            <TableHead className="py-6 px-10 font-black text-[11px] uppercase tracking-widest text-slate-400">Роль</TableHead>
                                            <TableHead className="py-6 px-10 font-black text-[11px] uppercase tracking-widest text-slate-400">Класс</TableHead>
                                            <TableHead className="py-6 px-10 text-right font-black text-[11px] uppercase tracking-widest text-slate-400 text-right">Меню</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredUsers.map((user) => (
                                            <TableRow key={user.id} className="group hover:bg-primary/[0.02] border-b border-slate-50 last:border-0 transition-colors">
                                                <TableCell className="py-8 px-10">
                                                    <div className="flex items-center gap-4">
                                                        <Avatar className="w-14 h-14 border-4 border-white shadow-lg rounded-2xl">
                                                            <AvatarImage src={user.avatar_url || ""} />
                                                            <AvatarFallback className="font-black bg-slate-100 text-slate-400">
                                                                {user.full_name?.[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <Link
                                                                to={`/school/profile?id=${user.auth_id}`}
                                                                className="font-black text-slate-900 text-lg hover:text-primary transition-colors cursor-pointer"
                                                            >
                                                                {user.full_name}
                                                            </Link>
                                                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-widest mt-0.5">
                                                                <Mail className="w-3 h-3" /> {user.auth_id ? `Active: ${user.auth_id.slice(0, 4)}...` : 'Inactive'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-8 px-10">
                                                    <Badge variant="outline" className={`px-5 py-2 rounded-2xl font-black text-[10px] uppercase tracking-[0.1em] border-2 shadow-sm ${getRoleBadge(user.role)}`}>
                                                        {user.role}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-8 px-10">
                                                    {user.role === 'student' ? (
                                                        user.class_name ? <Badge className="bg-emerald-50 text-emerald-600 border-2 border-emerald-100 font-black rounded-xl px-4 py-1.5">{user.class_name}</Badge> : <span className="text-[10px] font-black uppercase text-rose-400">Не прикреплен</span>
                                                    ) : <span className="text-slate-200">—</span>}
                                                </TableCell>
                                                <TableCell className="py-8 px-10 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-12 w-12 p-0 rounded-2xl hover:bg-slate-100 text-slate-300 hover:text-slate-900 transition-all shadow-inner">
                                                                <MoreHorizontal className="w-6 h-6" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-64 rounded-3xl border-2 p-3 shadow-2xl bg-white">
                                                            <DropdownMenuItem asChild className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-600 hover:text-primary hover:bg-primary/5 cursor-pointer">
                                                                <Link to={`/school/profile?id=${user.auth_id}`}>
                                                                    <UserIcon className="w-4 h-4" /> Перейти в профиль
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            {user.role === 'student' && (
                                                                <DropdownMenuItem asChild className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-600 hover:text-emerald-500 hover:bg-emerald-50 cursor-pointer">
                                                                    <Link to={`/school/diary?studentId=${user.auth_id}`}>
                                                                        <BookOpen className="w-4 h-4" /> Посмотреть дневник
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuSeparator className="my-2 bg-slate-50" />
                                                            {user.role === 'student' && (
                                                                <DropdownMenuItem className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-600 hover:text-primary hover:bg-primary/5 cursor-pointer" onClick={() => { setSelectedUser(user); setIsClassLinkOpen(true); setSelectedId(""); }}>
                                                                    <LinkIcon className="w-4 h-4" /> Прикрепить к классу
                                                                </DropdownMenuItem>
                                                            )}
                                                            {user.role === 'parent' && (
                                                                <DropdownMenuItem className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-600 hover:text-blue-500 hover:bg-blue-50 cursor-pointer" onClick={() => { setSelectedUser(user); setIsChildLinkOpen(true); setSelectedId(""); }}>
                                                                    <Baby className="w-4 h-4" /> Привязать ребенка
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuSeparator className="my-2 bg-slate-50" />
                                                            <DropdownMenuLabel className="px-4 py-1 text-[10px] font-black uppercase tracking-widest text-slate-300">Сменить роль</DropdownMenuLabel>
                                                            {ROLES.map(r => (
                                                                <DropdownMenuItem key={r.value} className="flex items-center justify-between px-4 py-3 rounded-xl font-bold text-slate-700 hover:bg-slate-50 cursor-pointer" onClick={() => handleUpdateRole(user.auth_id, r.value)}>
                                                                    <div className="flex items-center gap-3"><r.icon className="w-4 h-4" /> {r.label}</div>
                                                                    {user.role === r.value && <Check className="w-4 h-4 text-emerald-500" />}
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Dialogs */}
            <Dialog open={isClassLinkOpen} onOpenChange={setIsClassLinkOpen}>
                <DialogContent className="rounded-[40px] p-10 max-w-sm">
                    <DialogHeader><DialogTitle className="text-3xl font-black">Класс</DialogTitle></DialogHeader>
                    <div className="py-6">
                        <Select value={selectedId} onValueChange={setSelectedId}>
                            <SelectTrigger className="h-16 rounded-2xl border-2 font-black"><SelectValue placeholder="Выберите класс..." /></SelectTrigger>
                            <SelectContent className="rounded-2xl">
                                {classes.map(c => <SelectItem key={c.id} value={c.id.toString()} className="h-12 font-bold rounded-xl">{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter><Button onClick={handleLinkToClass} className="w-full h-16 rounded-3xl bg-primary text-white font-black text-xl shadow-xl shadow-primary/20">Подтвердить</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isChildLinkOpen} onOpenChange={setIsChildLinkOpen}>
                <DialogContent className="rounded-[40px] p-10 max-w-sm">
                    <DialogHeader><DialogTitle className="text-3xl font-black">Связь</DialogTitle></DialogHeader>
                    <div className="py-6 space-y-2">
                        <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 pl-1">Выберите своего ребенка</Label>
                        <Select value={selectedId} onValueChange={setSelectedId}>
                            <SelectTrigger className="h-16 rounded-2xl border-2 font-black"><SelectValue placeholder="Ученик..." /></SelectTrigger>
                            <SelectContent className="rounded-2xl">
                                {users.filter(u => u.role === 'student').map(u => <SelectItem key={u.auth_id} value={u.auth_id || ""} className="h-12 font-bold rounded-xl">{u.full_name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter><Button onClick={handleLinkChild} className="w-full h-16 rounded-3xl bg-blue-500 text-white font-black text-xl shadow-xl shadow-blue-200">Привязать</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </SchoolLayout>
    );
}
