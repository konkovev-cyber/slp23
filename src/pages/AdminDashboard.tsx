import { Helmet } from "react-helmet-async";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <Helmet>
        <title>Admin Dashboard</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Дашборд</h1>
        <p className="text-sm text-muted-foreground mt-1">Быстрые действия для управления сайтом.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5 space-y-3">
          <div className="text-sm font-medium text-foreground">Медиа</div>
          <div className="text-sm text-muted-foreground">
            Загрузите изображения в хранилище (hero/about/programs/gallery).
          </div>
          <Button asChild size="sm">
            <Link to="/admin/media">Открыть медиа</Link>
          </Button>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="text-sm font-medium text-foreground">Далее</div>
          <div className="text-sm text-muted-foreground">
            Следующий шаг — подключить секции витрины к site_content и заменить src/assets на URL из хранилища.
          </div>
        </Card>
      </div>
    </div>
  );
}
