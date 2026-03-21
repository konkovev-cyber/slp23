import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Newspaper,
  Users,
  Images,
  Settings,
  ArrowRight,
  PlusCircle,
  Activity,
  UserPlus,
  BookOpen,
  Trophy
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function AdminDashboard() {
  // Fetch some stats for the dashboard
    const { data: stats } = useQuery({
    queryKey: ["admin_stats"],
    queryFn: async () => {
      const { count: postsCount } = await supabase.from("posts" as any).select("*", { count: 'exact', head: true });
      const { count: teachersCount } = await supabase.from("teachers" as any).select("*", { count: 'exact', head: true });
      const { count: honorCount } = await supabase.from("honor_board" as any).select("*", { count: 'exact', head: true });
      
      // School stats
      const { count: sysTeachersCount } = await supabase.from("profiles").select("*", { count: 'exact', head: true }).eq("role", "teacher");
      const { count: studentsCount } = await supabase.from("profiles").select("*", { count: 'exact', head: true }).eq("role", "student");
      const { count: classesCount } = await supabase.from("school_classes").select("*", { count: 'exact', head: true });
      const { count: lessonsCount } = await supabase.from("schedule").select("*", { count: 'exact', head: true });
      
      const { data: gradesData } = await supabase.from("grades").select("grade");
      let avg = "Н/Д";
      if (gradesData && gradesData.length > 0) {
        const numbers = gradesData.map(g => parseInt(g.grade)).filter(n => !isNaN(n));
        if (numbers.length > 0) {
            avg = (numbers.reduce((a, b) => a + b, 0) / numbers.length).toFixed(2);
        }
      }

      return {
        posts: postsCount || 0,
        teachers: teachersCount || 0,
        honor: honorCount || 0,
        sysTeachers: sysTeachersCount || 0,
        students: studentsCount || 0,
        classes: classesCount || 0,
        lessons: lessonsCount || 0,
        avgGrade: avg,
      };
    },
  });

  const cards = [
    {
      title: "Новости",
      description: "Управление новостями, событиями и импорт из VK/Telegram.",
      count: stats?.posts,
      icon: Newspaper,
      href: "/admin/news",
      addIcon: PlusCircle,
      addHref: "/admin/news",
      color: "blue",
    },
    {
      title: "Педагоги",
      description: "Список сотрудников, их должности и фотографии.",
      count: stats?.teachers,
      icon: Users,
      href: "/admin/teachers",
      addIcon: UserPlus,
      addHref: "/admin/teachers",
      color: "green",
    },
    {
      title: "Доска почета",
      description: "Список выдающихся учеников и их достижений.",
      count: stats?.honor,
      icon: Trophy,
      href: "/admin/honor",
      addIcon: PlusCircle,
      addHref: "/admin/honor",
      color: "yellow",
    },
    {
      title: "Медиа-библиотека",
      description: "Управление изображениями и файлами во всех разделах сайта.",
      count: "Storage",
      icon: Images,
      href: "/admin/media",
      color: "purple",
    },
    {
      title: "Контент страниц",
      description: "Редактирование текстов и настроек в различных секциях сайта.",
      count: "Live",
      icon: Settings,
      href: "/admin/sections",
      color: "orange",
    },
    {
      title: "Школьный журнал",
      description: "Управление классами, расписанием и оценками учеников.",
      count: "School",
      icon: BookOpen,
      href: "/school/",
      color: "indigo",
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <Helmet>
        <title>Панель управления</title>
      </Helmet>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-primary" />
            Дашборд
          </h1>
          <p className="text-muted-foreground mt-2">
            Отличный день для управления школой. Вот краткая сводка на сегодня:
          </p>
        </div>
      </div>

      {/* School Stats Grid */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="bg-blue-500/5 border-blue-500/20 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
              <Users className="w-4 h-4" /> Ученики
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-950">{stats?.students ?? <Activity className="w-5 h-5 animate-spin"/>}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-emerald-500/5 border-emerald-500/20 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Педагоги
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-950">{stats?.sysTeachers ?? <Activity className="w-5 h-5 animate-spin"/>}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-purple-500/5 border-purple-500/20 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-purple-600 flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Классы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-950">{stats?.classes ?? <Activity className="w-5 h-5 animate-spin"/>}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-orange-500/5 border-orange-500/20 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-orange-600 flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" /> Уроки в сетке
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-950">{stats?.lessons ?? <Activity className="w-5 h-5 animate-spin"/>}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-rose-500/5 border-rose-500/20 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-rose-600 flex items-center gap-2">
              <Trophy className="w-4 h-4" /> Средний балл
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-950">{stats?.avgGrade ?? <Activity className="w-5 h-5 animate-spin"/>}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title} className="group relative overflow-hidden border-border/50 hover:shadow-xl hover:border-primary/20 transition-all duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <card.icon className="w-16 h-16" />
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg bg-${card.color}-500/10 text-${card.color}-600`}>
                  <card.icon className="w-5 h-5" />
                </div>
                {typeof card.count === 'number' || typeof card.count === 'string' ? (
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-muted">
                    {card.count}
                  </span>
                ) : (
                  <Activity className="w-3 h-3 text-muted-foreground animate-pulse" />
                )}
              </div>
              <CardTitle className="text-xl group-hover:text-primary transition-colors">{card.title}</CardTitle>
              <CardDescription className="line-clamp-2 min-h-[40px]">{card.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex items-center gap-2">
              <Button asChild variant="default" size="sm" className="flex-1 gap-2 shadow-sm">
                <Link to={card.href}>
                  Открыть <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
              {card.addHref && (
                <Button asChild variant="outline" size="icon" className="h-9 w-9 shrink-0 hover:border-primary/50" title="Добавить">
                  <Link to={card.addHref}>
                    <card.addIcon className="w-4 h-4" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 p-6 bg-primary/[0.02] border-dashed border-2">
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
            <div className="p-3 bg-background rounded-full shadow-sm">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">Нужна помощь?</h3>
              <p className="text-muted-foreground max-w-sm">
                Все инструкции по наполнению сайта и работе с медиа-хранилищем находятся в разделе инструкций.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/admin/instructions">Инструкции</Link>
            </Button>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-primary" />
            Быстрые ссылки
          </h3>
          <div className="space-y-2">
            {[
              { label: "👥 Одобрить пользователей", href: "/school/admin/users" },
              { label: "Редактор Hero", href: "/admin/sections/hero" },
              { label: "Вернуться на сайт", href: "/" },
              { label: "Настройка доступа", href: "/admin/access" },
              { label: "Выйти", href: "/", isDanger: true }
            ].map((item) => (
              <Button key={item.label} variant="ghost" asChild className={`w-full justify-start text-sm h-9 ${item.isDanger ? 'text-destructive hover:text-destructive hover:bg-destructive/5' : ''}`}>
                <Link to={item.href}>{item.label}</Link>
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
