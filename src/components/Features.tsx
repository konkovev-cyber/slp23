 import { motion } from "framer-motion";
 import { Users, Target, Lightbulb, Heart } from "lucide-react";
 import { Card } from "@/components/ui/card";
 
 const features = [
   {
     icon: Users,
     title: "Малые группы",
     description: "До 10 человек в группе для максимального внимания каждому ребёнку",
   },
   {
     icon: Target,
     title: "Индивидуальная траектория",
     description: "Персональный план развития с учётом интересов и способностей",
   },
   {
     icon: Lightbulb,
     title: "Проектная деятельность",
     description: "Практические навыки через реализацию собственных проектов",
   },
   {
     icon: Heart,
     title: "Психологическое сопровождение",
     description: "Поддержка профессионального психолога на всех этапах обучения",
   },
 ];
 
 const Features = () => {
   return (
     <section className="py-20 bg-muted/30">
       <div className="container mx-auto px-4">
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.6 }}
           className="text-center mb-16"
         >
           <h2 className="text-foreground mb-4">Почему выбирают нас</h2>
           <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
             Мы создаём условия для всестороннего развития каждого ребёнка
           </p>
         </motion.div>
 
         <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
           {features.map((feature, index) => (
             <motion.div
               key={feature.title}
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.6, delay: index * 0.1 }}
             >
               <Card className="p-6 h-full hover:shadow-lg transition-shadow bg-card border-border">
                 <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                   <feature.icon className="w-7 h-7 text-primary" />
                 </div>
                 <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                 <p className="text-muted-foreground leading-relaxed">
                   {feature.description}
                 </p>
               </Card>
             </motion.div>
           ))}
         </div>
       </div>
     </section>
   );
 };
 
 export default Features;