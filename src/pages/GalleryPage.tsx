import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate } from "react-router-dom";

import Navigation from "@/components/Navigation";
import Gallery from "@/components/Gallery";
import Footer from "@/components/Footer";

export default function GalleryPage() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // If user opens /gallery#home (or any homepage anchor) — redirect to the homepage.
    if (location.hash && location.hash !== "#gallery") {
      navigate(`/${location.hash}`, { replace: true });
    }
  }, [location.hash, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Фотогалерея — Личность ПЛЮС</title>
        <meta
          name="description"
          content="Фотогалерея школы «Личность ПЛЮС»: яркие моменты занятий, мероприятий и школьной жизни."
        />
        <link rel="canonical" href="/gallery" />
      </Helmet>

      <Navigation />
      <main className="pt-20">
        <Gallery />
      </main>
      <Footer />
    </div>
  );
}
