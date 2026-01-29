import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Calendar } from "lucide-react";

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

  const publishedText = post?.published_at
    ? format(new Date(post.published_at), "d MMMM yyyy", { locale: ru })
    : "";

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <Navigation />

      <main className="pt-28 pb-20">
        <article className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link to="/news" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Назад к новостям
            </Link>
          </motion.div>

          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-8 bg-muted rounded w-2/3" />
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-[400px] bg-muted rounded w-full" />
            </div>
          ) : !post ? (
            <div className="text-center py-20">
              <h1 className="text-2xl font-bold text-foreground">Новость не найдена</h1>
              <Link to="/news" className="text-primary hover:underline mt-4 block font-bold">Вернуться к списку</Link>
            </div>
          ) : (
            <div className="space-y-10">
              <header className="space-y-4" aria-label="Заголовок новости">
                <div className="flex flex-wrap items-center gap-4">
                  <Badge className="bg-primary/10 text-primary border-none rounded-md px-2.5 py-0.5 font-bold uppercase text-[10px] tracking-wider">
                    {post.category}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-bold uppercase tracking-widest">
                    <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                    <time dateTime={post.published_at.split('T')[0]}>
                      {publishedText}
                    </time>
                  </div>
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tighter leading-tight">
                  {post.title}
                </h1>
              </header>

              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative aspect-video rounded-2xl overflow-hidden shadow-lg border border-border/50"
              >
                <img
                  src={image}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="prose prose-neutral dark:prose-invert max-w-none"
              >
                <div className="text-foreground/90 text-base md:text-lg leading-relaxed font-medium whitespace-pre-wrap">
                  {post.content}
                </div>
              </motion.div>
            </div>
          )}
        </article>
      </main>

      <Footer />
    </div>
  );
}
