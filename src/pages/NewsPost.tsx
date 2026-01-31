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
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

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
  const isSingleMedia = mediaItems.length === 1;

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

              {/* Main Image - Only shown as full-width if multiple items exist, otherwise it floats below */}
              {!isSingleMedia && (
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
                    className="w-full h-full object-contain bg-black/5 transition-transform duration-700 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white/20 backdrop-blur-md p-3 rounded-full">
                      <ChevronRight className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="space-y-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="prose prose-neutral dark:prose-invert max-w-none clear-both"
                >
                  <div className="text-foreground/90 text-base md:text-lg leading-relaxed font-medium">
                    {/* Floating image for single media variant */}
                    {isSingleMedia && mediaItems[0].type === "image" && (
                      <div
                        className="float-none md:float-left mb-6 md:mr-8 max-w-full md:max-w-[45%] rounded-xl overflow-hidden shadow-md border border-border/50 cursor-zoom-in group"
                        onClick={() => openLightbox(0)}
                      >
                        <img
                          src={mediaItems[0].src}
                          alt={post.title}
                          className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-105 m-0"
                        />
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">
                      {cleanContent}
                    </div>
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
        <DialogContent className="max-w-5xl w-full h-auto bg-transparent border-none p-0 shadow-none flex flex-col gap-4">
          <DialogTitle className="sr-only">Просмотр изображения</DialogTitle>
          {activeIndex !== null && mediaItems[activeIndex] && (
            <div className="relative flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
              {/* No explicit X button here as shadcn DialogContent has one, 
                  but since we made it transparent, we might need a custom one positioned better. 
                  However, the user complained about "2 crosses", so let's see. 
                  Actually, with bg-transparent/p-0 the default shadcn close might be invisible. 
                  Let's add 1 clean floating close button. */}
              <Button
                variant="ghost"
                size="icon"
                onClick={closeLightbox}
                className="absolute right-4 top-4 z-50 rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white border-none h-10 w-10 flex items-center justify-center"
              >
                <X className="w-6 h-6" />
              </Button>

              <div className="w-full h-full flex items-center justify-center overflow-hidden">
                {mediaItems[activeIndex].type === "image" ? (
                  <img
                    src={mediaItems[activeIndex].src}
                    alt={post?.title ?? ""}
                    className="max-h-[85vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
                  />
                ) : (
                  <video
                    src={mediaItems[activeIndex].src}
                    controls
                    autoPlay
                    className="max-h-[85vh] w-auto max-w-full rounded-lg shadow-2xl"
                    poster={mainImage}
                  >
                    Ваш браузер не поддерживает видео.
                  </video>
                )}
              </div>

              {mediaItems.length > 1 && (
                <div className="flex items-center justify-between w-full mt-4 px-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={showPrev}
                    className="rounded-full bg-black/20 text-white hover:bg-black/40 h-12 w-12"
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </Button>
                  <div className="bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full text-white font-bold text-sm">
                    {activeIndex + 1} / {mediaItems.length}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={showNext}
                    className="rounded-full bg-black/20 text-white hover:bg-black/40 h-12 w-12"
                  >
                    <ChevronRight className="w-8 h-8" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
