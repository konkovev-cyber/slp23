import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { motion } from "framer-motion";
import { Calendar, ArrowRight } from "lucide-react";

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
  const description = "Новости и события школы «Личность ПЛЮС».";
  const canonical = buildCanonical("/news");

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Helmet>

      <Navigation />

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <motion.header
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 border-b pb-8"
          >
            <span className="text-primary font-bold tracking-widest uppercase text-[10px] mb-2 block">Медиа-центр</span>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight">Новости школы</h1>
            <p className="mt-3 text-sm text-muted-foreground max-w-2xl font-medium">{description}</p>
          </motion.header>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-[300px] rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed border-border/50">
              <p className="text-muted-foreground font-medium italic">Новости пока отсутствуют.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
              {posts.map((post, idx) => {
                const dateText = post.published_at
                  ? format(new Date(post.published_at), "d MMMM yyyy", { locale: ru })
                  : "";

                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Link to={`/news/${post.slug}`} className="group block h-full">
                      <Card className="h-full rounded-xl overflow-hidden border-border bg-white/50 dark:bg-card/40 shadow-sm hover:shadow-md transition-all group-hover:border-primary/20">
                        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                          <img
                            src={post.image_url ?? "/placeholder.svg"}
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-white/90 backdrop-blur-sm text-primary border-none text-[9px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                              {post.category}
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-bold mb-2 uppercase tracking-wider">
                            <Calendar className="w-3 h-3" />
                            {dateText}
                          </div>
                          <h3 className="font-bold text-sm text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors tracking-tight mb-3">
                            {post.title}
                          </h3>
                          <div className="text-[11px] font-bold text-primary flex items-center gap-1 transition-all group-hover:gap-2">
                            Читать <ArrowRight className="w-3 h-3" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
