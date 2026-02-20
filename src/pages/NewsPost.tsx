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
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toEmbedUrl, isDirectVideoFile } from "@/lib/video-embed";
import DOMPurify from 'dompurify';

// Regex to find links in text
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

function FormattedText({ text }: { text: string }) {
  if (!text) return null;

  // Split text by URLs and map parts to either text or <a> tags
  const parts = text.split(URL_REGEX);

  return (
    <div className="whitespace-pre-wrap pt-1 leading-relaxed">
      {parts.map((part, i) => {
        if (part.match(URL_REGEX)) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline break-all"
            >
              {part}
            </a>
          );
        }
        return part;
      })}
    </div>
  );
}

type PostMediaRow = {
  media_url: string;
  media_type: string;
  display_order: number;
  alt_text: string | null;
};

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
  source?: string;
  post_media?: PostMediaRow[];
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
        .select(
          "id,title,slug,category,content,excerpt,image_url,published_at,updated_at,source,post_media(media_url,media_type,display_order,alt_text)"
        )
        .eq("slug", safeSlug)
        .order("display_order", { foreignTable: "post_media", ascending: true })
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

  const dbMedia = (post?.post_media ?? [])
    .filter((m) => Boolean(m.media_url))
    .slice()
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

  const fallbackParsed = post
    ? parseMedia(post.content)
    : { images: [] as string[], videos: [] as string[], cleanContent: "" };

  const mediaFromDb = dbMedia.map((m) => ({
    type: m.media_type === "video" ? ("video" as const) : ("image" as const),
    src: m.media_url,
  }));

  const mediaItems = useMemo(() => {
    const items = mediaFromDb.length
      ? mediaFromDb
      : (() => {
        if (!post) return [] as { type: "image" | "video"; src: string }[];
        const main = post.image_url ? [{ type: "image" as const, src: post.image_url }] : [];
        const galleryImages = fallbackParsed.images
          .filter((img) => img !== post.image_url)
          .map((src) => ({ type: "image" as const, src }));
        const galleryVideos = fallbackParsed.videos.map((src) => ({ type: "video" as const, src }));
        return [...main, ...galleryImages, ...galleryVideos];
      })();

    // Remove duplicates but keep order
    const seen = new Set<string>();
    return items.filter((it) => {
      const key = `${it.type}:${it.src}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [post, fallbackParsed.images, fallbackParsed.videos]);

  const { images, videos, cleanContent } = post
    ? mediaFromDb.length
      ? {
        images: mediaFromDb.filter((m) => m.type === "image").map((m) => m.src),
        videos: mediaFromDb.filter((m) => m.type === "video").map((m) => m.src),
        cleanContent: post.content,
      }
      : fallbackParsed
    : { images: [], videos: [], cleanContent: "" };

  const description = post
    ? (post.excerpt ?? stripText(post.content).slice(0, 160))
    : "Новость школы «Личность ПЛЮС».";
  const mainImage = post?.image_url ?? mediaItems.find((m) => m.type === "image")?.src ?? "/placeholder.svg";

  const publishedText = post?.published_at
    ? format(new Date(post.published_at), "d MMMM yyyy", { locale: ru })
    : "";

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

                {post.source && post.source.startsWith('http') && (
                  <div className="pt-2">
                    <a
                      href={post.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors bg-primary/5 px-3 py-1.5 rounded-full"
                    >
                      <span>Посмотреть в источнике</span>
                      <ArrowLeft className="w-3 h-3 rotate-180" />
                    </a>
                  </div>
                )}
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
                  className="prose prose-neutral dark:prose-invert max-w-none"
                >
                  <div className="text-foreground/90 text-base md:text-lg font-medium min-h-[300px]">
                    {/* Floating image for single media variant */}
                    {isSingleMedia && mediaItems[0].type === "image" && (
                      <div
                        className="float-none md:float-left mb-6 md:mr-8 w-full md:max-w-[400px] rounded-2xl overflow-hidden cursor-zoom-in group shadow-md"
                        onClick={() => openLightbox(0)}
                      >
                        <img
                          src={mediaItems[0].src}
                          alt={post.title}
                          className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-105 m-0 block"
                        />
                      </div>
                    )}
                    {/<[a-z][\s\S]*>/i.test(cleanContent) ? (
                      <div
                        className="prose prose-sm md:prose-base dark:prose-invert max-w-none pt-1 leading-relaxed text-foreground/90"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(cleanContent) }}
                      />
                    ) : (
                      <FormattedText text={cleanContent} />
                    )}
                    {/* Clearfix for short texts */}
                    <div className="clear-both" />
                  </div>
                </motion.div>

                {(images.length > 0 || videos.length > 0) && (
                  <section className="space-y-8 pt-8 border-t border-border/50 clear-both">
                    {videos.length > 0 && (
                      <div className="space-y-4">
                        <h2 className="text-xl font-bold tracking-tight">Видеоматериалы</h2>
                        <div className="grid grid-cols-1 gap-6">
                          {videos.map((vid, idx) => {
                            const embed = toEmbedUrl(vid);
                            const isFile = isDirectVideoFile(vid);
                            const mediaIndex = mediaItems.findIndex((m) => m.type === "video" && m.src === vid);
                            return (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="aspect-video rounded-xl overflow-hidden bg-muted border border-border/50 shadow-sm cursor-zoom-in"
                                onClick={() => openLightbox(mediaIndex >= 0 ? mediaIndex : idx)}
                              >
                                {embed ? (
                                  <iframe
                                    src={embed}
                                    title={`Видео ${idx + 1}`}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                  />
                                ) : isFile ? (
                                  <video src={vid} controls className="w-full h-full" poster={mainImage}>
                                    Ваш браузер не поддерживает видео.
                                  </video>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center p-6 text-center">
                                    <div className="space-y-2">
                                      <p className="text-sm font-bold">Видео по ссылке</p>
                                      <p className="text-xs text-muted-foreground break-all">{vid}</p>
                                      <p className="text-xs text-muted-foreground">Откроется в лайтбоксе как embed, если источник поддерживается.</p>
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            );
                          })}
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
        <DialogContent className="max-w-[95vw] md:max-w-5xl w-full h-auto bg-transparent border-none p-0 shadow-none flex flex-col items-center justify-center outline-none [&>button]:hidden">
          <DialogTitle className="sr-only">Просмотр изображения</DialogTitle>
          {activeIndex !== null && mediaItems[activeIndex] && (
            <div className="relative group flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <Button
                variant="ghost"
                size="icon"
                onClick={closeLightbox}
                className="absolute -top-12 right-0 md:-top-4 md:-right-12 z-50 rounded-full bg-black/40 text-white hover:bg-black/60 border-none h-10 w-10 transition-all shadow-lg"
              >
                <X className="w-5 h-5" />
              </Button>

              <div className="relative flex items-center justify-center max-h-[85vh] max-w-full overflow-hidden">
                {mediaItems[activeIndex].type === "image" ? (
                  <img
                    src={mediaItems[activeIndex].src}
                    alt={post?.title ?? ""}
                    className="max-h-[85vh] md:max-h-[90vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
                  />
                ) : (
                  (() => {
                    const src = mediaItems[activeIndex].src;
                    const embed = toEmbedUrl(src);
                    const isFile = isDirectVideoFile(src);

                    if (embed) {
                      return (
                        <iframe
                          src={embed}
                          title={post?.title ?? "Видео"}
                          className="max-h-[85vh] md:max-h-[90vh] w-[90vw] md:w-[70vw] aspect-video rounded-lg shadow-2xl bg-background"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      );
                    }

                    if (isFile) {
                      return (
                        <video
                          src={src}
                          controls
                          autoPlay
                          className="max-h-[85vh] w-auto max-w-full rounded-lg shadow-2xl"
                          poster={mainImage}
                        >
                          Ваш браузер не поддерживает видео.
                        </video>
                      );
                    }

                    return (
                      <div className="max-w-[90vw] md:max-w-[70vw] rounded-lg shadow-2xl bg-card border border-border p-6">
                        <p className="font-bold mb-2">Видео по ссылке</p>
                        <a href={src} target="_blank" rel="noreferrer" className="text-primary underline break-all">
                          {src}
                        </a>
                        <p className="text-sm text-muted-foreground mt-3">
                          Источник не поддерживает встраивание — откроется в новой вкладке.
                        </p>
                      </div>
                    );
                  })()
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
