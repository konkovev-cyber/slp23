import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import SchoolSidebar from "@/components/school/SchoolSidebar";
import { BottomNavigation } from "@/components/school/BottomNavigation";
import { LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";
import ThemeToggle from "@/components/ThemeToggle";
import PageTransition from "@/components/PageTransition";

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
            <div className="min-h-screen flex w-full bg-background/95 dark:bg-background">
                <SchoolSidebar />
                <SidebarInset className="bg-transparent w-full overflow-x-hidden flex flex-col">
                    <header className="sticky top-0 z-40 border-b border-border/30 bg-background/60 dark:bg-background/40 backdrop-blur-xl safe-area-pt">
                        <div className="flex h-16 items-center justify-between px-4 md:px-6 w-full">
                            <div className="flex items-center gap-3 md:gap-4">
                                <SidebarTrigger className="hover:bg-primary/5 transition-colors md:flex hidden" />
                                <div className="h-6 w-px bg-border/40 hidden md:block" />
                                <div className="flex flex-col">
                                    {title && <h1 className="text-sm font-black text-foreground tracking-tight leading-none uppercase">{title}</h1>}
                                    <span className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.15em] mt-1.5 flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                        Портал • {role || 'Пользователь'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 md:gap-3">
                                <div className="hidden sm:flex items-center gap-2">
                                    <ThemeToggle />
                                </div>
                                <Button asChild variant="ghost" size="icon" className="rounded-2xl h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/5 border border-transparent hover:border-primary/10 transition-all md:flex hidden shadow-sm">
                                    <Link to="/school/profile">
                                        <User className="h-5 w-5" />
                                    </Link>
                                </Button>
                                <div className="h-8 w-px bg-border/40 hidden md:block" />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="gap-2 rounded-2xl text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-all font-bold group"
                                    onClick={signOut}
                                >
                                    <LogOut className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                                    <span className="hidden sm:inline uppercase text-[10px] tracking-widest">Выйти</span>
                                </Button>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 p-4 md:p-6 lg:p-10 pb-32 md:pb-10 w-full overflow-x-hidden">
                        <PageTransition>
                            <div className="max-w-[1400px] mx-auto w-full animate-in fade-in slide-in-from-bottom-6 duration-1000 ease-out">
                                {children}
                            </div>
                        </PageTransition>
                        <footer className="mt-10 md:mt-20 pb-10 text-center hidden md:block border-t border-border/20 pt-10">
                            <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.4em]">
                                Личность ПЛЮС • Электронный дневник • 2026
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
