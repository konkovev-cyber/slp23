import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Quote } from "lucide-react";
 
 const testimonials = [
   {
     id: 1,
     name: "Елена Петрова",
     role: "Мама ученика 3 класса",
     image: "/placeholder.svg",
     text: "Моя дочь занимается в школе уже второй год. Заметны огромные изменения в её развитии - она стала более уверенной, любознательной. Педагоги умеют найти подход к каждому ребенку!",
   },
   {
     id: 2,
     name: "Дмитрий Иванов",
     role: "Отец ученика 5 класса",
     image: "/placeholder.svg",
     text: "Отличная школа с индивидуальным подходом. Сын с удовольствием посещает занятия. Особенно нравятся проектные работы и кружки по робототехнике. Рекомендую всем!",
   },
   {
     id: 3,
     name: "Анна Смирнова",
     role: "Ученица 7 класса",
     image: "/placeholder.svg",
     text: "Здесь я нашла настоящих друзей и любимые занятия. Учителя всегда помогут и поддержат. Мне очень нравится атмосфера школы и разнообразие кружков!",
   },
   {
     id: 4,
     name: "Сергей Козлов",
     role: "Папа ученика 4 класса",
     image: "/placeholder.svg",
     text: "Прекрасная альтернатива обычной школе. Малые группы позволяют уделять больше внимания каждому ребенку. Сын стал более самостоятельным и ответственным.",
   },
   {
     id: 5,
     name: "Мария Волкова",
     role: "Мама ученицы 6 класса",
     image: "/placeholder.svg",
     text: "Очень довольны выбором этой школы! Дочь получает качественное образование и развивается всесторонне. Отдельное спасибо психологу за профессиональную поддержку.",
   },
 ];
 
  const Testimonials = () => {
   return (
     <section className="py-20 bg-muted/30" id="testimonials">
       <div className="container mx-auto px-4">
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.5 }}
           className="text-center mb-12"
         >
           <h2 className="text-4xl font-bold text-foreground mb-4">
             Отзывы родителей и учеников
           </h2>
           <p className="text-muted-foreground max-w-2xl mx-auto">
             Узнайте, что говорят о нас те, кто уже выбрал «Личность ПЛЮС»
           </p>
         </motion.div>
 
          <div className="max-w-6xl mx-auto">
            <div className="text-sm text-muted-foreground mb-3">
              Прокрутите вправо, чтобы посмотреть остальные отзывы
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
              {testimonials.map((t, idx) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: idx * 0.05 }}
                  className="snap-start shrink-0 basis-full sm:basis-1/2 md:basis-1/3"
                >
                  <Card className="p-6 bg-card shadow-lg relative h-full">
                    <Quote className="absolute top-5 right-5 w-10 h-10 text-primary/20" />

                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="w-12 h-12 border-4 border-primary/20">
                        <AvatarImage src={t.image} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                          {t.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-foreground leading-tight">{t.name}</div>
                        <div className="text-sm text-muted-foreground">{t.role}</div>
                      </div>
                    </div>

                    <p className="text-foreground/90 italic leading-relaxed">"{t.text}"</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
       </div>
     </section>
   );
 };
 
 export default Testimonials;