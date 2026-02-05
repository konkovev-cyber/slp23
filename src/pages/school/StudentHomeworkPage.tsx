import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import SchoolLayout from "@/components/school/SchoolLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, BookOpen, CheckCircle2, Circle, CalendarDays } from "lucide-react";
import { toast } from "sonner";

type HomeworkRow = {
  id: number;
  title: string;
  description: string | null;
  due_date: string;
  teacher_assignment_id: number;
  assignment?: {
    subjects?: { name?: string | null } | null;
  } | null;
};

type HomeworkCompletionRow = {
  homework_id: number;
  user_id: string;
};

type StatusFilter = "active" | "overdue" | "completed" | "all";
type TimeFilter = "today" | "week" | "all";

const startOfDayIso = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
};

const addDaysIso = (d: Date, days: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x.toISOString().slice(0, 10);
};

export default function StudentHomeworkPage() {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);

  const [className, setClassName] = useState<string>("");
  const [homework, setHomework] = useState<HomeworkRow[]>([]);
  const [completionSet, setCompletionSet] = useState<Set<number>>(new Set());

  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("week");

  useEffect(() => {
    if (!userId) return;
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: studentInfo, error: studentInfoError } = await supabase
        .from("students_info")
        .select("class_id, school_classes(name)")
        .eq("student_id", userId)
        .maybeSingle();

      if (studentInfoError) throw studentInfoError;

      if (!studentInfo) {
        setClassName("");
        setHomework([]);
        setCompletionSet(new Set());
        return;
      }

      setClassName(((studentInfo as any).school_classes as any)?.name || "");
      const classId = (studentInfo as any).class_id as number;

      const { data: assignments, error: assignmentsError } = await supabase
        .from("teacher_assignments")
        .select("id")
        .eq("class_id", classId);
      if (assignmentsError) throw assignmentsError;

      const assignmentIds = (assignments || []).map((a: any) => a.id) as number[];
      if (assignmentIds.length === 0) {
        setHomework([]);
        setCompletionSet(new Set());
        return;
      }

      const todayIso = startOfDayIso(new Date());
      const rangeStart = timeFilter === "all" ? "1970-01-01" : todayIso;
      const rangeEnd = timeFilter === "today" ? todayIso : timeFilter === "week" ? addDaysIso(new Date(), 7) : "2999-12-31";

      const { data: hw, error: hwError } = await supabase
        .from("homework")
        .select(
          `id, title, description, due_date, teacher_assignment_id,
           assignment:teacher_assignments(subjects(name))`,
        )
        .in("teacher_assignment_id", assignmentIds)
        .gte("due_date", rangeStart)
        .lte("due_date", rangeEnd)
        .order("due_date", { ascending: true });
      if (hwError) throw hwError;

      const hwRows = (hw as any as HomeworkRow[]) || [];
      setHomework(hwRows);

      // Completion marks for current user (only for loaded homework ids)
      const hwIds = hwRows.map((x) => x.id);
      if (hwIds.length === 0) {
        setCompletionSet(new Set());
        return;
      }

      const { data: completions, error: completionsError } = await supabase
        .from("homework_completions")
        .select("homework_id, user_id")
        .eq("user_id", userId)
        .in("homework_id", hwIds);
      if (completionsError) throw completionsError;

      const set = new Set<number>((completions as any as HomeworkCompletionRow[] | null)?.map((c) => c.homework_id) || []);
      setCompletionSet(set);
    } catch (e: any) {
      toast.error(e?.message || "Ошибка загрузки домашки");
    } finally {
      setLoading(false);
    }
  };

  const subjects = useMemo(() => {
    const set = new Set<string>();
    for (const hw of homework) {
      const name = hw.assignment?.subjects?.name;
      if (name) set.add(name);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ru"));
  }, [homework]);

  const filteredHomework = useMemo(() => {
    const today = startOfDayIso(new Date());

    return homework.filter((hw) => {
      const subjectName = hw.assignment?.subjects?.name || "";
      if (subjectFilter !== "all" && subjectName !== subjectFilter) return false;

      const isCompleted = completionSet.has(hw.id);
      const isOverdue = hw.due_date < today;

      if (statusFilter === "completed") return isCompleted;
      if (statusFilter === "overdue") return !isCompleted && isOverdue;
      if (statusFilter === "active") return !isCompleted && !isOverdue;
      return true;
    });
  }, [completionSet, homework, statusFilter, subjectFilter]);

  const toggleCompletion = async (hwId: number) => {
    if (!userId) return;
    const isCompleted = completionSet.has(hwId);

    try {
      if (isCompleted) {
        const { error } = await supabase
          .from("homework_completions")
          .delete()
          .eq("user_id", userId)
          .eq("homework_id", hwId);
        if (error) throw error;

        setCompletionSet((prev) => {
          const next = new Set(prev);
          next.delete(hwId);
          return next;
        });
      } else {
        const { error } = await supabase
          .from("homework_completions")
          .insert({ user_id: userId, homework_id: hwId });
        if (error) throw error;

        setCompletionSet((prev) => new Set(prev).add(hwId));
      }
    } catch (e: any) {
      toast.error(e?.message || "Не удалось обновить статус");
    }
  };

  return (
    <SchoolLayout title="Домашка">
      <Helmet>
        <title>Домашка | {className || "Школьный портал"}</title>
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-4 pb-20">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Список домашних заданий
                </CardTitle>
                <CardDescription>
                  {className ? `Класс ${className}` : "Если класс не задан — домашка не отображается."}
                </CardDescription>
              </div>
              <Button type="button" variant="outline" onClick={fetchData}>
                Обновить
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Предмет</div>
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Все предметы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все предметы</SelectItem>
                    {subjects.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Статус</div>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Активные</SelectItem>
                    <SelectItem value="completed">Выполненные</SelectItem>
                    <SelectItem value="overdue">Просроченные</SelectItem>
                    <SelectItem value="all">Все</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Срок</div>
                <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Сегодня</SelectItem>
                    <SelectItem value="week">7 дней</SelectItem>
                    <SelectItem value="all">Все</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="button" variant="secondary" onClick={fetchData}>
                Применить
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : !className ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Для отображения домашки нужно привязать ученика к классу.
            </CardContent>
          </Card>
        ) : filteredHomework.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Ничего не найдено по выбранным фильтрам.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredHomework.map((hw) => {
              const isCompleted = completionSet.has(hw.id);
              const isOverdue = hw.due_date < startOfDayIso(new Date());
              const subjectName = hw.assignment?.subjects?.name || "Предмет";

              return (
                <Card key={hw.id}>
                  <CardHeader className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          до {new Date(hw.due_date).toLocaleDateString("ru-RU")}
                        </Badge>
                        <Badge variant="outline">{subjectName}</Badge>
                        {isCompleted ? (
                          <Badge className="gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> выполнено
                          </Badge>
                        ) : isOverdue ? (
                          <Badge variant="destructive">просрочено</Badge>
                        ) : (
                          <Badge variant="secondary">активно</Badge>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant={isCompleted ? "outline" : "default"}
                        onClick={() => toggleCompletion(hw.id)}
                        className="gap-2"
                      >
                        {isCompleted ? (
                          <>
                            <Circle className="h-4 w-4" />
                            Снять отметку
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Отметить выполненным
                          </>
                        )}
                      </Button>
                    </div>
                    <CardTitle>{hw.title}</CardTitle>
                    {hw.description ? <CardDescription className="whitespace-pre-wrap">{hw.description}</CardDescription> : null}
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </SchoolLayout>
  );
}
