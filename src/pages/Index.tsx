 import Navigation from "@/components/Navigation";
 import Hero from "@/components/Hero";
 import Features from "@/components/Features";
 import About from "@/components/About";
 import Programs from "@/components/Programs";
import Clubs from "@/components/Clubs";
 import Testimonials from "@/components/Testimonials";
 import News from "@/components/News";
 import Gallery from "@/components/Gallery";
 import Contact from "@/components/Contact";
 import Footer from "@/components/Footer";

const Index = () => {
  return (
     <div className="min-h-screen bg-background">
       <Navigation />
       <Hero />
       <Features />
       <About />
       <Programs />
      <Clubs />
     <Testimonials />
     <News />
     <Gallery />
       <Contact />
       <Footer />
    </div>
  );
};

export default Index;
