import { useLocation } from "react-router-dom";
import { LayoutDashboard, Images, ShieldCheck, LayoutTemplate } from "lucide-react";
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
  { title: "Секции", url: "/admin/sections", icon: LayoutTemplate },
  { title: "Медиа", url: "/admin/media", icon: Images },
  { title: "Доступ", url: "/admin/access", icon: ShieldCheck },
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
    </Sidebar>
  );
}
