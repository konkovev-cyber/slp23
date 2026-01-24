import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { galleryImages } from "@/components/Gallery";

export default function GalleryPreview() {
  const preview = galleryImages.slice(0, 9);

  return (
    <section className="py-20 bg-muted/30" aria-labelledby="gallery-preview-title">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10"
        >
          <div>
            <h2 id="gallery-preview-title" className="text-4xl font-bold text-foreground">
              Фотогалерея
            </h2>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Несколько живых моментов — полная подборка на отдельной странице.
            </p>
          </div>

          <Button asChild variant="outline" className="self-start md:self-auto">
            <Link to="/gallery">Смотреть все фото</Link>
          </Button>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {preview.map((img, idx) => (
            <motion.div
              key={img.id}
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.25, delay: idx * 0.03 }}
              className="relative overflow-hidden rounded-lg bg-muted aspect-square"
            >
              <img
                src={img.src}
                alt={img.title}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
