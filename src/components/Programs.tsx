import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Palette, Calculator, Globe, Music, Dumbbell, ChevronRight } from "lucide-react";
import programsImage from "@/assets/programs.jpg";

const programs = [
  { icon: BookOpen, title: "Литература", age: "6-10 лет", description: "Развитие навыков чтения и любви к книгам", color: "text-primary border-primary/20 bg-primary/10" },
  { icon: Calculator, title: "Математика", age: "7-14 лет", description: "Логическое мышление через игры и задачи", color: "text-accent border-accent/20 bg-accent/10" },
  { icon: Globe, title: "Английский", age: "6-16 лет", description: "Изучение языка с преподавателями высокого уровня", color: "text-success border-success/20 bg-success/10" },
  { icon: Palette, title: "Искусство", age: "6-16 лет", description: "Живопись, графика и творческое развитие", color: "text-primary border-primary/20 bg-primary/10" },
];

const Programs = () => {
  return (
    <section id="programs" className="py-32 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="text-primary font-black tracking-[0.3em] uppercase text-xs mb-4 block">Обучение</span>
          <h2 className="text-4xl md:text-6xl font-black text-foreground mb-6 tracking-tighter">Образовательные программы</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Широкий выбор направлений для гармоничного развития вашего ребёнка.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16">
          <div className="grid sm:grid-cols-2 gap-8">
            {programs.map((program, index) => (
              <motion.div
                key={program.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="glass-card p-10 h-full rounded-[3rem] group hover:bg-primary/5 transition-all shadow-xl">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 border ${program.color} group-hover:scale-110 transition-transform`}>
                    <program.icon className="w-8 h-8" />
                  </div>
                  <Badge className="bg-muted text-muted-foreground border-border rounded-lg mb-4 font-black px-3 py-1 uppercase text-[10px] tracking-wider">{program.age}</Badge>
                  <h4 className="text-2xl font-black text-foreground mb-4 tracking-tight group-hover:text-primary transition-colors">{program.title}</h4>
                  <p className="text-muted-foreground leading-relaxed font-medium">{program.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="sticky top-32 space-y-8">
              <div className="relative rounded-[3.5rem] overflow-hidden border border-border shadow-2xl group">
                <img src={programsImage} alt="Дети" className="w-full h-96 object-cover brightness-100 group-hover:scale-105 transition-all duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
              </div>

              <div className="glass-card p-12 rounded-[3.5rem] border-primary/20 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full" />
                <h3 className="text-3xl font-black text-foreground mb-4 leading-tight">Индивидуальный план</h3>
                <p className="text-muted-foreground text-lg mb-10 leading-relaxed font-medium">
                  Мы поможем подобрать программу, которая максимально раскроет потенциал именно вашего ребенка.
                </p>
                <Button className="w-full h-18 rounded-full bg-primary text-white hover:bg-primary/90 font-black text-lg group shadow-xl shadow-primary/20">
                  Бесплатная консультация <ChevronRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Programs;