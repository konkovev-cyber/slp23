import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
 import { Calendar, Users, Award, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { extractFirstImageUrl } from "@/lib/news-images";
 
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
 ];
 
 const categoryColors: Record<string, string> = {
   "Достижения": "bg-green-500/10 text-green-700 border-green-500/20",
   "Мероприятия": "bg-blue-500/10 text-blue-700 border-blue-500/20",
   "Анонсы": "bg-orange-500/10 text-orange-700 border-orange-500/20",
 };

  type PostPreview = {
    id: string;
    title: string;
    slug: string;
    category: string;
    excerpt: string | null;
    image_url: string | null;
    content: string;
    published_at: string;
  };
 
 const News = () => {
     const [scrollIndex, setScrollIndex] = useState(0);

    const { data: posts = [] } = useQuery({
      queryKey: ["posts", "home_preview"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("posts")
           .select("id,title,slug,category,excerpt,image_url,content,published_at")
          .order("published_at", { ascending: false })
            .limit(8);
        if (error) throw error;
        return (data ?? []) as PostPreview[];
      },
    });

      const allItems = useMemo(() => {
        if (!posts.length) {
          return newsItems.map((i) => ({
            ...i,
            href: "/news",
          }));
        }
        return posts.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.excerpt ?? "Открыть новость",
          date: format(new Date(p.published_at), "d MMMM yyyy", { locale: ru }),
          category: p.category,
          icon: Calendar,
           image:
             p.image_url ??
             extractFirstImageUrl(p.content ?? "") ??
             "/placeholder.svg",
          href: `/news/${p.slug}`,
        }));
      }, [posts]);
 
     const displayItems = useMemo(() => {
       return allItems.slice(scrollIndex, scrollIndex + 4);
     }, [allItems, scrollIndex]);
 
     const canScrollLeft = scrollIndex > 0;
     const canScrollRight = scrollIndex + 4 < allItems.length;
 
     const handleScroll = (direction: 'left' | 'right') => {
       if (direction === 'left') {
         setScrollIndex(Math.max(0, scrollIndex - 1));
       } else {
         setScrollIndex(Math.min(allItems.length - 4, scrollIndex + 1));
       }
     };

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
            <div className="flex flex-col items-center gap-4">
              <h2 className="text-4xl font-bold text-foreground">Новости и события</h2>
              <Link to="/news" className="text-primary hover:underline">
                Все новости →
              </Link>
            </div>
           <p className="text-muted-foreground max-w-2xl mx-auto">
             Последние новости, анонсы мероприятий и достижения наших учеников
           </p>
         </motion.div>
 
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             {displayItems.map((item, index) => {
             const Icon = item.icon;
             return (
               <motion.div
                 key={item.id}
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.5, delay: index * 0.1 }}
               >
                   <Link to={item.href} className="block">
                     <Card className="h-full hover:shadow-lg transition-all duration-300 group cursor-pointer overflow-hidden">
                    <div className="relative h-36 overflow-hidden bg-muted">
                     <img
                       src={item.image}
                       alt={item.title}
                       className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        decoding="async"
                     />
                     <div className="absolute top-4 left-4">
                       <Badge className={categoryColors[item.category] || "bg-primary/10 text-primary"}>
                         {item.category}
                       </Badge>
                     </div>
                   </div>
                   
                    <CardHeader className="py-4">
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
                  </Link>
               </motion.div>
             );
           })}
         </div>

           {allItems.length > 4 && (
             <div className="mt-8 flex justify-center items-center gap-3">
               <Button
                 type="button"
                 variant="outline"
                 size="icon"
                 onClick={() => handleScroll('left')}
                 disabled={!canScrollLeft}
                 className="rounded-full"
               >
                 <ChevronLeft className="h-4 w-4" />
               </Button>
               <div className="text-sm text-muted-foreground">
                 {scrollIndex + 1}-{Math.min(scrollIndex + 4, allItems.length)} из {allItems.length}
               </div>
               <Button
                 type="button"
                 variant="outline"
                 size="icon"
                 onClick={() => handleScroll('right')}
                 disabled={!canScrollRight}
                 className="rounded-full"
               >
                 <ChevronRight className="h-4 w-4" />
               </Button>
            </div>
         )}
        </div>
      </section>
    );
  };
  
  export default News;