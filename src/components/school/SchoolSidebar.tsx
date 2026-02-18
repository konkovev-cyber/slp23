import { useLocation } from "react-router-dom";
import {
    BookOpen,
    Calendar,
    Award,
    Users,
    GraduationCap,
    ClipboardList,
    Home,
    Settings,
    UserCheck
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";

export default function SchoolSidebar() {
    const { state } = useSidebar();
    const { pathname } = useLocation();
    const { userId } = useAuth();
    const { role, isLoading } = useRole(userId);
    const collapsed = state === "collapsed";

    const isActive = (url: string) => pathname.startsWith(url);

    const getMenuItems = () => {
        const baseItems = [
            { title: "Вход", url: "/school/login", icon: Home },
        ];

        if (isLoading) return baseItems;

        if (role === 'student') {
            return [
                ...baseItems,
                { title: "Дневник", url: "/school/diary", icon: BookOpen },
                { title: "Домашка", url: "/school/homework-list", icon: ClipboardList },
                { title: "Расписание", url: "/school/schedule", icon: Calendar },
                { title: "Оценки и Табель", url: "/school/grades", icon: Award },
            ];
        }

        if (role === 'teacher') {
            return [
                ...baseItems,
                { title: "Журнал", url: "/school/journal", icon: ClipboardList },
                { title: "Расписание", url: "/school/schedule", icon: Calendar },
                { title: "Домашнее задание", url: "/school/homework", icon: BookOpen },
            ];
        }

        if (role === 'parent') {
            return [
                ...baseItems,
                { title: "Мои дети", url: "/school/children", icon: Users },
                { title: "Успеваемость", url: "/school/grades", icon: Award },
            ];
        }

        if (role === 'admin') {
            return [
                ...baseItems,
                { title: "👥 Одобрение пользователей", url: "/school/admin/users", icon: UserCheck },
                { title: "Классы и Предметы", url: "/school/admin/classes", icon: GraduationCap },
                { title: "Расписание (ред.)", url: "/school/admin/schedule", icon: Calendar },
                { title: "Все оценки", url: "/school/admin/grades", icon: Award },
                { title: "Просмотр дневника", url: "/school/diary", icon: BookOpen },
                { title: "Домашка (ученик)", url: "/school/homework-list", icon: ClipboardList },
                // Enable Teacher tools for Admin
                { title: "Мой Журнал", url: "/school/journal", icon: ClipboardList },
                { title: "Домашнее задание", url: "/school/homework", icon: BookOpen },
            ];
        }

        return baseItems;
    };

    const menuItems = getMenuItems();

    return (
        <Sidebar collapsible="icon" variant="sidebar" className="border-r border-border/50">
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-sidebar-foreground/50">
                        Школьный портал
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {menuItems.map((item) => (
                                <SidebarMenuItem key={item.url}>
                                    <SidebarMenuButton asChild tooltip={item.title} isActive={isActive(item.url)} className="h-11">
                                        <NavLink
                                            to={item.url}
                                            className="w-full flex items-center gap-3 px-3 rounded-lg transition-all"
                                            activeClassName="bg-primary/10 text-primary font-semibold shadow-sm shadow-primary/5"
                                        >
                                            <item.icon className={`h-5 w-5 ${isActive(item.url) ? 'text-primary' : 'text-muted-foreground'}`} />
                                            {!collapsed ? <span>{item.title}</span> : null}
                                        </NavLink>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}
