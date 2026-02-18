import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import SchoolSidebar from "@/components/school/SchoolSidebar";
import { BottomNavigation } from "@/components/school/BottomNavigation";
import { LogOut, GraduationCap, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";

type Props = {
    title?: string;
    children: ReactNode;
};

export default function SchoolLayout({ title, children }: Props) {
    const navigate = useNavigate();
    const { userId } = useAuth();
    const { role } = useRole(userId);

    const signOut = async () => {
        await supabase.auth.signOut();
        navigate("/school/login", { replace: true });
    };

    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full bg-[#FAFBFF]">
                <SchoolSidebar />
                <SidebarInset className="bg-transparent">
                    <header className="sticky top-0 z-40 border-b border-border/40 bg-white/80 backdrop-blur-md">
                        <div className="flex h-16 items-center justify-between px-4 md:px-6">
                            <div className="flex items-center gap-3 md:gap-4">
                                <SidebarTrigger className="hover:bg-primary/5 transition-colors md:flex hidden" />
                                <div className="h-6 w-px bg-border/40 hidden md:block" />
                                <div className="flex flex-col">
                                    {title && <h1 className="text-sm font-bold text-slate-900 leading-none">{title}</h1>}
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                                        <GraduationCap className="h-3 w-3" />
                                        Электронный портал • {role || 'Пользователь'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 md:gap-3">
                                <Button asChild variant="ghost" size="icon" className="rounded-full h-10 w-10 text-slate-500 hover:text-primary hover:bg-primary/5 border border-transparent hover:border-primary/10 transition-all md:flex hidden">
                                    <Link to="/school/profile">
                                        <User className="h-5 w-5" />
                                    </Link>
                                </Button>
                                <div className="h-8 w-px bg-border/40 hidden md:block" />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="gap-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all font-semibold"
                                    onClick={signOut}
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span className="hidden sm:inline">Выйти</span>
                                </Button>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 p-4 md:p-6 lg:p-10 pb-24 md:pb-6">
                        <div className="max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {children}
                        </div>
                        <footer className="mt-10 md:mt-20 pb-6 text-center hidden md:block">
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">
                                Личность ПЛЮС • Электронный дневник
                            </p>
                        </footer>
                    </main>

                    {/* Bottom Navigation for Mobile */}
                    <BottomNavigation role={role as 'student' | 'teacher' | 'parent' | 'admin'} />
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
