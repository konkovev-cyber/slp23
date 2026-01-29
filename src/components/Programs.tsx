import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Palette, Calculator, Globe, ChevronRight } from "lucide-react";
import programsImage from "@/assets/programs.jpg";

const programs = [
  { icon: BookOpen, title: "Литература", age: "6-10 лет", description: "Развитие навыков чтения и любви к книгам через классику.", color: "text-primary border-primary/20 bg-primary/5" },
  { icon: Calculator, title: "Математика", age: "7-14 лет", description: "Логическое мышление через интерактивные задачи.", color: "text-accent border-accent/20 bg-accent/5" },
  { icon: Globe, title: "Английский", age: "6-16 лет", description: "Изучение языка с фокусом на живое общение.", color: "text-green-600 border-green-600/20 bg-green-600/5" },
  { icon: Palette, title: "Искусство", age: "6-16 лет", description: "Живопись и творчество для самовыражения ребенка.", color: "text-primary border-primary/20 bg-primary/5" },
];

const Programs = () => {
  return (
    <section id="programs" className="py-20 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-primary font-bold tracking-widest uppercase text-[11px] mb-3 block">Образование</span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">Учебные программы</h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto font-medium">
            Сбалансированный подход к основным предметам и творческому развитию.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-4">
            {programs.map((program, index) => (
              <motion.div
                key={program.title}
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="glass-card p-6 h-full rounded-xl group hover:border-primary/30 transition-all shadow-sm bg-white/50 dark:bg-card/40">
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center mb-5 border ${program.color}`}>
                    <program.icon className="w-5 h-5" />
                  </div>
                  <Badge className="bg-muted/50 text-muted-foreground border-transparent rounded-md mb-3 font-bold uppercase text-[9px] tracking-wider px-2 py-0.5">{program.age}</Badge>
                  <h4 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors tracking-tight">{program.title}</h4>
                  <p className="text-[13px] text-muted-foreground leading-relaxed font-medium">{program.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="relative rounded-xl overflow-hidden border border-border shadow-md aspect-video group">
              <img src={programsImage} alt="Students" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            <div className="glass-card p-8 rounded-xl border-primary/10 relative overflow-hidden shadow-sm bg-primary/5">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-3xl rounded-full" />
              <h3 className="text-xl font-bold text-foreground mb-3 tracking-tight">Индивидуальный план</h3>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed font-medium">
                Поможем подобрать программу, которая максимально раскроет потенциал вашего ребенка.
              </p>
              <Button className="w-full h-11 rounded-full bg-primary text-white hover:bg-primary/90 font-bold text-sm shadow-sm transition-all shadow-primary/10">
                Запросить консультацию <ChevronRight className="ml-1.5 w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Programs;