import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import About from "@/components/About";
import Programs from "@/components/Programs";
import Clubs from "@/components/Clubs";
import Testimonials from "@/components/Testimonials";
import News from "@/components/News";
import GalleryPreview from "@/components/GalleryPreview";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import { useContent } from "@/hooks/use-content";

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
      <Hero />
      {showFeatures ? <Features /> : null}
      {showAbout ? <About /> : null}
      {showPrograms ? <Programs /> : null}
      {showClubs ? <Clubs /> : null}
      {showTestimonials ? <Testimonials /> : null}
      {showNews ? <News /> : null}
      {showGallery ? <GalleryPreview /> : null}
      {showContact ? <Contact /> : null}
      {showFooter ? <Footer /> : null}
      <FloatingActions />
    </div>
  );
};

export default Index;
