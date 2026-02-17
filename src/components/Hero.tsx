import { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, GraduationCap, Phone, CheckCircle2 } from "lucide-react";
import { useContent } from "@/hooks/use-content";

type HeroContent = {
  badge_text?: string;
  phone?: string;
  lead?: string;
};

import img1 from "@/assets/hero-main.jpg";
import img2 from "@/assets/hero-children.jpg";
import img3 from "@/assets/activities.jpg";

const SLIDER_IMAGES = [img1, img2, img3];

const Hero = () => {
  const { data } = useContent<HeroContent>("hero");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 150]); // Parallax effect

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
    <section id="home" className="relative min-h-[90vh] flex items-center pt-24 pb-16 overflow-hidden bg-[#fafafa] dark:bg-background">
      {/* Seamless cross-fade background slider with PARALLAX */}
      <motion.div style={{ y: y1 }} className="absolute inset-0 z-0 overflow-hidden h-[120%] -top-[10%]">
        {SLIDER_IMAGES.map((img, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0 }}
            animate={{
              opacity: currentImageIndex === idx ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 0.35 : 0.6) : 0,
              scale: currentImageIndex === idx ? 1 : 1.12
            }}
            transition={{ duration: 2.5, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <img
              src={img}
              className="w-full h-full object-cover pointer-events-none filter blur-[0px]"
              alt=""
              role="presentation"
              width="1920"
              height="1080"
              decoding="async"
              loading={idx === 0 ? "eager" : "lazy"}
            />
          </motion.div>
        ))}

        {/* Improved Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent lg:w-3/4" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/20" />
      </motion.div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-1 text-center lg:text-left space-y-7"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-white/50 dark:bg-black/30 backdrop-blur-md border border-primary/20 px-4 py-1.5 rounded-full shadow-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-[11px] font-bold tracking-widest text-foreground uppercase">
                {badgeText}
              </span>
            </motion.div>

            <div className="space-y-3">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-foreground">
                Личность <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">ПЛЮС</span>
              </h1>
              <h2 className="text-xl md:text-3xl font-bold tracking-tight text-foreground/80 leading-tight">
                частная школа <br className="hidden md:block" /> будущего
              </h2>
            </div>

            <p className="text-base md:text-lg text-foreground/80 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
              {lead}
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
              <Link to="/contact">
                <Button size="lg" className="rounded-full h-14 px-8 text-base font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300 bg-gradient-to-r from-primary to-blue-600 border-none text-white">
                  Записаться на экскурсию <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <div className="flex items-center gap-3 py-2 px-3 bg-white/40 dark:bg-black/20 backdrop-blur-sm rounded-full border border-white/20">
                <div className="w-9 h-9 bg-white dark:bg-card rounded-full flex items-center justify-center shadow-sm">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <a href={`tel:${phone.replace(/\D/g, '')}`} className="text-sm font-bold text-foreground hover:text-primary transition-colors pr-2">
                  {phone}
                </a>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-6 opacity-90">
              {["Малые группы до 12 человек", "Английский каждый день", "Школа полного дня"].map((benefit, i) => (
                <div key={i} className="flex items-center gap-2 text-[13px] font-bold text-foreground/90 bg-white/30 dark:bg-black/20 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Premium Glass Card Right Side */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full max-w-[380px] relative perspective-1000"
          >
            {/* Floating Blobs */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl dark:bg-blue-500/10"
            />
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-5 -left-5 w-32 h-32 bg-primary/20 rounded-full blur-3xl dark:bg-primary/10"
            />

            <div className="glass-card p-8 rounded-2xl relative overflow-hidden group shadow-2xl bg-white/70 dark:bg-card/60 backdrop-blur-xl border border-white/50 dark:border-white/10 ring-1 ring-black/5">
              <div className="relative space-y-6 z-10">
                <div className="flex items-center gap-4 border-b border-border/50 pb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-xl flex items-center justify-center ring-1 ring-primary/20">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground leading-tight">Запишитесь <br />на экскурсию</h3>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { icon: GraduationCap, label: "Набор в 1-й класс", detail: "2026/27 учебный год" },
                    { icon: Phone, label: "Обратный звонок", detail: "Перезвоним в течение часа" }
                  ].map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-muted/40 border border-transparent hover:border-primary/20 hover:bg-white/50 dark:hover:bg-white/5 transition-all cursor-pointer flex items-center justify-between group/line">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-white dark:bg-background flex items-center justify-center shadow-sm ring-1 ring-black/5">
                          <item.icon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-bold text-[13px]">{item.label}</div>
                          <div className="text-[10px] text-muted-foreground">{item.detail}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover/line:text-primary transition-transform group-hover/line:translate-x-0.5" />
                    </div>
                  ))}
                </div>

                <Link to="/contact">
                  <Button className="w-full h-12 rounded-xl bg-foreground text-background hover:bg-primary hover:text-white font-bold text-sm transition-all shadow-lg hover:shadow-primary/25 mt-2">
                    Подать заявку онлайн
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;