 import { motion } from "framer-motion";
 import { Button } from "@/components/ui/button";
 import { ArrowRight, Calendar, GraduationCap } from "lucide-react";
 import heroImage from "@/assets/hero-children.jpg";
 
 const Hero = () => {
   return (
     <section id="home" className="relative min-h-screen flex items-center pt-20">
       {/* Background Image with Overlay */}
       <div className="absolute inset-0 z-0">
         <img
           src={heroImage}
           alt="Счастливые дети в школе"
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
                 Набор открыт на 2026/2027 учебный год
               </span>
             </div>
 
              <h1 className="text-foreground leading-tight">
                «Личность ПЛЮС» —
                <br />
                <span className="text-primary">частная общеобразовательная школа</span>
              </h1>
 
              <p className="text-xl text-muted-foreground max-w-2xl">
                Дополнительное образование с углублённым изучением математики, физики и английского языка.
                Обучаем детей с 0 по 9 класс.
              </p>

              <ul className="text-muted-foreground space-y-2 max-w-2xl">
                <li>— Подготовка к школе (пребывание полный день)</li>
                <li>— Кружки и секции помимо основных предметов</li>
                <li>— Безопасность: собственная территория под охраной и постоянным контролем</li>
                <li>— До 16 учеников в классе — больше внимания каждому ребёнку</li>
                <li>— Дети ходят в школу с удовольствием, а вы освобождены от домашних уроков</li>
              </ul>

              <p className="text-foreground font-semibold">
                Подать заявку или узнать подробности: <a className="text-primary hover:underline" href="tel:+79282619928">+7 928 261-99-28</a>
              </p>
 
             <div className="flex flex-col sm:flex-row gap-4 pt-4">
               <Button 
                 size="lg" 
                 className="bg-accent hover:bg-accent/90 text-accent-foreground group"
               >
                 <Calendar className="w-5 h-5 mr-2" />
                 Записаться на экскурсию
                 <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
               </Button>
               <Button 
                 size="lg" 
                 variant="outline"
                 className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
               >
                 <GraduationCap className="w-5 h-5 mr-2" />
                 Узнать о программах
               </Button>
             </div>
           </motion.div>
         </div>
       </div>
 
       {/* Scroll Indicator */}
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
     </section>
   );
 };
 
 export default Hero;