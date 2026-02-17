import { useLocation } from "react-router-dom";
import { LayoutDashboard, Images, ShieldCheck, LayoutTemplate, UserCog, Trophy } from "lucide-react";
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

const items = [
  { title: "Дашборд", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Новости", url: "/admin/news", icon: LayoutTemplate }, // Using existing icon or a new one
  { title: "Педагоги", url: "/admin/teachers", icon: UserCog },
  { title: "Доска почета", url: "/admin/honor", icon: Trophy },
  { title: "Сведения", url: "/admin/svedeniya", icon: LayoutTemplate },
  { title: "Секции", url: "/admin/sections", icon: LayoutTemplate },
  { title: "Галерея", url: "/admin/gallery", icon: Images },
  { title: "Медиа", url: "/admin/media", icon: Images },
  { title: "Доступ", url: "/admin/access", icon: ShieldCheck },
  { title: "Роли", url: "/admin/roles", icon: UserCog },
];

export default function AdminSidebar() {
  const { state } = useSidebar();
  const { pathname } = useLocation();
  const collapsed = state === "collapsed";

  const isActive = (url: string) => pathname === url;

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Админка</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild tooltip={item.title} isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end
                      className="w-full"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed ? <span>{item.title}</span> : null}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <div className="mt-auto p-4 border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="На главную" className="w-full text-primary hover:bg-primary/5">
              <NavLink to="/" className="w-full">
                <LayoutDashboard className="h-4 w-4" />
                {!collapsed ? <span className="font-bold uppercase tracking-widest text-[10px]">Вернуться на сайт</span> : null}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </div>
    </Sidebar>
  );
}
