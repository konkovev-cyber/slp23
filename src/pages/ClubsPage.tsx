import { Helmet } from "react-helmet-async";
import Navigation from "@/components/Navigation";
import Clubs from "@/components/Clubs";
import Footer from "@/components/Footer";

export default function ClubsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Кружки и секции — Личность ПЛЮС</title>
        <meta name="description" content="Кружки и секции школы «Личность ПЛЮС»: творчество, технологии, наука и спорт." />
        <link rel="canonical" href="/clubs" />
      </Helmet>

      <Navigation />
      <main className="pt-20">
        <Clubs />
      </main>
      <Footer />
    </div>
  );
}
