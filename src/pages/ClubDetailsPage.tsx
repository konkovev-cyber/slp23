import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getClubBySlug } from "@/lib/clubs";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, User, Clock, CheckCircle2 } from "lucide-react";

export default function ClubDetailsPage() {
  const { slug = "" } = useParams();
  const club = getClubBySlug(slug);

  if (!club) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Navigation />
        <Card className="p-8 text-center max-w-md glass-card rounded-xl">
          <h1 className="text-2xl font-bold text-foreground mb-2">Кружок не найден</h1>
          <p className="text-muted-foreground mb-6 font-medium">Проверьте ссылку или вернитесь к списку кружков.</p>
          <Button asChild className="rounded-full px-8 font-bold">
            <Link to="/clubs">К списку секций</Link>
          </Button>
        </Card>
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
      </Helmet>

      <Navigation />

      <main className="pt-28 pb-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button asChild variant="link" className="p-0 text-muted-foreground hover:text-primary font-bold gap-2 text-xs uppercase tracking-widest">
              <Link to="/clubs"> <ArrowLeft className="w-3.5 h-3.5" /> Назад к списку</Link>
            </Button>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-10 items-start max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-3 space-y-8"
            >
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm mb-6">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <h1 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight leading-tight">{club.title}</h1>
                <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed max-w-2xl">{club.shortDescription}</p>
              </div>

              <div className="glass-card p-8 rounded-xl border-border/50 bg-white/50 dark:bg-card/40">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" /> О программе
                </h3>
                <p className="text-foreground/80 leading-relaxed font-medium">{club.summary}</p>
              </div>

              <div className="flex gap-4">
                <Button asChild className="rounded-full h-12 px-10 font-bold bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20">
                  <Link to="/contact">Записаться на занятие</Link>
                </Button>
              </div>
            </motion.div>

            <motion.aside
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2"
            >
              <div className="glass-card p-8 rounded-xl border-border/50 bg-white/60 dark:bg-card/30 backdrop-blur-md shadow-sm sticky top-28">
                <h3 className="text-lg font-bold mb-6 tracking-tight">Информация</h3>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Возраст</div>
                      <div className="text-sm font-bold text-foreground">{club.age}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Расписание</div>
                      <div className="text-sm font-bold text-foreground">{club.schedule}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Длительность</div>
                      <div className="text-sm font-bold text-foreground">60 минут</div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-border/50">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="rounded-md font-bold text-[10px] uppercase tracking-wider px-2.5 py-0.5">{club.category}</Badge>
                    <Badge variant="outline" className="rounded-md font-bold text-[10px] uppercase tracking-wider px-2.5 py-0.5">Личность ПЛЮС</Badge>
                  </div>
                </div>
              </div>
            </motion.aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
