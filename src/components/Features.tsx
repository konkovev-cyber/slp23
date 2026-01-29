import { motion } from "framer-motion";
import { GraduationCap, Users, ShieldCheck, Trophy, Sparkles, Clock, MapPin, Zap } from "lucide-react";

const features = [
  {
    icon: GraduationCap,
    title: "Программа обучения",
    description: "Углубленное изучение математики, физики и английского языка по авторским методикам.",
  },
  {
    icon: Users,
    title: "Малые классы",
    description: "Наполняемость групп до 16 человек позволяет уделить внимание каждому ученику.",
  },
  {
    icon: ShieldCheck,
    title: "Безопасность 24/7",
    description: "Закрытый кампус с видеонаблюдением и современной системой контроля доступа.",
  },
  {
    icon: Zap,
    title: "Soft Skills",
    description: "Развиваем эмоциональный интеллект, умение работать в команде и креативность.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-20 bg-background relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-primary font-bold tracking-widest uppercase text-[11px] mb-3 block">Наши преимущества</span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight">Почему выбирают нас</h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-8 rounded-2xl group hover:border-primary/30 transition-all cursor-default"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                <feature.icon className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-lg font-bold mb-3 leading-tight">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
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