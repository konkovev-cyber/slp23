import { motion } from "framer-motion";
import { GraduationCap, Users, ShieldCheck, Zap } from "lucide-react";

const features = [
  {
    icon: GraduationCap,
    title: "Методика",
    description: "Углубленное изучение предметов по авторским методикам развития личности.",
    color: "primary"
  },
  {
    icon: Users,
    title: "Малые классы",
    description: "До 16 человек в группе для индивидуального подхода к каждому ребенку.",
    color: "accent"
  },
  {
    icon: ShieldCheck,
    title: "Безопасность",
    description: "Закрытый кампус с видеонаблюдением и современной системой контроля.",
    color: "primary"
  },
  {
    icon: Zap,
    title: "Soft Skills",
    description: "Развиваем лидерство, креатив и умение работать в команде.",
    color: "accent"
  },
];

const Features = () => {
  return (
    <section id="features" className="py-20 bg-background relative overflow-hidden" aria-label="Наши преимущества">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-primary font-bold tracking-widest uppercase text-[10px] mb-2 block font-bold">Особенности</span>
          <h2 className="text-3xl md:text-5xl font-black text-foreground tracking-tighter">Почему выбирают нас</h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="glass-card p-6 rounded-2xl group hover:border-primary/20 transition-all border-border/50 shadow-sm flex flex-col items-center text-center"
            >
              <div className="w-11 h-11 bg-muted rounded-xl flex items-center justify-center mb-5 group-hover:bg-primary/10 transition-colors border border-border/50">
                <feature.icon className="w-5 h-5 text-foreground/60 group-hover:text-primary transition-colors" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold mb-2 tracking-tight">{feature.title}</h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed font-medium">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;