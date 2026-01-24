import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type FillResult = {
  scanned: number;
  updated: number;
  skippedNoImage: number;
  limit: number;
};

export default function AdminNews() {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [last, setLast] = useState<FillResult | null>(null);

  const run = async () => {
    setIsRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("news-fill-images", {
        body: { limit: 200 },
      });
      if (error) throw error;
      setLast(data as FillResult);
      toast({
        title: "Готово",
        description: `Проверено: ${(data as FillResult)?.scanned ?? 0}, обновлено: ${(data as FillResult)?.updated ?? 0}.`,
      });
    } catch (err: any) {
      toast({
        title: "Не удалось заполнить картинки",
        description: err?.message ?? "Попробуйте ещё раз.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Admin News</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Новости</h1>
        <p className="text-sm text-muted-foreground mt-1">Утилиты для обслуживания новостей.</p>
      </div>

      <Card className="p-5 space-y-3">
        <div className="text-sm font-medium text-foreground">Заполнить картинки</div>
        <div className="text-sm text-muted-foreground">
          Пройдём по последним новостям без <span className="font-medium text-foreground">image_url</span>, извлечём первую
          картинку из <span className="font-medium text-foreground">content</span> и сохраним.
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button onClick={run} disabled={isRunning}>
            {isRunning ? "Обрабатываем…" : "Заполнить картинки"}
          </Button>
          {last ? (
            <div className="text-sm text-muted-foreground">
              Последний запуск: обновлено {last.updated}, без картинок {last.skippedNoImage}, проверено {last.scanned}.
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
