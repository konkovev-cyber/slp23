import { Helmet } from "react-helmet-async";

import Navigation from "@/components/Navigation";
import Gallery from "@/components/Gallery";
import Footer from "@/components/Footer";

export default function GalleryPage() {
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
