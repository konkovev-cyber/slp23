import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { clubs } from "@/lib/clubs";
 
 const Clubs = () => {
    const getClubsByCategory = (category: string) => clubs.filter((club) => club.category === category);
 
    const ClubCard = ({ club, index }: { club: (typeof clubs)[0]; index: number }) => (
     <motion.div
       initial={{ opacity: 0, y: 20 }}
       whileInView={{ opacity: 1, y: 0 }}
       viewport={{ once: true }}
       transition={{ duration: 0.5, delay: index * 0.1 }}
     >
       <Card className="p-6 h-full hover:shadow-lg transition-all bg-card border-border group">
         <div className="flex items-start justify-between mb-4">
           <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
             <club.icon className="w-7 h-7 text-primary group-hover:text-inherit" />
           </div>
           <Badge variant="secondary">{club.age}</Badge>
         </div>
         
         <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
           {club.title}
         </h3>
         
          <p className="text-muted-foreground mb-4">{club.shortDescription}</p>
         
         <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
           <span className="text-sm text-muted-foreground">{club.schedule}</span>
            <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
              <Link to={`/clubs/${club.slug}`}>Подробнее</Link>
            </Button>
         </div>
       </Card>
     </motion.div>
   );
 
   return (
     <section id="clubs" className="py-20 bg-background">
       <div className="container mx-auto px-4">
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.6 }}
           className="text-center mb-12"
         >
           <h2 className="text-foreground mb-4">Кружки и секции</h2>
           <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
             Выберите направление для дополнительного развития вашего ребёнка
           </p>
         </motion.div>
 
         <Tabs defaultValue="all" className="w-full">
           <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 mb-12">
             <TabsTrigger value="all">Все</TabsTrigger>
             <TabsTrigger value="creative">Творчество</TabsTrigger>
             <TabsTrigger value="tech">Технологии</TabsTrigger>
             <TabsTrigger value="educational">Наука</TabsTrigger>
           </TabsList>
 
           <TabsContent value="all" className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
             {clubs.map((club, index) => (
               <ClubCard key={club.title} club={club} index={index} />
             ))}
           </TabsContent>
 
           <TabsContent value="creative" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
             {getClubsByCategory("creative").map((club, index) => (
               <ClubCard key={club.title} club={club} index={index} />
             ))}
           </TabsContent>
 
           <TabsContent value="tech" className="grid md:grid-cols-2 gap-6">
             {getClubsByCategory("tech").map((club, index) => (
               <ClubCard key={club.title} club={club} index={index} />
             ))}
           </TabsContent>
 
           <TabsContent value="educational" className="grid md:grid-cols-2 gap-6">
             {getClubsByCategory("educational").concat(getClubsByCategory("sports")).map((club, index) => (
               <ClubCard key={club.title} club={club} index={index} />
             ))}
           </TabsContent>
         </Tabs>
 
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.6, delay: 0.3 }}
           className="text-center mt-12"
         >
           <Card className="max-w-3xl mx-auto p-8 bg-accent text-accent-foreground">
             <h3 className="text-2xl font-bold mb-3">Бесплатное пробное занятие</h3>
             <p className="mb-6 opacity-90">
               Приходите на любой кружок и попробуйте! Первое занятие совершенно бесплатно.
             </p>
             <Button 
               size="lg" 
               variant="secondary"
               className="bg-accent-foreground text-accent hover:bg-accent-foreground/90"
             >
               Записаться на пробное занятие
             </Button>
           </Card>
         </motion.div>
       </div>
     </section>
   );
 };
 
 export default Clubs;