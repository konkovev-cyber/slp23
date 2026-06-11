import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, GraduationCap, Phone, CheckCircle2, Sparkles, BookOpen, Clock, Users2 } from "lucide-react";
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
  const y1 = useTransform(scrollY, [0, 500], [0, 120]); // Parallax effect

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
    <section id="home" className="relative min-h-[92vh] flex items-center pt-28 pb-20 overflow-hidden bg-[#fafafa] dark:bg-black transition-colors duration-300">
      {/* Background grid overlay */}
      <div className="absolute inset-0 z-1 bg-[linear-gradient(to_right,#80808007_1px,transparent_1px),linear-gradient(to_bottom,#80808007_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Seamless cross-fade background slider with PARALLAX */}
      <motion.div style={{ y: y1 }} className="absolute inset-0 z-0 overflow-hidden h-[120%] -top-[10%] select-none">
        {SLIDER_IMAGES.map((img, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0 }}
            animate={{
              opacity: currentImageIndex === idx ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 0.3 : 0.55) : 0,
              scale: currentImageIndex === idx ? 1.02 : 1.15
            }}
            transition={{ duration: 3, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <img
              src={img}
              className="w-full h-full object-cover pointer-events-none filter brightness-[0.95] contrast-[1.02]"
              alt=""
              role="presentation"
              width="1920"
              height="1080"
              decoding="async"
              loading={idx === 0 ? "eager" : "lazy"}
            />
          </motion.div>
        ))}

        {/* Improved Sleek Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#fafafa] via-[#fafafa]/80 to-transparent dark:from-black dark:via-black/70 dark:to-transparent lg:w-3/5" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#fafafa] via-transparent to-transparent dark:from-black" />
      </motion.div>

      {/* Interactive Background Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-primary/10 blur-[80px] pointer-events-none animate-pulse z-0" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none z-0" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-8">

          {/* Left Content Side */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-1 text-center lg:text-left space-y-8 max-w-3xl"
          >
            {/* Super Premium Badge */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2.5 bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-primary/20 dark:border-white/10 px-4.5 py-2 rounded-full shadow-md shadow-black/5"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-xs font-semibold tracking-wider text-primary dark:text-blue-400">
                {badgeText}
              </span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            </motion.div>

            {/* Typography Header */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] text-foreground">
                Личность <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 filter drop-shadow-sm">ПЛЮС</span>
              </h1>
              <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-foreground/90 max-w-lg mx-auto lg:mx-0">
                Частная школа будущего
              </h2>
            </div>

            {/* Description Text */}
            <p className="text-base md:text-lg text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
              {lead}
            </p>

            {/* CTA Buttons Block */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link to="/contact" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto rounded-full h-14 px-8 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 bg-gradient-to-r from-primary to-blue-600 dark:from-blue-500 dark:to-indigo-600 border-none text-white">
                  Записаться на экскурсию <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <div className="flex items-center gap-3 py-2 px-4.5 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-full border border-white/80 dark:border-white/10 shadow-sm hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
                <div className="w-9 h-9 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
                  <Phone className="w-4 h-4 text-primary dark:text-blue-400" />
                </div>
                <a href={`tel:${phone.replace(/\D/g, '')}`} className="text-sm font-bold text-foreground hover:text-primary transition-colors pr-1">
                  {phone}
                </a>
              </div>
            </div>

            {/* Core Benefits */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
              {[
                { text: "Малые группы до 12 человек", icon: Users2 },
                { text: "Английский язык каждый день", icon: BookOpen },
                { text: "Школа полного дня (9:00 - 18:00)", icon: Clock }
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-2.5 text-[13px] font-semibold text-foreground/85 bg-white/40 dark:bg-white/5 border border-white/55 dark:border-white/5 px-4 py-2 rounded-xl backdrop-blur-md hover:border-primary/20 dark:hover:border-white/20 transition-all duration-300">
                  <benefit.icon className="w-4 h-4 text-primary dark:text-blue-400 flex-shrink-0" />
                  <span>{benefit.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Floating Elements Side */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3 }}
            className="w-full max-w-[420px] relative mt-8 lg:mt-0 select-none z-10"
          >
            {/* Interactive Glowing Backplates */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px] dark:bg-blue-500/5 animate-pulse" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-primary/10 rounded-full blur-[60px] dark:bg-primary/5" />

            {/* Main Premium Card */}
            <div className="relative glass-card p-8 rounded-3xl overflow-hidden shadow-2xl bg-white/70 dark:bg-white/5 backdrop-blur-2xl border border-white/80 dark:border-white/10 ring-1 ring-black/5">
              
              {/* Card top border glow line */}
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              
              <div className="relative space-y-6 z-10">
                <div className="flex items-center gap-4 border-b border-border/55 dark:border-white/10 pb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-blue-500/10 dark:from-white/5 dark:to-white/5 rounded-2xl flex items-center justify-center border border-primary/20 dark:border-white/15">
                    <Calendar className="w-6 h-6 text-primary dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground leading-tight">Приглашаем <br />на экскурсию</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Посмотрите школу изнутри</p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  {[
                    { icon: GraduationCap, label: "Набор на 2026/27 год", detail: "Свободные места в классах" },
                    { icon: Sparkles, label: "Индивидуальный подход", detail: "Программа под каждого ребенка" }
                  ].map((item, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-muted/30 dark:bg-white/5 border border-transparent hover:border-primary/15 dark:hover:border-white/10 hover:bg-white/80 dark:hover:bg-white/10 transition-all duration-300 cursor-pointer flex items-center justify-between group/line shadow-sm">
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-white dark:bg-white/10 flex items-center justify-center shadow-sm border border-black/5 dark:border-transparent">
                          <item.icon className="w-4.5 h-4.5 text-primary dark:text-blue-400" />
                        </div>
                        <div>
                          <div className="font-bold text-[13px] text-foreground">{item.label}</div>
                          <div className="text-[10px] text-muted-foreground">{item.detail}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover/line:text-primary dark:group-hover/line:text-blue-400 transition-transform group-hover/line:translate-x-1" />
                    </div>
                  ))}
                </div>

                <Link to="/contact">
                  <Button className="w-full h-13 rounded-2xl bg-foreground text-background hover:bg-primary dark:hover:bg-blue-500 hover:text-white font-bold text-sm transition-all duration-300 shadow-md hover:shadow-primary/25 mt-2">
                    Оставить заявку на экскурсию
                  </Button>
                </Link>
              </div>
            </div>

            {/* Floating Live Indicator stats */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-6 -left-8 p-3 rounded-2xl bg-white/85 dark:bg-white/10 backdrop-blur-xl border border-white dark:border-white/10 shadow-lg flex items-center gap-2.5 z-20"
            >
              <div className="w-8 h-8 rounded-xl bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="pr-1.5">
                <div className="text-[11px] text-muted-foreground leading-none">Лицензия МО</div>
                <div className="text-xs font-extrabold text-foreground mt-0.5">Госаккредитация</div>
              </div>
            </motion.div>

            {/* Floating Live Students stats */}
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute -bottom-6 -right-6 p-3 rounded-2xl bg-white/85 dark:bg-white/10 backdrop-blur-xl border border-white dark:border-white/10 shadow-lg flex items-center gap-2.5 z-20"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center animate-pulse">
                <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="pr-2">
                <div className="text-[11px] text-muted-foreground leading-none">Малые классы</div>
                <div className="text-xs font-extrabold text-foreground mt-0.5">до 12 учеников</div>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default Hero;