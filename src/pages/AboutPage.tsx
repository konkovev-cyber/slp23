import { Helmet } from "react-helmet-async";
import Navigation from "@/components/Navigation";
import About from "@/components/About";
import TeachingStaff from "@/components/TeachingStaff";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>О школе — Личность ПЛЮС</title>
        <meta name="description" content="О школе «Личность ПЛЮС»: миссия, оснащение и руководство." />
        <link rel="canonical" href="/about" />
      </Helmet>

      <Navigation />
      <main className="pt-20">
        <About />
        <TeachingStaff />
      </main>
      <Footer />
    </div>
  );
}
