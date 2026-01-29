import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getClubBySlug } from "@/lib/clubs";

export default function ClubDetailsPage() {
  const { slug = "" } = useParams();
  const club = getClubBySlug(slug);

  if (!club) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-20">
          <div className="container mx-auto px-4 py-16">
            <Card className="p-8">
              <h1 className="text-2xl font-bold text-foreground">Кружок не найден</h1>
              <p className="mt-2 text-muted-foreground">Проверьте ссылку или вернитесь к списку кружков.</p>
              <Button asChild className="mt-6">
                <Link to="/clubs">К кружкам и секциям</Link>
              </Button>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const Icon = club.icon;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{club.title} — Личность ПЛЮС</title>
        <meta name="description" content={club.shortDescription} />
        <link rel="canonical" href={`/clubs/${club.slug}`} />
      </Helmet>

      <Navigation />
      <main className="pt-20">
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-start justify-between gap-6 flex-col md:flex-row">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" aria-hidden="true" />
                  </span>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{club.age}</Badge>
                    <Badge variant="outline">{club.schedule}</Badge>
                  </div>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-foreground">{club.title}</h1>
                <p className="mt-3 text-muted-foreground text-lg">{club.shortDescription}</p>
                <p className="mt-6 text-muted-foreground leading-relaxed">{club.summary}</p>

                <div className="mt-8 flex gap-3 flex-wrap">
                  <Button asChild>
                    <Link to="/contact">Записаться</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/clubs">Назад к списку</Link>
                  </Button>
                </div>
              </div>

              <Card className="w-full md:w-[360px] p-6">
                <div className="text-sm font-medium text-foreground">Кратко</div>
                <dl className="mt-4 space-y-3">
                  <div>
                    <dt className="text-xs uppercase text-muted-foreground">Возраст</dt>
                    <dd className="text-foreground">{club.age}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-muted-foreground">Расписание</dt>
                    <dd className="text-foreground">{club.schedule}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-muted-foreground">Описание</dt>
                    <dd className="text-muted-foreground">{club.shortDescription}</dd>
                  </div>
                </dl>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
