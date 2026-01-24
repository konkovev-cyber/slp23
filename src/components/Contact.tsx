 import { motion } from "framer-motion";
 import { Card } from "@/components/ui/card";
 import { Input } from "@/components/ui/input";
 import { Textarea } from "@/components/ui/textarea";
 import { Button } from "@/components/ui/button";
 import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";
 
 const Contact = () => {
   return (
     <section id="contacts" className="py-20 bg-background">
       <div className="container mx-auto px-4">
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.6 }}
           className="text-center mb-16"
         >
           <h2 className="text-foreground mb-4">Свяжитесь с нами</h2>
           <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
             Приглашаем на экскурсию или просто ответим на все ваши вопросы
           </p>
         </motion.div>
 
         <div className="grid lg:grid-cols-2 gap-12">
           <motion.div
             initial={{ opacity: 0, x: -30 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.6 }}
             className="space-y-6"
           >
             <Card className="p-6 bg-card border-border">
               <h3 className="text-2xl font-bold text-foreground mb-6">Контактная информация</h3>
               
               <div className="space-y-4">
                 <div className="flex items-start space-x-4">
                   <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                     <MapPin className="w-6 h-6 text-primary" />
                   </div>
                   <div>
                     <h4 className="font-semibold text-foreground mb-1">Адрес</h4>
                     <p className="text-muted-foreground">г. Москва, ул. Примерная, д. 123</p>
                   </div>
                 </div>
 
                 <div className="flex items-start space-x-4">
                   <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                     <Phone className="w-6 h-6 text-accent" />
                   </div>
                   <div>
                     <h4 className="font-semibold text-foreground mb-1">Телефон</h4>
                     <p className="text-muted-foreground">+7 (495) 123-45-67</p>
                     <p className="text-muted-foreground">+7 (495) 765-43-21</p>
                   </div>
                 </div>
 
                 <div className="flex items-start space-x-4">
                   <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                     <Mail className="w-6 h-6 text-success" />
                   </div>
                   <div>
                     <h4 className="font-semibold text-foreground mb-1">Email</h4>
                     <p className="text-muted-foreground">info@lichnost-plus.ru</p>
                   </div>
                 </div>
 
                 <div className="flex items-start space-x-4">
                   <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                     <Clock className="w-6 h-6 text-primary" />
                   </div>
                   <div>
                     <h4 className="font-semibold text-foreground mb-1">Часы работы</h4>
                     <p className="text-muted-foreground">Пн-Пт: 9:00 - 20:00</p>
                     <p className="text-muted-foreground">Сб-Вс: 10:00 - 18:00</p>
                   </div>
                 </div>
               </div>
 
               <div className="mt-6 pt-6 border-t border-border">
                 <h4 className="font-semibold text-foreground mb-3">Мессенджеры</h4>
                 <div className="flex gap-3">
                   <Button variant="outline" size="icon" className="hover:bg-primary hover:text-primary-foreground">
                     <MessageCircle className="w-5 h-5" />
                   </Button>
                   <Button variant="outline" size="icon" className="hover:bg-primary hover:text-primary-foreground">
                     <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                       <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-.962 3.928-1.36 5.212-.168.545-.5.727-.82.745-.696.064-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.781-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.481-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.324-.437.892-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.14.122.099.155.232.171.326.016.093.036.306.02.472z"/>
                     </svg>
                   </Button>
                   <Button variant="outline" size="icon" className="hover:bg-primary hover:text-primary-foreground">
                     <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                       <path d="M12 0c-6.627 0-12 4.975-12 11.111 0 3.497 1.745 6.616 4.472 8.652v4.237l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.111 0-6.136-5.373-11.111-12-11.111zm1.193 14.963l-3.056-3.259-5.963 3.259 6.559-6.963 3.13 3.259 5.889-3.259-6.559 6.963z"/>
                     </svg>
                   </Button>
                 </div>
               </div>
             </Card>
           </motion.div>
 
           <motion.div
             initial={{ opacity: 0, x: 30 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.6 }}
           >
             <Card className="p-6 bg-card border-border">
               <h3 className="text-2xl font-bold text-foreground mb-6">Записаться на экскурсию</h3>
               
               <form className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-foreground mb-2">
                     Ваше имя *
                   </label>
                   <Input 
                     placeholder="Иван Иванов" 
                     className="bg-background border-input"
                   />
                 </div>
 
                 <div>
                   <label className="block text-sm font-medium text-foreground mb-2">
                     Телефон *
                   </label>
                   <Input 
                     type="tel" 
                     placeholder="+7 (___) ___-__-__" 
                     className="bg-background border-input"
                   />
                 </div>
 
                 <div>
                   <label className="block text-sm font-medium text-foreground mb-2">
                     Email
                   </label>
                   <Input 
                     type="email" 
                     placeholder="example@mail.com" 
                     className="bg-background border-input"
                   />
                 </div>
 
                 <div>
                   <label className="block text-sm font-medium text-foreground mb-2">
                     Возраст ребёнка
                   </label>
                   <Input 
                     type="number" 
                     placeholder="10 лет" 
                     className="bg-background border-input"
                   />
                 </div>
 
                 <div>
                   <label className="block text-sm font-medium text-foreground mb-2">
                     Сообщение
                   </label>
                   <Textarea 
                     placeholder="Расскажите об интересах вашего ребёнка..." 
                     rows={4}
                     className="bg-background border-input"
                   />
                 </div>
 
                 <Button 
                   type="submit" 
                   className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                   size="lg"
                 >
                   Отправить заявку
                 </Button>
 
                 <p className="text-xs text-muted-foreground text-center">
                   Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности
                 </p>
               </form>
             </Card>
           </motion.div>
         </div>
       </div>
     </section>
   );
 };
 
 export default Contact;