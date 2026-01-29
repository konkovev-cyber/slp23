import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { clubs } from "@/lib/clubs";
import { ArrowRight } from "lucide-react";

const Clubs = () => {
  const getClubsByCategory = (category: string) => clubs.filter((club) => club.category === category);

  const ClubCard = ({ club, index }: { club: (typeof clubs)[0]; index: number }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.05 }}
    >
      <div className="glass-card p-10 h-full rounded-[3rem] group hover:border-primary/50 transition-all flex flex-col shadow-xl">
        <div className="flex items-center justify-between mb-10">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/10 group-hover:bg-primary group-hover:text-white transition-all">
            <club.icon className="w-8 h-8 text-primary group-hover:text-white transition-colors" />
          </div>
          <Badge className="bg-muted text-muted-foreground border-border rounded-lg px-4 py-1.5 font-black uppercase text-[10px] tracking-widest">{club.age}</Badge>
        </div>

        <h3 className="text-2xl font-black text-foreground mb-4 group-hover:text-primary transition-colors tracking-tight leading-tight">{club.title}</h3>
        <p className="text-muted-foreground mb-10 leading-relaxed font-medium line-clamp-3">{club.shortDescription}</p>

        <div className="mt-auto pt-8 border-t border-border flex items-center justify-between">
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{club.schedule}</span>
          <Link to={`/clubs/${club.slug}`} className="text-xs font-black text-primary hover:underline underline-offset-8 decoration-2 flex items-center gap-2 group/link">
            Детали <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </motion.div>
  );

  return (
    <section id="clubs" className="py-32 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="text-primary font-black tracking-[0.3em] uppercase text-xs mb-4 block">Развитие и досуг</span>
          <h2 className="text-4xl md:text-6xl font-black text-foreground mb-6 tracking-tighter">Кружки и секции</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Раскрываем таланты за рамками учебной программы: от робототехники до вокала.
          </p>
        </motion.div>

        <Tabs defaultValue="all" className="w-full">
          <div className="flex justify-center mb-16">
            <TabsList className="bg-muted p-1.5 rounded-2xl flex h-auto overflow-x-auto w-full max-w-2xl">
              {["all", "creative", "tech", "educational"].map((cat) => (
                <TabsTrigger
                  key={cat}
                  value={cat}
                  className="rounded-xl flex-1 px-8 py-4 data-[state=active]:bg-primary data-[state=active]:text-white font-black transition-all capitalize"
                >
                  {cat === "all" ? "Все" : cat === "creative" ? "Творчество" : cat === "tech" ? "Технологии" : "Наука"}
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
            <TabsContent key={content.v} value={content.v} className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {content.items.map((club, index) => (
                <ClubCard key={club.title} club={club} index={index} />
              ))}
            </TabsContent>
          ))}
        </Tabs>

        {/* Promo CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="mt-32"
        >
          <div className="glass-card p-12 md:p-24 rounded-[4rem] text-center relative overflow-hidden group shadow-[0_48px_80px_-20px_rgba(0,0,0,0.1)]">
            <div className="absolute inset-0 bg-primary/10 blur-[120px] rounded-full -translate-y-1/2 group-hover:bg-primary/20 transition-all duration-700" />

            <div className="relative space-y-10">
              <h3 className="text-3xl md:text-5xl font-black text-foreground max-w-3xl mx-auto leading-tight tracking-tighter">Первое пробное занятие совершенно бесплатно</h3>
              <p className="text-xl text-muted-foreground max-w-xl mx-auto font-medium">Приходите познакомиться с преподавателями и почувствовать атмосферу наших кружков.</p>
              <Link to="/#contacts" className="inline-flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 h-20 px-16 text-xl font-black transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-primary/30">
                Попробовать бесплатно
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Clubs;