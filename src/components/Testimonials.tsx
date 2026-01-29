import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Quote } from "lucide-react";

const testimonials = [
  { id: 1, name: "Елена П.", role: "Мама ученика 3 кл.", text: "Заметны огромные изменения — дочь стала более уверенной и любознательной. Педагоги просто замечательные!" },
  { id: 2, name: "Дмитрий И.", role: "Отец ученика 5 кл.", text: "Отличная школа с индивидуальным подходом. Сын с удовольствием посещает занятия, уровень знаний растет." },
  { id: 3, name: "Мария В.", role: "Мама ученицы 6 кл.", text: "Дочь получает качественное образование. Отдельное спасибо за психологическую поддержку и внимание." },
  { id: 4, name: "Анна С.", role: "Ученица 7 кл.", text: "Здесь я нашла настоящих друзей. Учителя всегда помогут и поддержат. Обожаю атмосферу школы!" },
];

const Testimonials = () => {
  return (
    <section className="py-20 bg-background relative overflow-hidden" id="testimonials">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-primary font-bold tracking-widest uppercase text-[11px] mb-3 block">Отзывы</span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">Что говорят о нас</h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {testimonials.map((t, idx) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <div className="glass-card p-6 rounded-xl h-full relative group hover:border-primary/20 transition-all flex flex-col shadow-sm bg-white/50 dark:bg-card/30">
                <Quote className="text-primary/5 w-10 h-10 absolute top-6 right-6 group-hover:text-primary/10 transition-colors" />

                <div className="relative mb-6">
                  <Avatar className="w-12 h-12 border-2 border-background shadow-sm">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                      {t.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <p className="text-[13px] text-foreground/80 italic leading-relaxed mb-6 flex-grow font-medium">"{t.text}"</p>

                <div className="pt-4 border-t border-border/50">
                  <div className="font-bold text-foreground text-sm tracking-tight">{t.name}</div>
                  <div className="text-primary/70 font-bold text-[9px] uppercase tracking-wider mt-0.5">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;