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

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type GalleryImage = {
  id: string | number;
  src: string;
  title: string;
  category: string;
};

export const localGalleryImages: GalleryImage[] = [
  { id: 1, src: gallery1, title: "Урок и командная работа", category: "Обучение" },
  { id: 2, src: gallery2, title: "Занятие в классе", category: "Обучение" },
  { id: 3, src: gallery3, title: "Эмоции и вовлечённость", category: "Школьная жизнь" },
  { id: 4, src: gallery4, title: "Командный дух", category: "Школьная жизнь" },
  { id: 5, src: gallery5, title: "Дружная команда", category: "Школьная жизнь" },
  { id: 6, src: gallery6, title: "Наши ученики", category: "Ученики" },
  { id: 7, src: gallery7, title: "Фото на память", category: "Ученики" },
  { id: 8, src: gallery8, title: "Математика вокруг нас", category: "Обучение" },
  { id: 9, src: gallery9, title: "Поддержка и наставничество", category: "Обучение" },
  { id: 10, src: gallery10, title: "Работа с педагогом", category: "Обучение" },
  { id: 11, src: gallery11, title: "Здание школы", category: "Школа" },
  { id: 12, src: gallery12, title: "Класс для занятий", category: "Школа" },
  { id: 13, src: gallery13, title: "Спортивный зал", category: "Спорт" },
  { id: 14, src: gallery14, title: "Ученик за чтением", category: "Обучение" },
  { id: 15, src: gallery15, title: "На уроке", category: "Ученики" },
  { id: 16, src: gallery16, title: "Игра со словами", category: "Обучение" },
  { id: 17, src: gallery17, title: "Изучаем буквы", category: "Обучение" },
  { id: 18, src: gallery18, title: "Развивающие игры", category: "Обучение" },
  { id: 19, src: gallery19, title: "Творчество с красками", category: "Творчество" },
  { id: 20, src: gallery20, title: "Работа над проектом", category: "Обучение" },
  { id: 21, src: gallery21, title: "Командная работа", category: "Обучение" },
  { id: 22, src: gallery22, title: "Занятие с педагогом", category: "Обучение" },
  { id: 23, src: gallery23, title: "Хореография", category: "Творчество" },
  { id: 24, src: gallery24, title: "Библиотека", category: "Школа" },
  { id: 25, src: gallery25, title: "Дружный класс", category: "Ученики" },
  { id: 26, src: gallery26, title: "Группа с преподавателем", category: "Ученики" },
  { id: 27, src: gallery27, title: "Первый день в школе", category: "Школьная жизнь" },
  { id: 28, src: gallery28, title: "Торжественное событие", category: "Мероприятия" },
  { id: 29, src: gallery29, title: "День знаний", category: "Мероприятия" },
  { id: 30, src: gallery30, title: "Активные занятия", category: "Школьная жизнь" },
  { id: 31, src: gallery31, title: "Наш класс", category: "Ученики" },
  { id: 32, src: gallery32, title: "Момент с мероприятия", category: "Мероприятия" },
];

const Gallery = () => {
  const [selectedImage, setSelectedImage] = useState<string | number | null>(null);
  const [filter, setFilter] = useState<string>("Все");
  const [page, setPage] = useState(1);

  const { data: dbImages = [] } = useQuery({
    queryKey: ["gallery"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery" as any)
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Gallery Fetch Error:", error);
        return [];
      }
      console.log("DB Gallery Images:", data);
      return (data ?? []).map((img: any) => ({
        id: img.id,
        src: img.url,
        title: img.title,
        category: img.category
      }));
    }
  });

  const galleryImages = useMemo(() => {
    // Merge: DB images (dynamic) + initial static local images
    console.log("Merging Gallery: DB(", dbImages.length, ") + Local(", localGalleryImages.length, ")");
    return [...dbImages, ...localGalleryImages];
  }, [dbImages]);

  const categories = useMemo(() => ["Все", ...Array.from(new Set(galleryImages.map(img => img.category)))], [galleryImages]);

  const filteredImages = useMemo(
    () => filter === "Все" ? galleryImages : galleryImages.filter((img) => img.category === filter),
    [filter, galleryImages]
  );

  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(filteredImages.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedImages = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredImages.slice(start, start + pageSize);
  }, [filteredImages, safePage]);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  const openLightbox = (id: string | number) => {
    setSelectedImage(id);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    document.body.style.overflow = 'unset';
  };

  const activeIndex = selectedImage ? filteredImages.findIndex((img) => img.id === selectedImage) : -1;
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
  }, [selectedImage, filter]);

  return (
    <section className="py-20 bg-background" id="gallery" aria-label="Галерея фотографий школы">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <span className="text-primary font-bold tracking-widest uppercase text-[10px] mb-2 block">Фотоархив</span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">Жизнь школы</h2>

          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {categories.map((category) => (
              <Button
                key={category}
                variant={filter === category ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(category)}
                className="rounded-full h-8 px-5 text-[11px] font-bold uppercase tracking-wider transition-all"
              >
                {category}
              </Button>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto" role="list" aria-label="Фотографии">
          {pagedImages.map((image, index) => (
            <motion.figure
              key={image.id}
              role="listitem"
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="relative group cursor-pointer aspect-[4/3] overflow-hidden rounded-xl bg-muted border border-border/50 shadow-sm"
              onClick={() => openLightbox(image.id)}
            >
              <img
                src={image.src}
                alt={image.title}
                width="800"
                height="600"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4">
                <div className="text-center">
                  <ZoomIn className="w-8 h-8 text-white mx-auto mb-2 opacity-80" aria-hidden="true" />
                  <figcaption className="text-white font-bold text-sm tracking-tight">{image.title}</figcaption>
                </div>
              </div>
            </motion.figure>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="mt-12 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full w-24 font-bold text-[11px] uppercase tracking-wider h-9"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage <= 1}
              >
                Назад
              </Button>
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-4">
                {safePage} / {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full w-24 font-bold text-[11px] uppercase tracking-wider h-9"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
              >
                Вперёд
              </Button>
            </div>
          </div>
        )}

        <AnimatePresence>
          {selectedImage && currentImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
              onClick={closeLightbox}
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-6 right-6 text-white/70 hover:text-white hover:bg-white/10 rounded-full"
                onClick={closeLightbox}
              >
                <X className="w-6 h-6" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white hover:bg-white/10 rounded-full"
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white hover:bg-white/10 rounded-full"
                onClick={(e) => { e.stopPropagation(); goNext(); }}
              >
                <ChevronRight className="w-8 h-8" />
              </Button>

              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="max-w-4xl w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={currentImage.src}
                  alt={currentImage.title}
                  decoding="async"
                  className="w-full h-auto max-h-[75vh] object-contain rounded-xl shadow-2xl"
                />
                <div className="text-center mt-6">
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-1 tracking-tight">{currentImage.title}</h3>
                  <p className="text-white/60 text-sm font-medium uppercase tracking-widest">{currentImage.category}</p>
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