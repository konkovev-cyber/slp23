import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { extractFirstImageUrl } from "@/lib/news-images";

interface PostPreview {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string | null;
  image_url: string | null;
  content: string;
  published_at: string;
}

const News = () => {
  const [scrollIndex, setScrollIndex] = useState(0);

  const { data: posts } = useQuery({
    queryKey: ["news-preview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("published_at", { ascending: false })
        .limit(8);

      if (error) throw error;
      return data as PostPreview[];
    },
  });

  const allItems = useMemo(() => {
    if (!posts) return [];
    return posts.map((p) => ({
      id: p.id,
      title: p.title,
      date: format(new Date(p.published_at), "d MMMM yyyy", { locale: ru }),
      category: p.category,
      image:
        p.image_url ??
        extractFirstImageUrl(p.content ?? "") ??
        "/placeholder.svg",
      href: `/news/${p.slug}`,
    }));
  }, [posts]);

  const displayItems = useMemo(() => {
    return allItems.slice(scrollIndex, scrollIndex + 4);
  }, [allItems, scrollIndex]);

  const canScrollLeft = scrollIndex > 0;
  const canScrollRight = scrollIndex + 4 < allItems.length;

  const handleScroll = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      setScrollIndex(Math.max(0, scrollIndex - 1));
    } else {
      setScrollIndex(Math.min(allItems.length - 4, scrollIndex + 1));
    }
  };

  return (
    <section className="py-20 bg-background" id="news" aria-label="Последние новости">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 max-w-6xl mx-auto"
        >
          <div>
            <span className="text-primary font-bold tracking-widest uppercase text-[11px] mb-2 block">События</span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight">Новости школы</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md font-medium">
              Следите за жизнью школы и достижениями наших учеников.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/news" className="text-xs font-bold text-primary hover:underline underline-offset-4 flex items-center gap-1">
              Все новости <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full border-border bg-transparent hover:bg-muted"
                onClick={() => handleScroll('left')}
                disabled={!canScrollLeft}
                aria-label="Предыдущие новости"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full border-border bg-transparent hover:bg-muted"
                onClick={() => handleScroll('right')}
                disabled={!canScrollRight}
                aria-label="Следующие новости"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {displayItems.length > 0 ? (
            displayItems.map((item, index) => (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link to={item.href} className="group block h-full">
                  <Card className="h-full rounded-xl overflow-hidden border-border bg-white/50 dark:bg-card/40 shadow-sm hover:shadow-md transition-all group-hover:border-primary/20">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img
                        src={item.image}
                        alt=""
                        role="presentation"
                        width="400"
                        height="250"
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-white/90 backdrop-blur-sm text-primary border-none text-[9px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                          {item.category}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-bold mb-2">
                        <CalendarIcon className="w-3 h-3" aria-hidden="true" />
                        <time dateTime={posts?.find(p => p.id === item.id)?.published_at.split('T')[0]}>
                          {item.date}
                        </time>
                      </div>
                      <h3 className="font-bold text-sm text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors tracking-tight">
                        {item.title}
                      </h3>
                    </CardContent>
                  </Card>
                </Link>
              </motion.article>
            ))
          ) : (
            <div className="col-span-full py-20 text-center text-muted-foreground font-medium italic">
              Новостей пока нет
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default News;