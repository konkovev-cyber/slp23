import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, GraduationCap, Phone, CheckCircle2 } from "lucide-react";
import { useContent } from "@/hooks/use-content";

type HeroContent = {
  badge_text?: string;
  phone?: string;
  lead?: string;
};

const SLIDER_IMAGES = [
  "https://slp23.ru/wp-content/gallery/d188d0bad0bed0bbd0b0/photo_2023-05-12_15-59-09.jpg",
  "https://slp23.ru/wp-content/gallery/d188d0bad0bed0bbd0b0/DSC_0212.JPG",
  "https://slp23.ru/wp-content/gallery/d188d0bad0bed0bbd0b0/NIK_1973.jpg"
];

const Hero = () => {
  const { data } = useContent<HeroContent>("hero");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const content = data?.content;
  const isVisible = data?.is_visible ?? true;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % SLIDER_IMAGES.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  if (!isVisible) return null;

  const badgeText = content?.badge_text ?? "Прием на 2026/27 год открыт";
  const lead = content?.lead ?? "Российское образование с фокусом на результат и гармоничное развитие личности ребенка в Горячем Ключе.";
  const phone = content?.phone ?? "+7 (928) 261-99-28";

  return (
    <section id="home" className="relative min-h-[85vh] flex items-center pt-24 pb-12 overflow-hidden bg-[#fafafa] dark:bg-background">
      {/* Seamless cross-fade background slider */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {SLIDER_IMAGES.map((img, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0 }}
            animate={{
              opacity: currentImageIndex === idx ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 0.35 : 0.6) : 0,
              scale: currentImageIndex === idx ? 1 : 1.05
            }}
            transition={{ duration: 2.5, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <img
              src={img}
              className="w-full h-full object-cover pointer-events-none"
              alt={`School Slide ${idx}`}
            />
          </motion.div>
        ))}

        {/* Slightly darker overlays for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent lg:w-3/5" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-background/10" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex-1 text-center lg:text-left space-y-6"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full backdrop-blur-sm shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-bold tracking-widest text-primary uppercase">
                {badgeText}
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-foreground drop-shadow-[0_2px_2px_rgba(255,255,255,0.5)] dark:drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
                Личность <span className="text-primary">ПЛЮС</span>
              </h1>
              <h2 className="text-xl md:text-3xl font-bold tracking-tight text-foreground/90 leading-tight drop-shadow-sm">
                частная общеобразовательная школа
              </h2>
            </div>

            <p className="text-base md:text-lg text-foreground font-semibold leading-relaxed max-w-xl mx-auto lg:mx-0 drop-shadow-sm">
              {lead}
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <Button size="default" className="rounded-full h-11 px-8 text-base font-bold shadow-md shadow-primary/20 active:scale-95 transition-all">
                Записаться <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <div className="flex items-center gap-3 py-2 px-1">
                <div className="w-9 h-9 bg-white/50 dark:bg-black/20 rounded-full flex items-center justify-center border border-border">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <a href={`tel:${phone.replace(/\D/g, '')}`} className="text-sm font-bold text-foreground hover:text-primary transition-colors">
                  {phone}
                </a>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-4">
              {["Малые группы", "Собственный кампус", "Углубленное обучение"].map((benefit, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[12px] font-bold text-foreground/80">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Compact Right Side Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="w-full max-w-sm"
          >
            <div className="glass-card p-7 md:p-9 rounded-xl relative overflow-hidden group shadow-lg bg-white/80 dark:bg-card/40 backdrop-blur-md border-border">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 blur-[60px] rounded-full" />

              <div className="relative space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Первый шаг</h3>
                    <p className="text-[11px] text-muted-foreground font-medium">Бесплатная экскурсия для семьи</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    { icon: GraduationCap, label: "Набор в 1-й класс", detail: "2026/27 учебный год" },
                    { icon: Phone, label: "Обратный звонок", detail: "Перезвоним вам" }
                  ].map((item, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-muted/30 border border-transparent hover:border-primary/20 transition-all cursor-pointer flex items-center justify-between group/line">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white dark:bg-background flex items-center justify-center shadow-sm">
                          <item.icon className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div>
                          <div className="font-bold text-[13px]">{item.label}</div>
                          <div className="text-[10px] text-muted-foreground">{item.detail}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover/line:text-primary transition-transform" />
                    </div>
                  ))}
                </div>

                <Button className="w-full h-11 rounded-full bg-foreground text-background hover:bg-foreground/90 font-bold text-sm transition-all shadow-sm">
                  Подать заявку
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;