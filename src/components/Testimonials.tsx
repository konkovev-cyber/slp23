import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Quote } from "lucide-react";

const testimonials = [
  { id: 1, name: "Елена П.", role: "Мама ученика 3 класса", text: "Моя дочь занимается в школе уже второй год. Заметны огромные изменения — она стала более уверенной и любознательной. Педагоги просто замечательные!" },
  { id: 2, name: "Дмитрий И.", role: "Отец ученика 5 класса", text: "Отличная школа с индивидуальным подходом. Сын с удовольствием посещает занятия, особенно робототехнику. Уровень знаний растет!" },
  { id: 3, name: "Мария В.", role: "Мама ученицы 6 класса", text: "Дочь получает качественное образование и развивается всесторонне. Отдельное спасибо за психологическую поддержку и внимание к каждому." },
  { id: 4, name: "Анна С.", role: "Ученица 7 класса", text: "Здесь я нашла настоящих друзей. Учителя всегда помогут и поддержат. Обожаю атмосферу нашей школы и перемены в холле!" },
];

const Testimonials = () => {
  return (
    <section className="py-32 bg-background relative overflow-hidden" id="testimonials">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-24"
        >
          <span className="text-primary font-black tracking-[0.3em] uppercase text-xs mb-4 block">Голоса сообщества</span>
          <h2 className="text-4xl md:text-6xl font-black text-foreground mb-6 tracking-tighter">Что говорят о нас</h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {testimonials.map((t, idx) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
            >
              <div className="glass-card p-10 rounded-[3rem] h-full relative group hover:border-primary/30 transition-all flex flex-col shadow-xl">
                <Quote className="text-primary/10 w-16 h-16 absolute top-8 right-8 group-hover:text-primary/20 transition-colors" />

                <div className="relative mb-10">
                  <Avatar className="w-20 h-20 border-4 border-background shadow-xl scale-110 group-hover:scale-125 transition-transform duration-500">
                    <AvatarFallback className="bg-primary text-white text-2xl font-black">
                      {t.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <p className="text-foreground/80 italic leading-relaxed mb-10 flex-grow font-medium text-lg">"{t.text}"</p>

                <div className="pt-8 border-t border-border">
                  <div className="font-black text-foreground text-xl tracking-tight">{t.name}</div>
                  <div className="text-primary font-black text-[10px] uppercase tracking-widest mt-1">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Background Glow */}
      <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-[800px] h-[800px] bg-accent/5 blur-[150px] rounded-full" />
    </section>
  );
};

export default Testimonials;