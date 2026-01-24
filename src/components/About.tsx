 import { motion } from "framer-motion";
 import { Card } from "@/components/ui/card";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Award, Building2, BookOpen } from "lucide-react";
import facilitiesClassroomImage from "@/assets/facilities-classroom.jpg";
import facilitiesHallImage from "@/assets/facilities-hall.jpg";
import directorKianImage from "@/assets/director-kian.jpg";
 
 const About = () => {
   return (
     <section id="about" className="py-20 bg-background">
       <div className="container mx-auto px-4">
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.6 }}
           className="text-center mb-16"
         >
           <h2 className="text-foreground mb-4">О нашей школе</h2>
           <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
             «Личность ПЛЮС» — это пространство, где академические знания сочетаются с развитием 
             soft skills, творческим мышлением и эмоциональным интеллектом
           </p>
         </motion.div>
 
         <div className="grid lg:grid-cols-2 gap-12 items-center">
           <motion.div
             initial={{ opacity: 0, x: -30 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.6 }}
           >
             <img
                src={facilitiesClassroomImage}
               alt="Современные классы школы"
               className="rounded-2xl shadow-xl w-full"
             />
           </motion.div>
 
           <motion.div
             initial={{ opacity: 0, x: 30 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.6 }}
           >
             <Tabs defaultValue="about" className="w-full">
               <TabsList className="grid w-full grid-cols-3 mb-8">
                 <TabsTrigger value="about">О школе</TabsTrigger>
                 <TabsTrigger value="facilities">Оснащение</TabsTrigger>
                 <TabsTrigger value="leadership">Руководство</TabsTrigger>
               </TabsList>
 
               <TabsContent value="about" className="space-y-4">
                 <Card className="p-6 bg-card border-border">
                   <div className="flex items-start space-x-4">
                     <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                       <Award className="w-6 h-6 text-primary" />
                     </div>
                     <div>
                       <h4 className="font-bold text-foreground mb-2">Лицензия и аккредитация</h4>
                       <p className="text-muted-foreground">
                         Образовательная лицензия № 12345 от 15.09.2020. 
                         Все программы соответствуют ФГОС.
                       </p>
                     </div>
                   </div>
                 </Card>
 
                 <Card className="p-6 bg-card border-border">
                   <div className="flex items-start space-x-4">
                     <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                       <BookOpen className="w-6 h-6 text-accent" />
                     </div>
                     <div>
                       <h4 className="font-bold text-foreground mb-2">Наша миссия</h4>
                       <p className="text-muted-foreground">
                         Создать среду, в которой каждый ребёнок сможет раскрыть свой потенциал, 
                         развить критическое мышление и стать успешной, гармоничной личностью.
                       </p>
                     </div>
                   </div>
                 </Card>
               </TabsContent>
 
               <TabsContent value="facilities" className="space-y-4">
				  <Card className="p-6 bg-card border-border">
				    <div className="grid gap-4 sm:grid-cols-2">
				      <img
				        src={facilitiesClassroomImage}
				        alt="Учебный класс школы"
				        className="w-full rounded-xl"
				        loading="lazy"
				      />
				      <img
				        src={facilitiesHallImage}
				        alt="Зал для занятий и тренировок"
				        className="w-full rounded-xl"
				        loading="lazy"
				      />
				    </div>
				  </Card>

                 <Card className="p-6 bg-card border-border">
                   <div className="flex items-start space-x-4">
                     <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                       <Building2 className="w-6 h-6 text-success" />
                     </div>
                     <div>
                       <h4 className="font-bold text-foreground mb-2">Современное оборудование</h4>
                       <p className="text-muted-foreground">
                         Интерактивные доски, компьютерные классы, творческие мастерские, 
                         библиотека, спортивный зал и зоны для отдыха.
                       </p>
                     </div>
                   </div>
                 </Card>
 
                 <Card className="p-6 bg-card border-border">
                   <h4 className="font-bold text-foreground mb-3">Комфортная среда</h4>
                   <p className="text-muted-foreground">
                     Просторные светлые классы, удобная мебель, зоны для индивидуальной 
                     и групповой работы. Безопасность обеспечивается системой видеонаблюдения.
                   </p>
                 </Card>
               </TabsContent>
 
               <TabsContent value="leadership" className="space-y-4">
                 <Card className="p-6 bg-card border-border">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
                      <img
                        src={directorKianImage}
                        alt="Директор школы — Киян Юлия Юрьевна"
                        className="w-full max-w-[220px] rounded-xl object-cover"
                        loading="lazy"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-foreground mb-2">Директор школы</h4>
                        <p className="text-muted-foreground mb-2">
                          <strong className="text-foreground">Киян Юлия Юрьевна</strong>
                        </p>
                      </div>
                    </div>
                 </Card>
 
                 <Card className="p-6 bg-card border-border">
                   <h4 className="font-bold text-foreground mb-3">Методист</h4>
                   <p className="text-muted-foreground mb-2">
                     <strong className="text-foreground">Смирнова Анна Викторовна</strong>
                   </p>
                   <p className="text-muted-foreground">
                     Эксперт по инновационным образовательным технологиям, 
                     автор учебных программ для детей младшего школьного возраста.
                   </p>
                 </Card>
               </TabsContent>
             </Tabs>
           </motion.div>
         </div>
       </div>
     </section>
   );
 };
 
 export default About;