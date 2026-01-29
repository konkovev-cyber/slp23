import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { galleryImages } from "@/components/Gallery";
import { ArrowRight } from "lucide-react";

export default function GalleryPreview() {
  const preview = galleryImages.slice(0, 4);

  return (
    <section className="py-20 bg-muted/20" aria-labelledby="gallery-preview-title">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10 max-w-6xl mx-auto"
        >
          <div>
            <span className="text-primary font-bold tracking-widest uppercase text-[11px] mb-2 block">Галерея</span>
            <h2 id="gallery-preview-title" className="text-3xl md:text-5xl font-bold text-foreground tracking-tight">Жизнь школы</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md font-medium">
              Яркие моменты из жизни наших учеников. Полная подборка доступна на отдельной странице.
            </p>
          </div>

          <Button asChild variant="outline" className="h-10 px-5 rounded-full text-xs font-bold border-border bg-transparent hover:bg-muted self-start md:self-auto group">
            <Link to="/gallery" className="flex items-center gap-2">Смотреть все <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" /></Link>
          </Button>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {preview.map((img, idx) => (
            <motion.div
              key={img.id}
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="relative overflow-hidden rounded-xl bg-muted aspect-[4/3] shadow-sm group border border-border/50"
            >
              <img
                src={img.src}
                alt={img.title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
