import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

type Row = {
  id: string;
  section_name: string;
  is_visible: boolean;
  updated_at: string;
};

export default function AdminSections() {
  const { data: sections = [] } = useQuery({
    queryKey: ["admin_sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("id, section_name, is_visible, updated_at")
        .order("id", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Admin Sections</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Секции</h1>
        <p className="text-sm text-muted-foreground mt-1">Контент секций из таблицы site_content.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <Card key={s.id} className="p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm text-muted-foreground truncate">{s.id}</div>
                <div className="text-base font-semibold text-foreground truncate">{s.section_name}</div>
              </div>
              <Badge variant={s.is_visible ? "secondary" : "outline"}>{s.is_visible ? "Видима" : "Скрыта"}</Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Обновлено: {format(new Date(s.updated_at), "d MMMM yyyy, HH:mm", { locale: ru })}
            </div>
            <Button asChild size="sm">
              <Link to={`/admin/sections/${s.id}`}>Редактировать</Link>
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
