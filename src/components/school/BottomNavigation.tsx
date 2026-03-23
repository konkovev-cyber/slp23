import { useNavigate, useLocation } from "react-router-dom";
import { BookOpen, ClipboardList, Book, User } from "lucide-react";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";

interface BottomNavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  roles?: ('student' | 'teacher' | 'parent' | 'admin')[];
}

interface BottomNavigationProps {
  role?: 'student' | 'teacher' | 'parent' | 'admin';
}

const studentNavItems: BottomNavItem[] = [
  { path: '/school/diary', label: 'Дневник', icon: BookOpen },
  { path: '/school/schedule', label: 'Расписание', icon: ClipboardList },
  { path: '/school/homework-list', label: 'Домашка', icon: Book },
  { path: '/school/profile', label: 'Профиль', icon: User },
];

const teacherNavItems: BottomNavItem[] = [
  { path: '/school/journal', label: 'Журнал', icon: BookOpen },
  { path: '/school/homework', label: 'Домашка', icon: Book },
  { path: '/school/schedule', label: 'Расписание', icon: ClipboardList },
  { path: '/school/profile', label: 'Профиль', icon: User },
];

const parentNavItems: BottomNavItem[] = [
  { path: '/school/children', label: 'Дети', icon: User },
  { path: '/school/grades', label: 'Оценки', icon: ClipboardList },
  { path: '/school/homework-list', label: 'Домашка', icon: Book },
  { path: '/school/profile', label: 'Профиль', icon: User },
];

export function BottomNavigation({ role = 'student' }: BottomNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const getNavItems = () => {
    switch (role) {
      case 'teacher':
        return teacherNavItems;
      case 'parent':
        return parentNavItems;
      default:
        return studentNavItems;
    }
  };

  const navItems = getNavItems();
  const currentPath = location.pathname;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 dark:bg-background/40 backdrop-blur-xl border-t border-border/50 safe-area-pb transition-all duration-300 md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path ||
            (item.path !== '/school/profile' && currentPath.startsWith(item.path));

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "relative flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-300",
                isActive ? "text-primary" : "text-muted-foreground/80 hover:text-primary/70",
                "active:scale-90"
              )}
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-primary rounded-full animate-in fade-in zoom-in duration-500" />
              )}
              <div className={cn(
                "p-1.5 rounded-xl transition-all duration-300",
                isActive && "bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.1)]"
              )}>
                <Icon className={cn(
                  "w-5 h-5 transition-all duration-300",
                  isActive ? "stroke-[2.5px]" : "stroke-[2px]"
                )} />
              </div>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-[0.1em] transition-all duration-300",
                isActive ? "opacity-100" : "opacity-60"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
        <div className="flex items-center justify-center flex-shrink-0 px-2 border-l border-border/30 h-8 my-auto">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
