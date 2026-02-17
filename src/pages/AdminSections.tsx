import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Plus, Trash2, Settings, Construction } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";

type Row = {
  id: string;
  section_name: string;
  is_visible: boolean;
  updated_at: string;
  content: any;
};

export default function AdminSections() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [newSectionId, setNewSectionId] = useState("");
  const [newSectionName, setNewSectionName] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ["admin_sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("id, section_name, is_visible, updated_at, content")
        .order("id", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!newSectionId || !newSectionName) throw new Error("ID и название обязательны");
      const { error } = await supabase.from("site_content").insert({
        id: newSectionId.trim().toLowerCase(),
        section_name: newSectionName.trim(),
        is_visible: true,
        content: {},
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_sections"] });
      qc.invalidateQueries({ queryKey: ["site_content"] });
      setIsOpen(false);
      setNewSectionId("");
      setNewSectionName("");
      toast({ title: "Секция создана" });
    },
    onError: (e: any) => {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("site_content").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_sections"] });
      qc.invalidateQueries({ queryKey: ["site_content"] });
      toast({ title: "Секция удалена" });
    },
    onError: (e: any) => {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    },
  });

  const updateVisibleMutation = useMutation({
    mutationFn: async ({ id, is_visible }: { id: string; is_visible: boolean }) => {
      const { error } = await supabase.from("site_content").update({ is_visible }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_sections"] });
      qc.invalidateQueries({ queryKey: ["site_content"] });
    },
  });

  const settingsSection = sections.find(s => s.id === 'settings');
  const isMaintenanceMode = settingsSection?.content?.maintenance_mode ?? false;

  const toggleMaintenanceMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { data: existing } = await supabase.from("site_content").select("*").eq("id", "settings").maybeSingle();

      const content = existing ? { ...((existing.content as object) || {}), maintenance_mode: enabled } : { maintenance_mode: enabled };

      const { error } = await supabase.from("site_content").upsert({
        id: "settings",
        section_name: "Настройки сайта",
        is_visible: true,
        content
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_sections"] });
      qc.invalidateQueries({ queryKey: ["site_content"] });
      toast({ title: "Настройки сохранены" });
    },
  });

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Управление секциями</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Секции</h1>
          <p className="text-sm text-muted-foreground mt-1">Управление контентом и видимостью блоков на сайте.</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Добавить секцию
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новая секция</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="id">ID (английскими буквами, например 'hero')</Label>
                <Input
                  id="id"
                  value={newSectionId}
                  onChange={(e) => setNewSectionId(e.target.value)}
                  placeholder="hero-v2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Название (для админки)</Label>
                <Input
                  id="name"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  placeholder="Главный блок (новый)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Отмена</Button>
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                Создать
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-5 border-yellow-500/50 bg-yellow-500/5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Construction className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <div className="font-bold text-foreground">Режим «Сайт на ремонте»</div>
              <div className="text-xs text-muted-foreground">Если включено, обычные пользователи увидят заглушку.</div>
            </div>
          </div>
          <Switch
            checked={isMaintenanceMode}
            onCheckedChange={(val) => toggleMaintenanceMutation.mutate(val)}
            disabled={toggleMaintenanceMutation.isPending}
          />
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sections.filter(s => s.id !== 'settings').map((s) => (
          <Card key={s.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">{s.id}</div>
                  <div className="text-base font-bold text-foreground truncate">{s.section_name}</div>
                </div>
                <Switch
                  checked={s.is_visible}
                  onCheckedChange={(val) => updateVisibleMutation.mutate({ id: s.id, is_visible: val })}
                />
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={s.is_visible ? "secondary" : "outline"} className="text-[10px]">
                  {s.is_visible ? "Видима" : "Скрыта"}
                </Badge>
                <div className="text-[10px] text-muted-foreground">
                  {s.updated_at ? format(new Date(s.updated_at), "d MMM, HH:mm", { locale: ru }) : "—"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-5">
              <Button asChild size="sm" variant="secondary" className="flex-1 h-8 text-xs font-bold">
                <Link to={`/admin/sections/${s.id}`}>Редактировать</Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-white hover:bg-destructive"
                onClick={() => {
                  if (confirm(`Удалить секцию "${s.section_name}"?`)) {
                    deleteMutation.mutate(s.id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
