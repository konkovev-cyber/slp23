 import { useState } from "react";
 import { motion, AnimatePresence } from "framer-motion";
 import { X, ZoomIn } from "lucide-react";
 import { Button } from "@/components/ui/button";
 
 const galleryImages = [
   {
     id: 1,
     src: "/placeholder.svg",
     title: "Новогодний праздник 2025",
     category: "Мероприятия",
   },
   {
     id: 2,
     src: "/placeholder.svg",
     title: "Урок робототехники",
     category: "Кружки",
   },
   {
     id: 3,
     src: "/placeholder.svg",
     title: "Проектная защита",
     category: "Образование",
   },
   {
     id: 4,
     src: "/placeholder.svg",
     title: "Спортивные соревнования",
     category: "Спорт",
   },
   {
     id: 5,
     src: "/placeholder.svg",
     title: "Творческая мастерская",
     category: "Кружки",
   },
   {
     id: 6,
     src: "/placeholder.svg",
     title: "День открытых дверей",
     category: "Мероприятия",
   },
   {
     id: 7,
     src: "/placeholder.svg",
     title: "Экскурсия в музей",
     category: "Мероприятия",
   },
   {
     id: 8,
     src: "/placeholder.svg",
     title: "Выступление хора",
     category: "Творчество",
   },
   {
     id: 9,
     src: "/placeholder.svg",
     title: "Научная лаборатория",
     category: "Образование",
   },
 ];
 
 const Gallery = () => {
   const [selectedImage, setSelectedImage] = useState<number | null>(null);
   const [filter, setFilter] = useState<string>("Все");
 
   const categories = ["Все", ...Array.from(new Set(galleryImages.map(img => img.category)))];
 
   const filteredImages = filter === "Все" 
     ? galleryImages 
     : galleryImages.filter(img => img.category === filter);
 
   const openLightbox = (id: number) => {
     setSelectedImage(id);
     document.body.style.overflow = 'hidden';
   };
 
   const closeLightbox = () => {
     setSelectedImage(null);
     document.body.style.overflow = 'unset';
   };
 
   const currentImage = galleryImages.find(img => img.id === selectedImage);
 
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