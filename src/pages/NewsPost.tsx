import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type Post = {
  id: string;
  title: string;
  slug: string;
  category: string;
  content: string;
  excerpt: string | null;
  image_url: string | null;
  published_at: string;
  updated_at: string;
};

function stripText(htmlOrText: string) {
  return htmlOrText.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function buildCanonical(pathname: string) {
  return new URL(pathname, window.location.origin).toString();
}

export default function NewsPost() {
  const { slug } = useParams();
  const safeSlug = slug ?? "";

  const { data: post, isLoading } = useQuery({
    queryKey: ["posts", "by_slug", safeSlug],
    enabled: Boolean(safeSlug),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id,title,slug,category,content,excerpt,image_url,published_at,updated_at")
        .eq("slug", safeSlug)
        .maybeSingle();
      if (error) throw error;
      return data as Post | null;
    },
  });

  // Media Parsing Logic
  const parseMedia = (content: string) => {
    const images: string[] = [];
    const videos: string[] = [];
    const urlPattern = /(https?:\/\/[^\s]+)/g;

    const imageBlockMatch = content.match(/Изображения:([\s\S]*?)(?=Видео:|$)/i);
    const videoBlockMatch = content.match(/Видео:([\s\S]*?)(?=Изображения:|$)/i);

    if (imageBlockMatch) {
      const urls = imageBlockMatch[1].match(urlPattern);
      if (urls) images.push(...urls);
    }

    if (videoBlockMatch) {
      const urls = videoBlockMatch[1].match(urlPattern);
      if (urls) videos.push(...urls);
    }

    if (images.length === 0 && videos.length === 0) {
      const allUrls = content.match(urlPattern) || [];
      allUrls.forEach(url => {
        if (/\.(jpg|jpeg|png|webp|gif|svg)/i.test(url)) images.push(url);
        else if (/\.(mp4|webm|ogg|mov)/i.test(url)) videos.push(url);
      });
    }

    let cleanContent = content
      .replace(/Изображения:[\s\S]*?(?=Видео:|$)/i, "")
      .replace(/Видео:[\s\S]*?(?=Изображения:|$)/i, "")
      .trim();

    return { images: [...new Set(images)], videos: [...new Set(videos)], cleanContent };
  };

  const canonical = buildCanonical(`/news/${safeSlug}`);
  const title = post ? `${post.title} — Личность ПЛЮС` : "Новость — Личность ПЛЮС";
  const { images, videos, cleanContent } = post ? parseMedia(post.content) : { images: [], videos: [], cleanContent: "" };

  const description = post
    ? (post.excerpt ?? stripText(post.content).slice(0, 160))
    : "Новость школы «Личность ПЛЮС».";
  const mainImage = post?.image_url ?? "/placeholder.svg";

  const publishedText = post?.published_at
    ? format(new Date(post.published_at), "d MMMM yyyy", { locale: ru })
    : "";

  // Общий список медиа для работы лайтбокса (изображения + видео)
  const mediaItems = useMemo(
    () => {
      if (!post) return [] as { type: "image" | "video"; src: string }[];

      const main = post.image_url ? [{ type: "image" as const, src: post.image_url }] : [];
      const galleryImages = images
        .filter((img) => img !== post.image_url)
        .map((src) => ({ type: "image" as const, src }));
      const galleryVideos = videos.map((src) => ({ type: "video" as const, src }));

      return [...main, ...galleryImages, ...galleryVideos];
    },
    [post, images, videos]
  );

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => {
    if (index >= 0 && index < mediaItems.length) {
      setActiveIndex(index);
    }
  };

  const closeLightbox = () => setActiveIndex(null);

  const showPrev = () => {
    if (activeIndex === null || mediaItems.length === 0) return;
    setActiveIndex((prev) => (prev! - 1 + mediaItems.length) % mediaItems.length);
  };

  const showNext = () => {
    if (activeIndex === null || mediaItems.length === 0) return;
    setActiveIndex((prev) => (prev! + 1) % mediaItems.length);
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <Navigation />

      <main className="pt-28 pb-20">
        <article className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link to="/news" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Назад к новостям
            </Link>
          </motion.div>

          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-8 bg-muted rounded w-2/3" />
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-[400px] bg-muted rounded w-full" />
            </div>
          ) : !post ? (
            <div className="text-center py-20">
              <h1 className="text-2xl font-bold text-foreground">Новость не найдена</h1>
              <Link to="/news" className="text-primary hover:underline mt-4 block font-bold">Вернуться к списку</Link>
            </div>
          ) : (
            <div className="space-y-10">
              <header className="space-y-4" aria-label="Заголовок новости">
                <div className="flex flex-wrap items-center gap-4">
                  <Badge className="bg-primary/10 text-primary border-none rounded-md px-2.5 py-0.5 font-bold uppercase text-[10px] tracking-wider">
                    {post.category}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-bold uppercase tracking-widest">
                    <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                    <time dateTime={post.published_at.split('T')[0]}>
                      {publishedText}
                    </time>
                  </div>
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tighter leading-tight">
                  {post.title}
                </h1>
              </header>

              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative aspect-video rounded-2xl overflow-hidden shadow-lg border border-border/50 cursor-zoom-in group"
                onClick={() => openLightbox(0)}
                aria-label="Открыть изображение в полном размере"
              >
                <img
                  src={mainImage}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                />
              </motion.div>

              <div className="space-y-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="prose prose-neutral dark:prose-invert max-w-none"
                >
                  <div className="text-foreground/90 text-base md:text-lg leading-relaxed font-medium whitespace-pre-wrap">
                    {cleanContent}
                  </div>
                </motion.div>

                {(images.length > 0 || videos.length > 0) && (
                  <section className="space-y-8 pt-8 border-t border-border/50">
                    {videos.length > 0 && (
                      <div className="space-y-4">
                        <h2 className="text-xl font-bold tracking-tight">Видеоматериалы</h2>
                        <div className="grid grid-cols-1 gap-6">
                           {videos.map((vid, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, y: 10 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                               className="aspect-video rounded-xl overflow-hidden bg-muted border border-border/50 shadow-sm cursor-zoom-in"
                               onClick={() => openLightbox((post?.image_url ? 1 : 0) + images.filter((img) => img !== mainImage).length + idx)}
                            >
                              <video src={vid} controls className="w-full h-full" poster={mainImage}>
                                Ваш браузер не поддерживает видео.
                              </video>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {images.filter(img => img !== mainImage).length > 0 && (
                      <div className="space-y-4">
                        <h2 className="text-xl font-bold tracking-tight">Фотогалерея</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                           {images.filter(img => img !== mainImage).map((img, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, scale: 0.9 }}
                              whileInView={{ opacity: 1, scale: 1 }}
                              viewport={{ once: true }}
                              whileHover={{ scale: 1.02 }}
                               className="aspect-square rounded-xl overflow-hidden bg-muted border border-border/50 shadow-sm cursor-zoom-in group"
                               onClick={() => openLightbox((post?.image_url ? 1 : 0) + idx)}
                            >
                              <img
                                src={img}
                                alt={`Изображение ${idx + 1}`}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                 )}
              </div>
            </div>
          )}
        </article>
      </main>

      <Footer />

      {/* Лайтбокс для полноразмерного просмотра изображений и видео */}
      <Dialog open={activeIndex !== null} onOpenChange={(open) => !open && closeLightbox()}>
        <DialogContent className="max-w-5xl w-full h-auto bg-background/95 p-4 md:p-6 flex flex-col gap-4">
          {activeIndex !== null && mediaItems[activeIndex] && (
            <div className="relative flex flex-col items-center gap-4">
              <button
                type="button"
                onClick={closeLightbox}
                className="absolute right-0 -top-2 md:-top-4 inline-flex items-center justify-center rounded-full border border-border bg-background/80 text-foreground hover:bg-muted h-8 w-8"
                aria-label="Закрыть"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-full max-h-[70vh] flex items-center justify-center">
                {mediaItems[activeIndex].type === "image" ? (
                  <img
                    src={mediaItems[activeIndex].src}
                    alt={post?.title ?? ""}
                    className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
                  />
                ) : (
                  <video
                    src={mediaItems[activeIndex].src}
                    controls
                    autoPlay
                    className="max-h-[70vh] w-auto max-w-full rounded-xl shadow-lg"
                    poster={mainImage}
                  >
                    Ваш браузер не поддерживает видео.
                  </video>
                )}
              </div>

              {mediaItems.length > 1 && (
                <div className="flex items-center justify-between w-full mt-2">
                  <button
                    type="button"
                    onClick={showPrev}
                    className="inline-flex items-center justify-center rounded-full border border-border bg-background/80 text-foreground hover:bg-muted h-9 w-9"
                    aria-label="Предыдущее медиа"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {activeIndex + 1} / {mediaItems.length}
                  </span>
                  <button
                    type="button"
                    onClick={showNext}
                    className="inline-flex items-center justify-center rounded-full border border-border bg-background/80 text-foreground hover:bg-muted h-9 w-9"
                    aria-label="Следующее медиа"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
