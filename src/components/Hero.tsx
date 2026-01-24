 import { motion } from "framer-motion";
 import { Button } from "@/components/ui/button";
 import { ArrowRight, Calendar, GraduationCap } from "lucide-react";
import heroImage from "@/assets/hero-main.jpg";
import { useContent } from "@/hooks/use-content";

type HeroContent = {
  badge_text?: string;
  heading_prefix?: string;
  heading_highlight?: string;
  lead?: string;
  bullets?: string[];
  phone_label?: string;
  phone?: string;
  primary_cta?: { text?: string; action?: string; target?: string };
  secondary_cta?: { text?: string; action?: string; target?: string };
  background_image?: { publicUrl?: string; public_url?: string; alt?: string };
  scroll_indicator?: boolean;
};
 
 const Hero = () => {
  const { data } = useContent<HeroContent>("hero");

  const content = data?.content;
  const isVisible = data?.is_visible ?? true;

  if (!isVisible) return null;

  const bgUrl =
    content?.background_image?.publicUrl ??
    content?.background_image?.public_url ??
    heroImage;

  const badgeText = content?.badge_text ?? "Набор открыт на 2026/2027 учебный год";
  const headingPrefix = content?.heading_prefix ?? "«Личность ПЛЮС» —";
  const headingHighlight = content?.heading_highlight ?? "частная общеобразовательная школа";
  const lead =
    content?.lead ??
    "Дополнительное образование с углублённым изучением математики, физики и английского языка.\nОбучаем детей с 0 по 9 класс.";

  const bullets =
    content?.bullets ??
    [
      "— Подготовка к школе (пребывание полный день)",
      "— Кружки и секции помимо основных предметов",
      "— Безопасность: собственная территория под охраной и постоянным контролем",
      "— До 16 учеников в классе — больше внимания каждому ребёнку",
      "— Дети ходят в школу с удовольствием, а вы освобождены от домашних уроков",
    ];

  const phoneLabel = content?.phone_label ?? "Подать заявку или узнать подробности:";
  const phone = content?.phone ?? "+79282619928";

  const primaryCtaText = content?.primary_cta?.text ?? "Записаться на экскурсию";
  const secondaryCtaText = content?.secondary_cta?.text ?? "Узнать о программах";
  const showScrollIndicator = content?.scroll_indicator ?? true;

   return (
     <section id="home" className="relative min-h-screen flex items-center pt-20">
       {/* Background Image with Overlay */}
       <div className="absolute inset-0 z-0">
         <img
            src={bgUrl}
            alt={content?.background_image?.alt ?? "Счастливые дети в школе"}
           className="w-full h-full object-cover"
         />
         <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/60"></div>
       </div>
 
       {/* Content */}
       <div className="container mx-auto px-4 relative z-10">
         <div className="max-w-3xl">
           <motion.div
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8 }}
             className="space-y-6"
           >
             <div className="inline-block">
               <span className="bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-semibold">
                  {badgeText}
               </span>
             </div>
 
              <h1 className="text-foreground leading-tight">
                 {headingPrefix}
                <br />
                 <span className="text-primary">{headingHighlight}</span>
              </h1>
 
              <p className="text-xl text-muted-foreground max-w-2xl">
                 {lead}
              </p>

              <ul className="text-muted-foreground space-y-2 max-w-2xl">
                 {bullets.map((t, i) => (
                   <li key={i}>{t}</li>
                 ))}
              </ul>

              <p className="text-foreground font-semibold">
                 {phoneLabel}{" "}
                 <a className="text-primary hover:underline" href={`tel:${phone}`}>
                   {phone.startsWith("+") ? phone : `+${phone}`}
                 </a>
              </p>
 
             <div className="flex flex-col sm:flex-row gap-4 pt-4">
               <Button 
                 size="lg" 
                 className="bg-accent hover:bg-accent/90 text-accent-foreground group"
               >
                 <Calendar className="w-5 h-5 mr-2" />
                  {primaryCtaText}
                 <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
               </Button>
               <Button 
                 size="lg" 
                 variant="outline"
                 className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
               >
                 <GraduationCap className="w-5 h-5 mr-2" />
                  {secondaryCtaText}
               </Button>
             </div>
           </motion.div>
         </div>
       </div>
 
       {/* Scroll Indicator */}
        {showScrollIndicator ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-6 h-10 border-2 border-primary rounded-full flex items-start justify-center p-2"
            >
              <motion.div className="w-1 h-2 bg-primary rounded-full" />
            </motion.div>
          </motion.div>
        ) : null}
     </section>
   );
 };
 
 export default Hero;