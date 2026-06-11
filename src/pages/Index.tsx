import { Suspense, lazy, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import { useContent } from "@/hooks/use-content";
import { Helmet } from "react-helmet-async";

// Lazy-loaded sections
const Features = lazy(() => import("@/components/Features"));
const About = lazy(() => import("@/components/About"));
const Programs = lazy(() => import("@/components/Programs"));
const Clubs = lazy(() => import("@/components/Clubs"));
const Testimonials = lazy(() => import("@/components/Testimonials"));
const News = lazy(() => import("@/components/News"));
const TeachingStaff = lazy(() => import("@/components/TeachingStaff"));
const HonorBoard = lazy(() => import("@/components/HonorBoard"));
const GalleryPreview = lazy(() => import("@/components/GalleryPreview"));
const Contact = lazy(() => import("@/components/Contact"));
const Footer = lazy(() => import("@/components/Footer"));
const FloatingActions = lazy(() => import("@/components/FloatingActions"));

const SectionSkeleton = () => (
  <div className="py-20 animate-pulse bg-muted/20">
    <div className="container mx-auto px-4 h-64 bg-muted/30 rounded-3xl" />
  </div>
);

const Index = () => {
  const location = useLocation();
  const { data: heroRow, isLoading: isHeroLoading } = useContent("hero");
  const { data: featuresRow, isLoading: isFeaturesLoading } = useContent("features");
  const { data: aboutRow, isLoading: isAboutLoading } = useContent("about");
  const { data: programsRow, isLoading: isProgramsLoading } = useContent("programs");
  const { data: clubsRow, isLoading: isClubsLoading } = useContent("clubs");
  const { data: testimonialsRow, isLoading: isTestimonialsLoading } = useContent("testimonials");
  const { data: newsRow, isLoading: isNewsLoading } = useContent("news");
  const { data: teachersRow, isLoading: isTeachersLoading } = useContent("teachers");
  const { data: honorRow, isLoading: isHonorLoading } = useContent("honor");
  const { data: galleryRow, isLoading: isGalleryLoading } = useContent("gallery");
  const { data: contactRow, isLoading: isContactLoading } = useContent("contact");
  const { data: footerRow, isLoading: isFooterLoading } = useContent("footer");

  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (!hash) return;
    
    const scrollToElement = () => {
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return true;
      }
      return false;
    };

    if (scrollToElement()) return;

    const interval = setInterval(() => {
      if (scrollToElement()) {
        clearInterval(interval);
      }
    }, 100);

    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 2000); // Stop polling after 2s

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [location.hash, isHonorLoading, isAboutLoading, isClubsLoading, isNewsLoading, isTeachersLoading]);

  const showFeatures = featuresRow?.is_visible === true;
  const showAbout = aboutRow?.is_visible === true;
  const showPrograms = programsRow?.is_visible === true;
  const showClubs = clubsRow?.is_visible === true;
  const showTestimonials = testimonialsRow?.is_visible === true;
  const showNews = newsRow?.is_visible === true;
  const showTeachers = teachersRow?.is_visible === true;
  const showHonor = honorRow?.is_visible === true;
  const showGallery = galleryRow?.is_visible === true;
  const showContact = contactRow?.is_visible === true;
  const showFooter = footerRow?.is_visible !== false; // Footer usually stays
  const showHero = heroRow?.is_visible !== false;

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Helmet>
        <title>Личность ПЛЮС — Частная школа в Горячем Ключе</title>
        <meta name="description" content="Частная школа «Личность ПЛЮС» в Горячем Ключе. Индивидуальный подход, малые классы, углубленное обучение и творческое развитие детей." />
        <link rel="canonical" href="https://slp23.ru/" />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "School",
              "name": "Личность ПЛЮС",
              "alternateName": "Частная школа Личность ПЛЮС в Горячем Ключе",
              "url": "https://slp23.ru/",
              "logo": "https://slp23.ru/logo.png",
              "image": "https://slp23.ru/logo.png",
              "description": "Частная школа «Личность ПЛЮС» в Горячем Ключе. Индивидуальный подход, малые классы, углубленное обучение и творческое развитие детей.",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "переулок Школьный, 27",
                "addressLocality": "Горячий Ключ",
                "addressRegion": "Краснодарский край",
                "postalCode": "353290",
                "addressCountry": "RU"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": "44.629392",
                "longitude": "39.124239"
              },
              "telephone": "+7-928-261-99-28",
              "email": "slichnost5@mail.ru",
              "openingHoursSpecification": [
                {
                  "@type": "OpeningHoursSpecification",
                  "dayOfWeek": [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday"
                  ],
                  "opens": "08:00",
                  "closes": "17:00"
                }
              ]
            }
          `}
        </script>
      </Helmet>
      <Navigation />
      <main id="main-content">
        {isHeroLoading ? <SectionSkeleton /> : showHero ? <Hero /> : null}
        <Suspense fallback={<SectionSkeleton />}>
          {isFeaturesLoading ? <SectionSkeleton /> : showFeatures ? <Features /> : null}
          {isAboutLoading ? <SectionSkeleton /> : showAbout ? <About /> : null}
          {isProgramsLoading ? (
            <SectionSkeleton />
          ) : showPrograms ? (
            <Suspense fallback={<SectionSkeleton />}>
              <Programs />
            </Suspense>
          ) : null}
          {isClubsLoading ? <SectionSkeleton /> : showClubs ? <Suspense fallback={<SectionSkeleton />}><Clubs /></Suspense> : null}
          {isTestimonialsLoading ? <SectionSkeleton /> : showTestimonials ? <Suspense fallback={<SectionSkeleton />}><Testimonials /></Suspense> : null}
          {isNewsLoading ? <SectionSkeleton /> : showNews ? <Suspense fallback={<SectionSkeleton />}><News /></Suspense> : null}
          {isTeachersLoading ? (
            <SectionSkeleton />
          ) : showTeachers ? (
            <Suspense fallback={<SectionSkeleton />}>
              <TeachingStaff />
            </Suspense>
          ) : null}
          {isHonorLoading ? <SectionSkeleton /> : showHonor ? <Suspense fallback={<SectionSkeleton />}><HonorBoard /></Suspense> : null}
          {isGalleryLoading ? <SectionSkeleton /> : showGallery ? <Suspense fallback={<SectionSkeleton />}><GalleryPreview /></Suspense> : null}
          {isContactLoading ? <SectionSkeleton /> : showContact ? <Suspense fallback={<SectionSkeleton />}><Contact /></Suspense> : null}
          {isFooterLoading ? <SectionSkeleton /> : showFooter ? (
            <Suspense fallback={<SectionSkeleton />}><Footer /></Suspense>
          ) : null}
          <FloatingActions />
        </Suspense>
      </main>
    </div>
  );
};

export default Index;
