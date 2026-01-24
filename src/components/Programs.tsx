 import { motion } from "framer-motion";
 import { Card } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Button } from "@/components/ui/button";
 import { BookOpen, Palette, Calculator, Globe, Music, Dumbbell, ChevronRight } from "lucide-react";
import programsImage from "@/assets/programs.jpg";
 
 const programs = [
   {
     icon: BookOpen,
     title: "Литература и чтение",
     age: "6-10 лет",
     description: "Развитие навыков чтения, понимания текста и любви к книгам",
     color: "bg-primary/10 text-primary",
   },
   {
     icon: Calculator,
     title: "Математика и логика",
     age: "7-14 лет",
     description: "Развитие математического и логического мышления через игры и задачи",
     color: "bg-accent/10 text-accent",
   },
   {
     icon: Globe,
     title: "Английский язык",
     age: "6-16 лет",
     description: "Интерактивное изучение английского с носителями языка",
     color: "bg-success/10 text-success",
   },
   {
     icon: Palette,
     title: "Художественная студия",
     age: "6-16 лет",
     description: "Живопись, графика, скульптура и другие виды изобразительного искусства",
     color: "bg-primary/10 text-primary",
   },
   {
     icon: Music,
     title: "Музыка и вокал",
     age: "7-16 лет",
     description: "Индивидуальные и групповые занятия музыкой и пением",
     color: "bg-accent/10 text-accent",
   },
   {
     icon: Dumbbell,
     title: "Физкультура и спорт",
     age: "6-16 лет",
     description: "Общефизическая подготовка, командные игры, йога для детей",
     color: "bg-success/10 text-success",
   },
 ];
 
 const Programs = () => {
   return (
     <section id="programs" className="py-20 bg-muted/30">
       <div className="container mx-auto px-4">
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.6 }}
           className="text-center mb-16"
         >
           <h2 className="text-foreground mb-4">Образовательные программы</h2>
           <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
             Широкий выбор направлений для гармоничного развития вашего ребёнка
           </p>
         </motion.div>
 
         <div className="grid lg:grid-cols-2 gap-12 mb-16">
           <motion.div
             initial={{ opacity: 0, x: -30 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.6 }}
             className="space-y-6"
           >
             <div className="grid sm:grid-cols-2 gap-4">
               {programs.map((program, index) => (
                 <motion.div
                   key={program.title}
                   initial={{ opacity: 0, y: 20 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   transition={{ duration: 0.6, delay: index * 0.1 }}
                 >
                   <Card className="p-5 h-full hover:shadow-lg transition-all bg-card border-border group cursor-pointer">
                     <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${program.color}`}>
                       <program.icon className="w-6 h-6" />
                     </div>
                     <h4 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                       {program.title}
                     </h4>
                     <Badge variant="secondary" className="mb-3">{program.age}</Badge>
                     <p className="text-sm text-muted-foreground leading-relaxed">
                       {program.description}
                     </p>
                   </Card>
                 </motion.div>
               ))}
             </div>
           </motion.div>
 
           <motion.div
             initial={{ opacity: 0, x: 30 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.6 }}
             className="flex flex-col justify-center"
           >
             <img
                src={programsImage}
                alt="Занятия по образовательным программам"
               className="rounded-2xl shadow-xl w-full mb-6"
                loading="lazy"
             />
             <Card className="p-6 bg-primary text-primary-foreground">
               <h3 className="text-2xl font-bold mb-3">Индивидуальный подход</h3>
               <p className="mb-4 opacity-90">
                 Оставьте заявку, и мы подберём программу, подходящую именно вашему ребёнку. 
                 Первое пробное занятие — бесплатно!
               </p>
               <Button 
                 variant="secondary" 
                 className="group bg-primary-foreground text-primary hover:bg-primary-foreground/90"
               >
                 Получить консультацию
                 <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
               </Button>
             </Card>
           </motion.div>
         </div>
       </div>
     </section>
   );
 };
 
 export default Programs;