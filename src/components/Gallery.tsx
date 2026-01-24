 import { useEffect, useMemo, useState } from "react";
 import { motion, AnimatePresence } from "framer-motion";
 import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import gallery1 from "@/assets/gallery/1.jpg";
 import gallery2 from "@/assets/gallery/2.jpg";
 import gallery3 from "@/assets/gallery/3.jpg";
 import gallery4 from "@/assets/gallery/4.jpg";
 import gallery5 from "@/assets/gallery/5.jpg";
 import gallery6 from "@/assets/gallery/6.jpg";
 import gallery7 from "@/assets/gallery/7.jpg";
 import gallery8 from "@/assets/gallery/8.jpg";
 import gallery9 from "@/assets/gallery/9.jpg";
 import gallery10 from "@/assets/gallery/10.jpg";
 import gallery11 from "@/assets/gallery/11.jpg";
 import gallery12 from "@/assets/gallery/12.jpg";
 import gallery13 from "@/assets/gallery/13.jpg";
 import gallery14 from "@/assets/gallery/14.jpg";
 import gallery15 from "@/assets/gallery/15.jpg";
 import gallery16 from "@/assets/gallery/16.jpg";
 import gallery17 from "@/assets/gallery/17.jpg";
 import gallery18 from "@/assets/gallery/18.jpg";
 import gallery19 from "@/assets/gallery/19.jpg";
 import gallery20 from "@/assets/gallery/20.jpg";
 import gallery21 from "@/assets/gallery/21.jpg";
 import gallery22 from "@/assets/gallery/22.jpg";
 import gallery23 from "@/assets/gallery/23.jpg";
 import gallery24 from "@/assets/gallery/24.jpg";
 import gallery25 from "@/assets/gallery/25.jpg";
 import gallery26 from "@/assets/gallery/26.jpg";
 import gallery27 from "@/assets/gallery/27.jpg";
 import gallery28 from "@/assets/gallery/28.jpg";
 import gallery29 from "@/assets/gallery/29.jpg";
 import gallery30 from "@/assets/gallery/30.jpg";
import gallery31 from "@/assets/gallery/31.jpg";
import gallery32 from "@/assets/gallery/32.jpg";
 
 export type GalleryImage = {
   id: number;
   src: string;
   title: string;
   category: string;
 };

 export const galleryImages: GalleryImage[] = [
   {
     id: 1,
     src: gallery1,
     title: "Урок и командная работа",
     category: "Обучение",
   },
   {
     id: 2,
     src: gallery2,
     title: "Занятие в классе",
     category: "Обучение",
   },
   {
     id: 3,
     src: gallery3,
     title: "Эмоции и вовлечённость",
     category: "Школьная жизнь",
   },
   {
     id: 4,
     src: gallery4,
     title: "Командный дух",
     category: "Школьная жизнь",
   },
   {
     id: 5,
     src: gallery5,
     title: "Дружная команда",
     category: "Школьная жизнь",
   },
   {
     id: 6,
     src: gallery6,
     title: "Наши ученики",
     category: "Ученики",
   },
   {
     id: 7,
     src: gallery7,
     title: "Фото на память",
     category: "Ученики",
   },
   {
     id: 8,
     src: gallery8,
     title: "Математика вокруг нас",
     category: "Обучение",
   },
   {
     id: 9,
     src: gallery9,
     title: "Поддержка и наставничество",
     category: "Обучение",
   },
   {
     id: 10,
     src: gallery10,
     title: "Работа с педагогом",
     category: "Обучение",
   },
   {
     id: 11,
     src: gallery11,
     title: "Здание школы",
     category: "Школа",
   },
   {
     id: 12,
     src: gallery12,
     title: "Класс для занятий",
     category: "Школа",
   },
   {
     id: 13,
     src: gallery13,
     title: "Спортивный зал",
     category: "Спорт",
   },
   {
     id: 14,
     src: gallery14,
     title: "Ученик за чтением",
     category: "Обучение",
   },
   {
     id: 15,
     src: gallery15,
     title: "На уроке",
     category: "Ученики",
   },
   {
     id: 16,
     src: gallery16,
     title: "Игра со словами",
     category: "Обучение",
   },
   {
     id: 17,
     src: gallery17,
     title: "Изучаем буквы",
     category: "Обучение",
   },
   {
     id: 18,
     src: gallery18,
     title: "Развивающие игры",
     category: "Обучение",
   },
   {
     id: 19,
     src: gallery19,
     title: "Творчество с красками",
     category: "Творчество",
   },
   {
     id: 20,
     src: gallery20,
     title: "Работа над проектом",
     category: "Обучение",
   },
   {
     id: 21,
     src: gallery21,
     title: "Командная работа",
     category: "Обучение",
   },
   {
     id: 22,
     src: gallery22,
     title: "Занятие с педагогом",
     category: "Обучение",
   },
   {
     id: 23,
     src: gallery23,
     title: "Хореография",
     category: "Творчество",
   },
   {
     id: 24,
     src: gallery24,
     title: "Библиотека",
     category: "Школа",
   },
   {
     id: 25,
     src: gallery25,
     title: "Дружный класс",
     category: "Ученики",
   },
   {
     id: 26,
     src: gallery26,
     title: "Группа с преподавателем",
     category: "Ученики",
   },
   {
     id: 27,
     src: gallery27,
     title: "Первый день в школе",
     category: "Школьная жизнь",
   },
   {
     id: 28,
     src: gallery28,
     title: "Торжественное событие",
     category: "Мероприятия",
   },
   {
     id: 29,
     src: gallery29,
     title: "День знаний",
     category: "Мероприятия",
   },
   {
     id: 30,
     src: gallery30,
     title: "Активные занятия",
     category: "Школьная жизнь",
   },
  {
    id: 31,
    src: gallery31,
    title: "Наш класс",
    category: "Ученики",
  },
  {
    id: 32,
    src: gallery32,
    title: "Момент с мероприятия",
    category: "Мероприятия",
  },
 ];
 
 const Gallery = () => {
   const [selectedImage, setSelectedImage] = useState<number | null>(null);
   const [filter, setFilter] = useState<string>("Все");
 
   const categories = ["Все", ...Array.from(new Set(galleryImages.map(img => img.category)))];
 
    const filteredImages = useMemo(
      () =>
        filter === "Все"
          ? galleryImages
          : galleryImages.filter((img) => img.category === filter),
      [filter]
    );
 
   const openLightbox = (id: number) => {
     setSelectedImage(id);
     document.body.style.overflow = 'hidden';
   };
 
   const closeLightbox = () => {
     setSelectedImage(null);
     document.body.style.overflow = 'unset';
   };
 
    const activeIndex = selectedImage
      ? filteredImages.findIndex((img) => img.id === selectedImage)
      : -1;

    const currentImage = activeIndex >= 0 ? filteredImages[activeIndex] : undefined;

    const goPrev = () => {
      if (!filteredImages.length || activeIndex < 0) return;
      const prev = (activeIndex - 1 + filteredImages.length) % filteredImages.length;
      setSelectedImage(filteredImages[prev].id);
    };

    const goNext = () => {
      if (!filteredImages.length || activeIndex < 0) return;
      const next = (activeIndex + 1) % filteredImages.length;
      setSelectedImage(filteredImages[next].id);
    };

    useEffect(() => {
      if (!selectedImage) return;

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") closeLightbox();
        if (e.key === "ArrowLeft") goPrev();
        if (e.key === "ArrowRight") goNext();
      };

      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedImage, filter]);
 
   return (
     <section className="py-20 bg-muted/30" id="gallery">
       <div className="container mx-auto px-4">
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.5 }}
           className="text-center mb-12"
         >
           <h2 className="text-4xl font-bold text-foreground mb-4">
             Фотогалерея
           </h2>
           <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
             Яркие моменты из жизни нашей школы
           </p>
 
           {/* Category Filter */}
           <div className="flex flex-wrap justify-center gap-2">
             {categories.map((category) => (
               <Button
                 key={category}
                 variant={filter === category ? "default" : "outline"}
                 size="sm"
                 onClick={() => setFilter(category)}
                 className="rounded-full"
               >
                 {category}
               </Button>
             ))}
           </div>
         </motion.div>
 
         {/* Gallery Grid */}
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
           {filteredImages.map((image, index) => (
             <motion.div
               key={image.id}
               initial={{ opacity: 0, scale: 0.9 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true }}
               transition={{ duration: 0.3, delay: index * 0.05 }}
               className="relative group cursor-pointer aspect-square overflow-hidden rounded-lg bg-muted"
               onClick={() => openLightbox(image.id)}
             >
               <img
                 src={image.src}
                 alt={image.title}
                 className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
               />
               
               {/* Overlay */}
               <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                 <div className="text-center text-white p-4">
                   <ZoomIn className="w-10 h-10 mx-auto mb-2" />
                   <h3 className="font-semibold">{image.title}</h3>
                   <p className="text-sm text-white/80">{image.category}</p>
                 </div>
               </div>
             </motion.div>
           ))}
         </div>
 
         {/* Lightbox */}
         <AnimatePresence>
           {selectedImage && currentImage && (
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
               onClick={closeLightbox}
             >
               <Button
                 variant="ghost"
                 size="icon"
                 className="absolute top-4 right-4 text-white hover:bg-white/20"
                 onClick={closeLightbox}
               >
                 <X className="w-6 h-6" />
               </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    goPrev();
                  }}
                >
                  <ChevronLeft className="w-7 h-7" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    goNext();
                  }}
                >
                  <ChevronRight className="w-7 h-7" />
                </Button>
 
               <motion.div
                 initial={{ scale: 0.8, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 exit={{ scale: 0.8, opacity: 0 }}
                 transition={{ duration: 0.3 }}
                 className="max-w-5xl w-full"
                 onClick={(e) => e.stopPropagation()}
               >
                 <img
                   src={currentImage.src}
                   alt={currentImage.title}
                   className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                 />
                 <div className="text-center mt-4 text-white">
                   <h3 className="text-2xl font-bold mb-2">{currentImage.title}</h3>
                   <p className="text-white/70">{currentImage.category}</p>
                 </div>
               </motion.div>
             </motion.div>
           )}
         </AnimatePresence>
       </div>
     </section>
   );
 };
 
 export default Gallery;