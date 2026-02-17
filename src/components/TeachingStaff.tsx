import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

import { Play, Star, MessageSquare, X } from "lucide-react";

type Review = {
  id: string;
  parent_name: string;
  review_text: string;
  rating: number;
};

type Teacher = {
  id: string;
  name: string;
  title: string;
  description: string;
  image_url: string;
  video_url?: string;
};

export default function TeachingStaff() {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers_public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teachers" as any)
        .select("*, teacher_reviews(*)")
        .order("sort_order", { ascending: true });
      if (error) {
        console.error("Error fetching teachers:", error);
        return [];
      }
      return (data ?? []) as any[];
    },
  });

  if (teachers.length === 0) return null;

  return (
    <section aria-labelledby="teaching-staff" className="py-20 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <span className="text-primary font-bold tracking-widest uppercase text-[10px] mb-2 block">Команда и репутация</span>
          <h2 id="teaching-staff" className="text-3xl md:text-5xl font-bold text-foreground tracking-tight">Наш педагогический состав</h2>
          <p className="mt-4 text-sm text-muted-foreground max-w-xl mx-auto font-medium">
            Профессионалы, которые вдохновляют детей на открытия и имеют безупречные отзывы от родителей наших учеников.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {teachers.map((t, idx) => (
            <motion.article
              key={t.id}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="group"
            >
              <Card className="overflow-hidden border-border/40 bg-card/30 backdrop-blur-sm hover:shadow-xl transition-all duration-500 rounded-3xl group">
                <div className="flex flex-col sm:flex-row h-full">
                  {/* Image Side */}
                  <div className="relative w-full sm:w-48 aspect-[3/4] sm:aspect-auto overflow-hidden shrink-0">
                    <img
                      src={t.image_url || "/placeholder.svg"}
                      alt={t.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                    {t.video_url && (
                      <button
                        onClick={() => setSelectedVideo(t.video_url)}
                        className="absolute inset-0 flex items-center justify-center group/play transition-all"
                      >
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/40 group-hover/play:scale-110 group-hover/play:bg-primary transition-all shadow-xl">
                          <Play className="w-5 h-5 text-white fill-white" />
                        </div>
                        <span className="absolute bottom-4 text-[10px] text-white font-bold uppercase tracking-wider opacity-0 group-hover/play:opacity-100 transition-opacity">Видео-визитка</span>
                      </button>
                    )}
                  </div>

                  {/* Content Side */}
                  <div className="p-6 flex flex-col justify-between flex-1">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-foreground tracking-tight leading-none mb-1">{t.name}</h3>
                          <div className="text-[10px] text-primary font-bold uppercase tracking-widest">{t.title}</div>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed italic mb-4 line-clamp-3">
                        "{t.description}"
                      </p>

                      {/* Reviews Preview if any */}
                      {t.teacher_reviews && t.teacher_reviews.length > 0 ? (
                        <div className="space-y-3 pt-4 border-t border-border/40">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-foreground/70 uppercase tracking-widest">
                            <MessageSquare className="w-3 h-3 text-primary" />
                            Отзывы родителей
                          </div>
                          {t.teacher_reviews.slice(0, 1).map((rev: any) => (
                            <div key={rev.id} className="bg-primary/5 rounded-2xl p-3 border border-primary/10">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold">{rev.parent_name}</span>
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-2.5 h-2.5 ${i < rev.rating ? "text-yellow-500 fill-yellow-500" : "text-muted"}`} />
                                  ))}
                                </div>
                              </div>
                              <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug">
                                {rev.review_text}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="pt-4 border-t border-border/40 opacity-50 text-[10px] italic">
                          Отзывов пока нет, будьте первым!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.article>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl"
            onClick={() => setSelectedVideo(null)}
          >
            <div className="relative w-full max-w-4xl aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
              <iframe
                src={selectedVideo.replace("watch?v=", "embed/")}
                className="w-full h-full"
                allowFullScreen
                allow="autoplay; encrypted-media"
              />
              <button
                onClick={() => setSelectedVideo(null)}
                className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-md transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
