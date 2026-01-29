import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { clubs } from "@/lib/clubs";
import { ArrowRight } from "lucide-react";

const Clubs = () => {
  const getClubsByCategory = (category: string) => clubs.filter((club) => club.category === category);

  const ClubCard = ({ club, index }: { club: (typeof clubs)[0]; index: number }) => (
    <motion.article
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="h-full"
    >
      <div className="glass-card p-6 h-full rounded-xl group hover:border-primary/40 transition-all flex flex-col shadow-sm hover:shadow-md bg-white/50 dark:bg-card/40">
        <div className="flex items-center justify-between mb-6">
          <div className="w-11 h-11 bg-primary/5 rounded-lg flex items-center justify-center border border-primary/10 group-hover:bg-primary group-hover:text-white transition-all">
            <club.icon className="w-5 h-5 text-primary group-hover:text-white transition-colors" aria-hidden="true" />
          </div>
          <Badge className="bg-muted/50 text-muted-foreground border-transparent rounded-md px-2.5 py-0.5 font-bold uppercase text-[9px] tracking-wider">{club.age}</Badge>
        </div>

        <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors tracking-tight leading-tight">{club.title}</h3>
        <p className="text-[13px] text-muted-foreground mb-6 leading-relaxed font-medium line-clamp-2">{club.shortDescription}</p>

        <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{club.schedule}</span>
          <Link to={`/clubs/${club.slug}`} className="text-[11px] font-bold text-primary hover:underline underline-offset-4 flex items-center gap-1.5 group/link">
            Узнать больше <ArrowRight className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </motion.article>
  );

  return (
    <section id="clubs" className="py-20 bg-background relative overflow-hidden" aria-label="Секции и кружки">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-primary font-bold tracking-widest uppercase text-[11px] mb-3 block">Клубы и секции</span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">Внеурочная деятельность</h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto font-medium">
            Раскрываем таланты за рамками учебной программы: от робототехники до вокала.
          </p>
        </motion.div>

        <Tabs defaultValue="all" className="w-full">
          <div className="flex justify-center mb-10">
            <TabsList className="bg-muted/50 p-1 rounded-xl flex h-auto overflow-x-auto max-w-full" aria-label="Фильтр кружков по категориям">
              {[
                { id: "all", label: "Все" },
                { id: "creative", label: "Творчество" },
                { id: "tech", label: "IT и Наука" },
                { id: "educational", label: "Развитие" }
              ].map((cat) => (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id}
                  className="rounded-lg px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all text-sm"
                >
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {[
            { v: "all", items: clubs },
            { v: "creative", items: getClubsByCategory("creative") },
            { v: "tech", items: getClubsByCategory("tech") },
            { v: "educational", items: getClubsByCategory("educational").concat(getClubsByCategory("sports")) }
          ].map((content) => (
            <TabsContent key={content.v} value={content.v} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {content.items.map((club, index) => (
                <ClubCard key={club.title} club={club} index={index} />
              ))}
            </TabsContent>
          ))}
        </Tabs>

        {/* Compact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <div className="glass-card p-10 md:p-14 rounded-2xl text-center relative overflow-hidden group shadow-md border-primary/10">
            <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full -translate-y-1/2 group-hover:bg-primary/10 transition-all" />

            <div className="relative space-y-6">
              <h3 className="text-2xl md:text-3xl font-bold text-foreground max-w-2xl mx-auto leading-tight tracking-tight">Первое пробное занятие бесплатно</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto font-medium leading-relaxed">Познакомьтесь с преподавателями и почувствуйте атмосферу наших кружков.</p>
              <Link to="/#contacts" className="inline-flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 h-12 px-10 text-base font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-sm shadow-primary/20">
                Записаться бесплатно
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Clubs;