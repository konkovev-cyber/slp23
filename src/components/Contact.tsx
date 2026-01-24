 import { useState } from "react";
 import { motion } from "framer-motion";
 import { Card } from "@/components/ui/card";
 import { Input } from "@/components/ui/input";
 import { Textarea } from "@/components/ui/textarea";
 import { Button } from "@/components/ui/button";
 import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
 import { useToast } from "@/hooks/use-toast";
 import { SiWhatsapp, SiTelegram } from "react-icons/si";
 
 const Contact = () => {
   const { toast } = useToast();
   const [formData, setFormData] = useState({
     name: "",
     phone: "",
     email: "",
     age: "",
     message: "",
   });
 
   const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     toast({
       title: "Заявка отправлена!",
       description: "Мы свяжемся с вами в ближайшее время.",
     });
     setFormData({ name: "", phone: "", email: "", age: "", message: "" });
   };
 
   const sendToWhatsApp = () => {
     const message = encodeURIComponent(
       `Здравствуйте! Меня зовут ${formData.name || '[Имя]'}. Хочу записаться на экскурсию. ${formData.message || ''}`
     );
     window.open(`https://wa.me/79282619928?text=${message}`, '_blank');
   };
 
   const sendToTelegram = () => {
     window.open('https://t.me/lichnost_PLUS', '_blank');
   };
 
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
           <h2 className="text-4xl font-bold text-foreground mb-4">Контакты</h2>
           <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
             Мы всегда рады ответить на ваши вопросы. Свяжитесь с нами удобным способом!
           </p>
           
           {/* Quick Contact Buttons */}
           <div className="flex flex-wrap justify-center gap-4 mt-8">
             <Button
               onClick={sendToWhatsApp}
               className="bg-[#25D366] hover:bg-[#20BD5A] text-white gap-2"
               size="lg"
             >
               <SiWhatsapp className="w-5 h-5" />
               Написать в WhatsApp
             </Button>
             <Button
               onClick={sendToTelegram}
               className="bg-[#0088cc] hover:bg-[#0077b5] text-white gap-2"
               size="lg"
             >
               <SiTelegram className="w-5 h-5" />
               Написать в Telegram
             </Button>
           </div>
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
                     <p className="text-muted-foreground">
                       Краснодарский край, город Горячий Ключ,
                       <br />
                       переулок Школьный, дом 27
                     </p>
                   </div>
                 </div>
 
                 <div className="flex items-start space-x-4">
                   <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                     <Phone className="w-6 h-6 text-accent" />
                   </div>
                   <div>
                     <h4 className="font-semibold text-foreground mb-1">Телефон</h4>
                     <a 
                       href="tel:+79282619928"
                       className="text-muted-foreground hover:text-primary transition-colors"
                     >
                       +7 (928) 261-99-28
                     </a>
                   </div>
                 </div>
 
                 <div className="flex items-start space-x-4">
                   <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                     <Mail className="w-6 h-6 text-success" />
                   </div>
                   <div>
                     <h4 className="font-semibold text-foreground mb-1">Email</h4>
                     <a
                       href="mailto:slichnost5@mail.ru"
                       className="text-muted-foreground hover:text-primary transition-colors"
                     >
                       slichnost5@mail.ru
                     </a>
                   </div>
                 </div>
 
                 <div className="flex items-start space-x-4">
                   <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                     <Clock className="w-6 h-6 text-primary" />
                   </div>
                   <div>
                     <h4 className="font-semibold text-foreground mb-1">Часы работы</h4>
                     <p className="text-muted-foreground">Понедельник - Пятница: 08:00 - 17:00</p>
                     <p className="text-muted-foreground text-sm">Выходные: суббота, воскресенье</p>
                   </div>
                 </div>
               </div>
 
             </Card>
             
             {/* Yandex Map */}
             <Card className="p-0 overflow-hidden">
               <div className="w-full h-[300px]">
                 <iframe
                   src="https://yandex.ru/map-widget/v1/?um=constructor%3A8e3d4f5c6b7a8d9e0f1a2b3c4d5e6f7a&amp;source=constructor"
                   width="100%"
                   height="300"
                   frameBorder="0"
                   title="Карта расположения школы"
                 />
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
               
               <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-foreground mb-2">
                     Ваше имя *
                   </label>
                   <Input 
                     placeholder="Иван Иванов" 
                     className="bg-background border-input"
                     value={formData.name}
                     onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                     required
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
                     value={formData.phone}
                     onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                     required
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
                     value={formData.email}
                     onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                     value={formData.age}
                     onChange={(e) => setFormData({ ...formData, age: e.target.value })}
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
                     value={formData.message}
                     onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                   />
                 </div>
 
                 <Button 
                   type="submit" 
                   className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                   size="lg"
                 >
                   <Send className="w-4 h-4 mr-2" />
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