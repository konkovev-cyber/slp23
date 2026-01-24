 import { motion } from "framer-motion";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Calendar, Users, Award } from "lucide-react";
 
 const newsItems = [
   {
     id: 1,
     title: "Победа наших учеников на региональной олимпиаде",
     description: "Ученики 5 и 6 классов заняли призовые места на региональной олимпиаде по математике и естественным наукам.",
     date: "15 января 2026",
     category: "Достижения",
     icon: Award,
     image: "/placeholder.svg",
   },
   {
     id: 2,
     title: "Новогодний праздник «Волшебная зима»",
     description: "25 декабря состоялся традиционный новогодний праздник с участием всех учеников школы, их родителей и педагогов.",
     date: "25 декабря 2025",
     category: "Мероприятия",
     icon: Users,
     image: "/placeholder.svg",
   },
   {
     id: 3,
     title: "Открытие нового кружка по робототехнике",
     description: "С нового семестра начинает работу кружок по робототехнике для детей 8-14 лет. Записаться можно уже сейчас!",
     date: "10 января 2026",
     category: "Анонсы",
     icon: Calendar,
     image: "/placeholder.svg",
   },
   {
     id: 4,
     title: "День открытых дверей",
     description: "Приглашаем всех желающих познакомиться с нашей школой 3 февраля. Вас ждут экскурсия, встреча с педагогами и мастер-классы.",
     date: "3 февраля 2026",
     category: "Анонсы",
     icon: Calendar,
     image: "/placeholder.svg",
   },
   {
     id: 5,
     title: "Проектная неделя «Наука и творчество»",
     description: "Ученики 4-7 классов представили свои проекты на тему интеграции науки и искусства. Проекты поразили жюри своей креативностью!",
     date: "20 декабря 2025",
     category: "Достижения",
     icon: Award,
     image: "/placeholder.svg",
   },
   {
     id: 6,
     title: "Экскурсия в музей космонавтики",
     description: "Ученики 3-5 классов посетили музей космонавтики и планетарий. Дети узнали много нового о космосе и истории освоения космоса.",
     date: "18 декабря 2025",
     category: "Мероприятия",
     icon: Users,
     image: "/placeholder.svg",
   },
 ];
 
 const categoryColors: Record<string, string> = {
   "Достижения": "bg-green-500/10 text-green-700 border-green-500/20",
   "Мероприятия": "bg-blue-500/10 text-blue-700 border-blue-500/20",
   "Анонсы": "bg-orange-500/10 text-orange-700 border-orange-500/20",
 };
 
 const News = () => {
   return (
     <section className="py-20 bg-background" id="news">
       <div className="container mx-auto px-4">
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.5 }}
           className="text-center mb-12"
         >
           <h2 className="text-4xl font-bold text-foreground mb-4">
             Новости и события
           </h2>
           <p className="text-muted-foreground max-w-2xl mx-auto">
             Последние новости, анонсы мероприятий и достижения наших учеников
           </p>
         </motion.div>
 
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {newsItems.map((item, index) => {
             const Icon = item.icon;
             return (
               <motion.div
                 key={item.id}
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.5, delay: index * 0.1 }}
               >
                 <Card className="h-full hover:shadow-lg transition-all duration-300 group cursor-pointer overflow-hidden">
                   <div className="relative h-48 overflow-hidden bg-muted">
                     <img
                       src={item.image}
                       alt={item.title}
                       className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                     />
                     <div className="absolute top-4 left-4">
                       <Badge className={categoryColors[item.category] || "bg-primary/10 text-primary"}>
                         {item.category}
                       </Badge>
                     </div>
                   </div>
                   
                   <CardHeader>
                     <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                       <Icon className="w-4 h-4" />
                       <span>{item.date}</span>
                     </div>
                     <CardTitle className="group-hover:text-primary transition-colors">
                       {item.title}
                     </CardTitle>
                   </CardHeader>
                   
                   <CardContent>
                     <CardDescription className="line-clamp-3">
                       {item.description}
                     </CardDescription>
                   </CardContent>
                 </Card>
               </motion.div>
             );
           })}
         </div>
       </div>
     </section>
   );
 };
 
 export default News;