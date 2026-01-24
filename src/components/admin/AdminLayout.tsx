import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { LogOut } from "lucide-react";

type Props = {
  title?: string;
  children: ReactNode;
};

export default function AdminLayout({ title, children }: Props) {
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
            <div className="flex h-12 items-center justify-between px-3">
              <div className="flex items-center gap-2">
                {/* CRITICAL: single global trigger in header */}
                <SidebarTrigger />
                {title ? <div className="text-sm font-medium text-foreground">{title}</div> : null}
              </div>

              <Button type="button" variant="outline" size="sm" className="gap-2" onClick={signOut}>
                <LogOut className="h-4 w-4" />
                Выйти
              </Button>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
