import { useNavigate, useLocation } from "react-router-dom";
import { BookOpen, ClipboardList, Book, User, Menu } from "lucide-react";
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
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border safe-area-pb z-50">
      <div className="flex items-center justify-around h-16 md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path || 
            (item.path !== '/school/profile' && currentPath.startsWith(item.path));
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-slate-600"
              )}
            >
              <Icon className={cn(
                "w-6 h-6 transition-transform",
                isActive && "scale-110"
              )} />
              <span className="text-[10px] font-bold uppercase tracking-wide">
                {item.label}
              </span>
            </button>
          );
        })}
        <div className="flex items-center justify-center w-full h-full">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
