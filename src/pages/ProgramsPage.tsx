import { Helmet } from "react-helmet-async";
import Navigation from "@/components/Navigation";
import Programs from "@/components/Programs";
import Footer from "@/components/Footer";

export default function ProgramsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Программы — Личность ПЛЮС</title>
        <meta name="description" content="Образовательные программы школы «Личность ПЛЮС»." />
        <link rel="canonical" href="/programs" />
      </Helmet>

      <Navigation />
      <main className="pt-20">
        <Programs />
      </main>
      <Footer />
    </div>
  );
}
