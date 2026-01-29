import { Suspense, lazy } from "react";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import { useContent } from "@/hooks/use-content";

// Lazy-loaded sections
const Features = lazy(() => import("@/components/Features"));
const About = lazy(() => import("@/components/About"));
const Programs = lazy(() => import("@/components/Programs"));
const Clubs = lazy(() => import("@/components/Clubs"));
const Testimonials = lazy(() => import("@/components/Testimonials"));
const News = lazy(() => import("@/components/News"));
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
  const { data: featuresRow } = useContent("features");
  const { data: aboutRow } = useContent("about");
  const { data: programsRow } = useContent("programs");
  const { data: clubsRow } = useContent("clubs");
  const { data: testimonialsRow } = useContent("testimonials");
  const { data: newsRow } = useContent("news");
  const { data: galleryRow } = useContent("gallery");
  const { data: contactRow } = useContent("contact");
  const { data: footerRow } = useContent("footer");

  const showFeatures = featuresRow?.is_visible ?? true;
  const showAbout = aboutRow?.is_visible ?? true;
  const showPrograms = programsRow?.is_visible ?? true;
  const showClubs = clubsRow?.is_visible ?? true;
  const showTestimonials = testimonialsRow?.is_visible ?? true;
  const showNews = newsRow?.is_visible ?? true;
  const showGallery = galleryRow?.is_visible ?? true;
  const showContact = contactRow?.is_visible ?? true;
  const showFooter = footerRow?.is_visible ?? true;

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Navigation />
      <main id="main-content">
        <Hero />
        <Suspense fallback={<SectionSkeleton />}>
          {showFeatures ? <Features /> : null}
          {showAbout ? <About /> : null}
          {showPrograms ? <Suspense fallback={<SectionSkeleton />}><Programs /></Suspense> : null}
          {showClubs ? <Suspense fallback={<SectionSkeleton />}><Clubs /></Suspense> : null}
          {showTestimonials ? <Suspense fallback={<SectionSkeleton />}><Testimonials /></Suspense> : null}
          {showNews ? <Suspense fallback={<SectionSkeleton />}><News /></Suspense> : null}
          {showGallery ? <Suspense fallback={<SectionSkeleton />}><GalleryPreview /></Suspense> : null}
          {showContact ? <Suspense fallback={<SectionSkeleton />}><Contact /></Suspense> : null}
          {showFooter ? <Suspense fallback={<SectionSkeleton />}><Footer /></Suspense> : null}
          <FloatingActions />
        </Suspense>
      </main>
    </div>
  );
};

export default Index;
