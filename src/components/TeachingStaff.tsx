import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

type Teacher = {
  id: string;
  name: string;
  title: string;
  description: string;
  image_url: string;
};

export default function TeachingStaff() {
  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers_public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teachers" as any)
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) {
        console.error("Error fetching teachers:", error);
        return [];
      }
      return (data ?? []) as unknown as Teacher[];
    },
  });

  if (teachers.length === 0) return null;

  return (
    <section aria-labelledby="teaching-staff" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <span className="text-primary font-bold tracking-widest uppercase text-[10px] mb-2 block">Команда</span>
          <h2 id="teaching-staff" className="text-3xl md:text-5xl font-bold text-foreground tracking-tight">Наши педагоги</h2>
          <p className="mt-4 text-sm text-muted-foreground max-w-xl mx-auto font-medium">
            Профессионалы, которые вдохновляют детей на открытия и поддерживают их на пути к знаниям.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {teachers.map((t, idx) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="glass-card overflow-hidden rounded-xl border-border/50 group h-full flex flex-col shadow-sm hover:shadow-md transition-all">
                <div className="relative aspect-[3/4] bg-muted overflow-hidden">
                  <img
                    src={t.image_url || "/placeholder.svg"}
                    alt={t.name}
                    loading="lazy"
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
                <div className="p-5 flex-grow">
                  <h3 className="text-base font-bold text-foreground mb-1 tracking-tight">{t.name}</h3>
                  <div className="text-[10px] text-primary font-bold uppercase tracking-wider mb-3 leading-none">{t.title}</div>
                  <p className="text-[12px] text-muted-foreground leading-relaxed font-medium">{t.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
