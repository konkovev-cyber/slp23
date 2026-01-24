 import { motion } from "framer-motion";
 import { Card } from "@/components/ui/card";
 import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
 import { useState } from "react";
 import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
 import { Button } from "@/components/ui/button";
 
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
   const [currentIndex, setCurrentIndex] = useState(0);
 
   const nextSlide = () => {
     setCurrentIndex((prev) => (prev + 1) % testimonials.length);
   };
 
   const prevSlide = () => {
     setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
   };
 
   const goToSlide = (index: number) => {
     setCurrentIndex(index);
   };
 
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
 
         <div className="relative max-w-4xl mx-auto">
           {/* Main Testimonial Card */}
           <motion.div
             key={currentIndex}
             initial={{ opacity: 0, x: 100 }}
             animate={{ opacity: 1, x: 0 }}
             exit={{ opacity: 0, x: -100 }}
             transition={{ duration: 0.5 }}
           >
             <Card className="p-8 md:p-12 bg-card shadow-lg relative">
               <Quote className="absolute top-6 right-6 w-12 h-12 text-primary/20" />
               
               <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-6">
                 <Avatar className="w-20 h-20 border-4 border-primary/20">
                   <AvatarImage src={testimonials[currentIndex].image} />
                   <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                     {testimonials[currentIndex].name.charAt(0)}
                   </AvatarFallback>
                 </Avatar>
                 
                 <div className="text-center md:text-left">
                   <h3 className="text-xl font-bold text-foreground">
                     {testimonials[currentIndex].name}
                   </h3>
                   <p className="text-muted-foreground">
                     {testimonials[currentIndex].role}
                   </p>
                 </div>
               </div>
 
               <p className="text-lg text-foreground/90 italic leading-relaxed">
                 "{testimonials[currentIndex].text}"
               </p>
             </Card>
           </motion.div>
 
           {/* Navigation Buttons */}
           <div className="flex items-center justify-center gap-4 mt-8">
             <Button
               variant="outline"
               size="icon"
               onClick={prevSlide}
               className="rounded-full"
             >
               <ChevronLeft className="w-5 h-5" />
             </Button>
 
             {/* Dots */}
             <div className="flex gap-2">
               {testimonials.map((_, index) => (
                 <button
                   key={index}
                   onClick={() => goToSlide(index)}
                   className={`w-3 h-3 rounded-full transition-all ${
                     index === currentIndex
                       ? "bg-primary w-8"
                       : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                   }`}
                 />
               ))}
             </div>
 
             <Button
               variant="outline"
               size="icon"
               onClick={nextSlide}
               className="rounded-full"
             >
               <ChevronRight className="w-5 h-5" />
             </Button>
           </div>
         </div>
       </div>
     </section>
   );
 };
 
 export default Testimonials;