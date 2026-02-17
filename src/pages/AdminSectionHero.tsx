import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import ImageUploader, { type ImageValue } from "@/components/admin/ImageUploader";

type HeroContent = {
  badge_text?: string;
  heading_prefix?: string;
  heading_highlight?: string;
  lead?: string;
  bullets?: string[];
  phone_label?: string;
  phone?: string;
  primary_cta?: { text?: string; action?: string; target?: string };
  secondary_cta?: { text?: string; action?: string; target?: string };
  background_image?: any;
  scroll_indicator?: boolean;
};

export default function AdminSectionHero() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { id } = useParams();
  const sectionId = id ?? "hero";

  const isHero = sectionId === "hero";
  const isSettings = sectionId === "settings";

  const { data, isLoading } = useQuery({
    queryKey: ["admin_section", sectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("id, section_name, is_visible, content")
        .eq("id", sectionId)
        .single();
      if (error) throw error;
      return data as { id: string; section_name: string; is_visible: boolean; content: any };
    },
  });

  const initial = useMemo(() => data?.content ?? {}, [data]);

  const [isVisible, setIsVisible] = useState(true);
  const [sectionName, setSectionName] = useState("");
  const [badgeText, setBadgeText] = useState("");
  const [headingPrefix, setHeadingPrefix] = useState("");
  const [headingHighlight, setHeadingHighlight] = useState("");
  const [lead, setLead] = useState("");
  const [bulletsText, setBulletsText] = useState("");
  const [phoneLabel, setPhoneLabel] = useState("");
  const [phone, setPhone] = useState("");
  const [primaryCtaText, setPrimaryCtaText] = useState("");
  const [primaryCtaTarget, setPrimaryCtaTarget] = useState("#contacts");
  const [secondaryCtaText, setSecondaryCtaText] = useState("");
  const [secondaryCtaTarget, setSecondaryCtaTarget] = useState("#programs");
  const [scrollIndicator, setScrollIndicator] = useState(true);
  const [bgImage, setBgImage] = useState<ImageValue>(null);

  // Settings specific
  const [rawContent, setRawContent] = useState("{}");

  // Settings specific
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    if (!data) return;
    setIsVisible(data.is_visible);
    setSectionName(data.section_name);

    if (isHero) {
      // ... existing hero mapping ...
      setBadgeText(initial.badge_text ?? "");
      setHeadingPrefix(initial.heading_prefix ?? "");
      setHeadingHighlight(initial.heading_highlight ?? "");
      setLead(initial.lead ?? "");
      setBulletsText((initial.bullets ?? []).join("\n"));
      setPhoneLabel(initial.phone_label ?? "");
      setPhone(initial.phone ?? "");
      setPrimaryCtaText(initial.primary_cta?.text ?? "");
      setPrimaryCtaTarget(initial.primary_cta?.target ?? "#contacts");
      setSecondaryCtaText(initial.secondary_cta?.text ?? "");
      setSecondaryCtaTarget(initial.secondary_cta?.target ?? "#programs");
      setScrollIndicator(!!initial.scroll_indicator);

      const bi: any = initial.background_image;
      if (bi && (bi.publicUrl || bi.public_url) && (bi.path || bi.storage_path)) {
        setBgImage({
          bucket: (bi.bucket ?? "images") as any,
          path: (bi.path ?? bi.storage_path) as string,
          publicUrl: (bi.publicUrl ?? bi.public_url) as string,
          alt: bi.alt,
        });
      } else {
        setBgImage(null);
      }
    } else if (isSettings) {
      setMaintenanceMode(!!initial.maintenance_mode);
    } else {
      setRawContent(JSON.stringify(initial, null, 2));
    }
  }, [data, initial, isHero, isSettings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      let content = { ...initial };

      if (isHero) {
        const bullets = bulletsText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);

        content = {
          ...content,
          badge_text: badgeText,
          heading_prefix: headingPrefix,
          heading_highlight: headingHighlight,
          lead,
          bullets,
          phone_label: phoneLabel,
          phone,
          primary_cta: { text: primaryCtaText, action: "scroll", target: primaryCtaTarget },
          secondary_cta: { text: secondaryCtaText, action: "scroll", target: secondaryCtaTarget },
          scroll_indicator: scrollIndicator,
          background_image: bgImage
            ? {
              type: "storage",
              bucket: bgImage.bucket,
              path: bgImage.path,
              publicUrl: bgImage.publicUrl,
              alt: bgImage.alt,
            }
            : initial.background_image,
        };
      } else if (isSettings) {
        content = {
          ...content,
          maintenance_mode: maintenanceMode
        };
      } else {
        try {
          content = JSON.parse(rawContent);
        } catch (e) {
          throw new Error("Некорректный JSON в поле контента");
        }
      }

      const { error } = await supabase
        .from("site_content")
        .update({ is_visible: isVisible, section_name: sectionName, content })
        .eq("id", sectionId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin_section", sectionId] });
      await qc.invalidateQueries({ queryKey: ["admin_sections"] });
      await qc.invalidateQueries({ queryKey: ["site_content"] });
      toast({ title: "Сохранено", description: `${data?.section_name} обновлён.` });
    },
    onError: (e: any) => {
      toast({ title: "Ошибка сохранения", description: e?.message ?? "Не удалось сохранить.", variant: "destructive" });
    },
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Загрузка данных секции...</div>;

  return (
    <div className="space-y-6">
      <Helmet>
        <title>{data?.section_name || "Редактор"} — Админка</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Редактор секции</h1>
          <p className="text-sm text-muted-foreground mt-1">ID: <code className="bg-muted px-1 rounded">{sectionId}</code></p>
        </div>

        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Сохраняю…" : "Сохранить изменения"}
        </Button>
      </div>

      <Card className="p-5 space-y-5">
        <div className="space-y-2">
          <Label>Название секции (в админке)</Label>
          <Input value={sectionName} onChange={(e) => setSectionName(e.target.value)} />
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <div className="space-y-1">
            <div className="text-sm font-medium text-foreground">Видимость секции</div>
            <div className="text-xs text-muted-foreground">Если выключить — секция не будет отображаться на сайте.</div>
          </div>
          <Switch checked={isVisible} onCheckedChange={setIsVisible} />
        </div>

        {isHero && (
          <div className="space-y-5 border-t pt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Badge</Label>
                <Input value={badgeText} onChange={(e) => setBadgeText(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Телефон</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={"+7928..."} />
              </div>
              <div className="space-y-2">
                <Label>Заголовок (prefix)</Label>
                <Input value={headingPrefix} onChange={(e) => setHeadingPrefix(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Заголовок (highlight)</Label>
                <Input value={headingHighlight} onChange={(e) => setHeadingHighlight(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Лид (lead)</Label>
              <Textarea value={lead} onChange={(e) => setLead(e.target.value)} rows={4} />
            </div>

            <div className="space-y-2">
              <Label>Пункты списка (каждый с новой строки)</Label>
              <Textarea value={bulletsText} onChange={(e) => setBulletsText(e.target.value)} rows={6} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>CTA 1 — текст</Label>
                <Input value={primaryCtaText} onChange={(e) => setPrimaryCtaText(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>CTA 1 — target</Label>
                <Input value={primaryCtaTarget} onChange={(e) => setPrimaryCtaTarget(e.target.value)} placeholder="#contacts" />
              </div>
              <div className="space-y-2">
                <Label>CTA 2 — текст</Label>
                <Input value={secondaryCtaText} onChange={(e) => setSecondaryCtaText(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>CTA 2 — target</Label>
                <Input value={secondaryCtaTarget} onChange={(e) => setSecondaryCtaTarget(e.target.value)} placeholder="#programs" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm font-medium text-foreground">Индикатор скролла</div>
                <div className="text-xs text-muted-foreground">Показывать анимацию внизу hero.</div>
              </div>
              <Switch checked={scrollIndicator} onCheckedChange={setScrollIndicator} />
            </div>
          </div>
        )}

        {isSettings && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm font-medium text-foreground">Режим обслуживания</div>
                <div className="text-xs text-muted-foreground">Показывать заглушку для всех кроме админа.</div>
              </div>
              <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
            </div>
          </div>
        )}

        {!isHero && !isSettings && (
          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label>Контент секции (JSON)</Label>
              <p className="text-xs text-muted-foreground">Редактируйте данные секции в формате JSON.</p>
              <Textarea
                value={rawContent}
                onChange={(e) => setRawContent(e.target.value)}
                rows={15}
                className="font-mono text-xs"
              />
            </div>
          </div>
        )}
      </Card>

      {isHero && (
        <ImageUploader
          bucket="images"
          prefix="hero"
          label="Фоновое изображение"
          helpText="Загрузите картинку для hero; URL будет сохранён в site_content.content.background_image.publicUrl."
          value={bgImage}
          onChange={setBgImage}
        />
      )}
    </div>
  );
}
