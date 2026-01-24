import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

type Post = {
  id: string;
  title: string;
  slug: string;
  category: string;
  content: string;
  excerpt: string | null;
  image_url: string | null;
  published_at: string;
  updated_at: string;
};

function stripText(htmlOrText: string) {
  return htmlOrText.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function buildCanonical(pathname: string) {
  return new URL(pathname, window.location.origin).toString();
}

export default function NewsPost() {
  const { slug } = useParams();
  const safeSlug = slug ?? "";

  const { data: post, isLoading } = useQuery({
    queryKey: ["posts", "by_slug", safeSlug],
    enabled: Boolean(safeSlug),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id,title,slug,category,content,excerpt,image_url,published_at,updated_at")
        .eq("slug", safeSlug)
        .maybeSingle();
      if (error) throw error;
      return data as Post | null;
    },
  });

  const canonical = buildCanonical(`/news/${safeSlug}`);
  const title = post ? `${post.title} — Личность ПЛЮС` : "Новость — Личность ПЛЮС";
  const description = post
    ? (post.excerpt ?? stripText(post.content).slice(0, 160))
    : "Новость школы «Личность ПЛЮС».";
  const image = post?.image_url ?? "/placeholder.svg";

  const jsonLd = post
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        description,
        datePublished: new Date(post.published_at).toISOString(),
        dateModified: new Date(post.updated_at).toISOString(),
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": canonical,
        },
        image: [new URL(image, window.location.origin).toString()],
        publisher: {
          "@type": "Organization",
          name: "Личность ПЛЮС",
        },
        author: {
          "@type": "Organization",
          name: "Личность ПЛЮС",
        },
      }
    : null;

  const publishedText = post?.published_at
    ? format(new Date(post.published_at), "d MMMM yyyy", { locale: ru })
    : "";

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />

        <meta property="og:type" content="article" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={new URL(image, window.location.origin).toString()} />

        <meta name="twitter:card" content="summary_large_image" />

        {jsonLd ? (
          <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        ) : null}
      </Helmet>

      <Navigation />

      <main>
        <article className="py-16">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="mb-6 text-sm text-muted-foreground">
              <Link to="/news" className="hover:underline">
                ← Все новости
              </Link>
            </div>

            {isLoading ? (
              <div className="text-muted-foreground">Загрузка новости…</div>
            ) : !post ? (
              <div>
                <h1 className="text-3xl font-bold text-foreground">Новость не найдена</h1>
                <p className="mt-3 text-muted-foreground">Проверьте ссылку или вернитесь к списку новостей.</p>
              </div>
            ) : (
              <>
                <header>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="secondary">{post.category}</Badge>
                    <span className="text-sm text-muted-foreground">{publishedText}</span>
                  </div>
                  <h1 className="mt-4 text-4xl font-bold text-foreground">{post.title}</h1>
                </header>

                <div className="mt-8 overflow-hidden rounded-xl bg-muted">
                  <img
                    src={image}
                    alt={post.title}
                    loading="lazy"
                    className="w-full h-auto object-cover"
                  />
                </div>

                <section className="mt-8 prose prose-neutral max-w-none">
                  <p className="text-foreground leading-relaxed">{post.content}</p>
                </section>
              </>
            )}
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
