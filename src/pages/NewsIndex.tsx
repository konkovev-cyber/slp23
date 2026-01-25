import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

type PostListItem = {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string | null;
  image_url: string | null;
  published_at: string;
};

function buildCanonical(pathname: string) {
  return new URL(pathname, window.location.origin).toString();
}

export default function NewsIndex() {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts", "news_index"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id,title,slug,category,excerpt,image_url,published_at")
        .order("published_at", { ascending: false })
        .limit(1000);

      if (error) throw error;
      return (data ?? []) as PostListItem[];
    },
  });

  const title = "Новости — Личность ПЛЮС";
  const description = "Новости, анонсы мероприятий и достижения учеников школы «Личность ПЛЮС».";
  const canonical = buildCanonical("/news");

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />

        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />

        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <Navigation />

      <main className="pt-20">
        <section className="py-16">
          <div className="container mx-auto px-4">
            <header className="mb-10">
              <h1 className="text-4xl font-bold text-foreground">Новости</h1>
              <p className="mt-3 text-muted-foreground max-w-2xl">{description}</p>
            </header>

            {isLoading ? (
              <div className="text-muted-foreground">Загрузка новостей…</div>
            ) : posts.length === 0 ? (
              <div className="text-muted-foreground">Пока нет опубликованных новостей.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => {
                  const dateText = post.published_at
                    ? format(new Date(post.published_at), "d MMMM yyyy", { locale: ru })
                    : "";

                  return (
                    <Link key={post.id} to={`/news/${post.slug}`} className="block">
                      <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden">
                        <div className="relative h-44 bg-muted overflow-hidden">
                          <img
                            src={post.image_url ?? "/placeholder.svg"}
                            alt={post.title}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-3 left-3">
                            <Badge variant="secondary">{post.category}</Badge>
                          </div>
                        </div>
                        <CardHeader>
                          <div className="text-sm text-muted-foreground">{dateText}</div>
                          <CardTitle className="mt-1">{post.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="line-clamp-3">
                            {post.excerpt ?? "Открыть новость"}
                          </CardDescription>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
