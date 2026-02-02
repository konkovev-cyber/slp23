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
            admin: "bg-rose-100/50 text-rose-700 border-rose-200",
            teacher: "bg-blue-100/50 text-blue-700 border-blue-200",
            student: "bg-emerald-100/50 text-emerald-700 border-emerald-200",
            parent: "bg-amber-100/50 text-amber-700 border-amber-200",
            user: "bg-slate-100/50 text-slate-600 border-slate-200"
        };
        return variants[role] || variants.user;
    };

    const getRoleName = (role: string) => {
        const names: Record<string, string> = {
            admin: "Администратор",
            teacher: "Учитель",
            student: "Ученик",
            parent: "Родитель",
            user: "Пользователь"
        };
        return names[role] || role;
    };

    return (
        <SchoolLayout title="База пользователей">
            <Helmet>
                <title>Пользователи | Админ-панель</title>
            </Helmet>

            <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Поиск..."
                            className="pl-10 h-10 rounded-xl border border-slate-100 shadow-sm font-medium text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button className="h-10 rounded-xl gap-2 font-bold px-6 shadow-md bg-slate-900 hover:bg-slate-800 transition-all text-sm">
                        <UserPlus className="w-4 h-4" /> Добавить
                    </Button>
                </div>

                <Card className="border border-slate-100 rounded-[24px] overflow-hidden shadow-sm bg-white hover:shadow-md transition-all">
                    <CardHeader className="p-6 border-b bg-slate-50/30">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-900 shadow-sm">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black">Управление доступом</CardTitle>
                                <CardDescription className="text-xs font-medium text-slate-500">Права и роли пользователей</CardDescription>
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
                                            <TableHead className="py-4 px-6 font-bold text-[10px] uppercase tracking-wider text-slate-400">Пользователь</TableHead>
                                            <TableHead className="py-4 px-6 font-bold text-[10px] uppercase tracking-wider text-slate-400">Роль</TableHead>
                                            <TableHead className="py-4 px-6 font-bold text-[10px] uppercase tracking-wider text-slate-400">Класс</TableHead>
                                            <TableHead className="py-4 px-6 text-right font-bold text-[10px] uppercase tracking-wider text-slate-400">Меню</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredUsers.map((user) => (
                                            <TableRow key={user.id} className="group hover:bg-slate-50/50 border-b border-slate-100 last:border-0 transition-colors">
                                                <TableCell className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="w-10 h-10 border shadow-sm rounded-lg">
                                                            <AvatarImage src={user.avatar_url || ""} />
                                                            <AvatarFallback className="font-bold bg-slate-50 text-slate-400 text-xs">
                                                                {user.full_name?.[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <Link
                                                                to={`/school/profile?id=${user.auth_id}`}
                                                                className="font-bold text-slate-900 text-sm hover:text-primary transition-colors cursor-pointer"
                                                            >
                                                                {user.full_name}
                                                            </Link>
                                                            <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 mt-0.5">
                                                                <Mail className="w-3 h-3" /> {user.auth_id ? `ID: ${user.auth_id.slice(0, 4)}` : 'Inactive'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 px-6">
                                                    <Badge variant="outline" className={`px-3 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider border shadow-none ${getRoleBadge(user.role)}`}>
                                                        {getRoleName(user.role)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-4 px-6">
                                                    {user.role === 'student' ? (
                                                        user.class_name ? <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold rounded-lg px-3 py-1 text-[10px]">{user.class_name}</Badge> : <span className="text-[10px] font-bold uppercase text-rose-400">Не прикреплен</span>
                                                    ) : <span className="text-slate-200">—</span>}
                                                </TableCell>
                                                <TableCell className="py-4 px-6 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all">
                                                                <MoreHorizontal className="w-5 h-5" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-56 rounded-xl border p-1 bg-white shadow-xl">
                                                            <DropdownMenuItem asChild className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-slate-600 hover:text-primary hover:bg-primary/5 cursor-pointer text-sm">
                                                                <Link to={`/school/profile?id=${user.auth_id}`}>
                                                                    <UserIcon className="w-4 h-4" /> Профиль
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            {user.role === 'student' && (
                                                                <DropdownMenuItem asChild className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-slate-600 hover:text-emerald-500 hover:bg-emerald-50 cursor-pointer text-sm">
                                                                    <Link to={`/school/diary?studentId=${user.auth_id}`}>
                                                                        <BookOpen className="w-4 h-4" /> Дневник
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuSeparator className="my-1" />
                                                            {user.role === 'student' && (
                                                                <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-slate-600 hover:text-primary hover:bg-primary/5 cursor-pointer text-sm" onClick={() => { setSelectedUser(user); setIsClassLinkOpen(true); setSelectedId(""); }}>
                                                                    <LinkIcon className="w-4 h-4" /> К классу
                                                                </DropdownMenuItem>
                                                            )}
                                                            {user.role === 'parent' && (
                                                                <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-slate-600 hover:text-blue-500 hover:bg-blue-50 cursor-pointer text-sm" onClick={() => { setSelectedUser(user); setIsChildLinkOpen(true); setSelectedId(""); }}>
                                                                    <Baby className="w-4 h-4" /> Привязать ребенка
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuSeparator className="my-1" />
                                                            <DropdownMenuLabel className="px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">Роль</DropdownMenuLabel>
                                                            {ROLES.map(r => (
                                                                <DropdownMenuItem key={r.value} className="flex items-center justify-between px-3 py-2 rounded-lg font-medium text-slate-700 hover:bg-slate-50 cursor-pointer text-sm" onClick={() => handleUpdateRole(user.auth_id, r.value)}>
                                                                    <div className="flex items-center gap-2"><r.icon className="w-4 h-4" /> {r.label}</div>
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
                <DialogContent className="rounded-[24px] p-6 max-w-sm bg-white shadow-xl border">
                    <DialogHeader><DialogTitle className="text-xl font-black">Класс</DialogTitle></DialogHeader>
                    <div className="py-4">
                        <Select value={selectedId} onValueChange={setSelectedId}>
                            <SelectTrigger className="h-10 rounded-xl border font-bold text-sm"><SelectValue placeholder="Выберите класс..." /></SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {classes.map(c => <SelectItem key={c.id} value={c.id.toString()} className="h-10 font-bold rounded-lg text-sm">{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter><Button onClick={handleLinkToClass} className="w-full h-11 rounded-xl bg-slate-900 text-white font-bold text-base shadow-lg">Подтвердить</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isChildLinkOpen} onOpenChange={setIsChildLinkOpen}>
                <DialogContent className="rounded-[24px] p-6 max-w-sm bg-white shadow-xl border">
                    <DialogHeader><DialogTitle className="text-xl font-black">Связь</DialogTitle></DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label className="font-bold text-[10px] uppercase tracking-wider text-slate-400 pl-1">Выберите своего ребенка</Label>
                        <Select value={selectedId} onValueChange={setSelectedId}>
                            <SelectTrigger className="h-10 rounded-xl border font-bold text-sm"><SelectValue placeholder="Ученик..." /></SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {users.filter(u => u.role === 'student').map(u => <SelectItem key={u.auth_id} value={u.auth_id || ""} className="h-10 font-bold rounded-lg text-sm">{u.full_name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter><Button onClick={handleLinkChild} className="w-full h-11 rounded-xl bg-blue-600 text-white font-bold text-base shadow-lg shadow-blue-200">Привязать</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </SchoolLayout>
    );
}
