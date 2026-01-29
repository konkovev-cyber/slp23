import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, Building2, BookOpen, Volume2, VolumeX } from "lucide-react";
import facilitiesClassroomImage from "@/assets/facilities-classroom.jpg";
import facilitiesHallImage from "@/assets/facilities-hall.jpg";
import directorKianImage from "@/assets/director-kian.jpg";
import aboutVideo from "@/assets/about-video.mp4";

const About = () => {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <section id="about" className="py-20 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row gap-12 items-start max-w-5xl mx-auto">

          {/* Video Side - Form-sized and neat */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-[400px] shrink-0"
          >
            <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-md relative group border border-border bg-muted">
              <video
                ref={videoRef}
                src={aboutVideo}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                className="w-full h-full object-cover brightness-95 group-hover:brightness-100 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

              <div className="absolute bottom-4 right-4">
                <button
                  onClick={toggleMute}
                  className="p-2.5 rounded-full bg-white/20 text-white backdrop-blur-md border border-white/20 hover:bg-white/40 transition-all shadow-sm"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Info Side - Proportional to video */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex-1 space-y-8"
          >
            <div className="space-y-3">
              <span className="text-primary font-bold tracking-widest uppercase text-[10px] mb-1 block">О нашей школе</span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight tracking-tight">Пространство для роста</h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                Личность ПЛЮС — это экосистема, где ребенка учат думать, созидать и верить в свои силы через современные методики обучения.
              </p>
            </div>

            <Tabs defaultValue="about" className="w-full">
              <TabsList className="bg-muted/50 p-1 rounded-lg mb-6 flex h-auto w-fit">
                <TabsTrigger value="about" className="rounded-md px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all text-xs">Миссия</TabsTrigger>
                <TabsTrigger value="facilities" className="rounded-md px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all text-xs">Оснащение</TabsTrigger>
                <TabsTrigger value="leadership" className="rounded-md px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all text-xs">Команда</TabsTrigger>
              </TabsList>

              <div className="min-h-[220px]">
                <TabsContent value="about" className="space-y-3 mt-0">
                  <div className="glass-card p-5 rounded-lg space-y-3">
                    <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                      <BookOpen className="w-4 h-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-foreground">Авторская методика</h4>
                      <p className="text-[13px] text-muted-foreground leading-relaxed">Развиваем критическое мышление и soft skills через современный подход к предметам.</p>
                    </div>
                  </div>
                  <div className="glass-card p-5 rounded-lg space-y-3">
                    <div className="w-9 h-9 bg-accent/10 rounded-lg flex items-center justify-center border border-accent/20">
                      <Award className="w-4 h-4 text-accent" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-foreground">Лицензия и стандарты</h4>
                      <p className="text-[13px] text-muted-foreground leading-relaxed">Лицензия государственного образца. Высокие результаты на олимпиадах.</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="facilities" className="space-y-3 mt-0">
                  <div className="grid grid-cols-2 gap-3">
                    <img src={facilitiesClassroomImage} alt="Класс" className="rounded-lg border border-border aspect-video object-cover shadow-sm" />
                    <img src={facilitiesHallImage} alt="Зал" className="rounded-lg border border-border aspect-video object-cover shadow-sm" />
                  </div>
                  <div className="glass-card p-5 rounded-lg">
                    <h4 className="text-base font-bold text-foreground mb-1">Комфорт и безопасность</h4>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">Современные классы, зоны творчества, охраняемая территория и здоровое питание.</p>
                  </div>
                </TabsContent>

                <TabsContent value="leadership" className="space-y-3 mt-0">
                  <div className="glass-card p-5 rounded-lg flex items-center gap-4">
                    <img src={directorKianImage} alt="Директор" className="w-16 h-16 rounded-full object-cover shadow-sm border-2 border-background" />
                    <div>
                      <h4 className="text-base font-bold text-foreground">Киян Юлия Юрьевна</h4>
                      <p className="text-primary font-bold uppercase tracking-wider text-[9px] mt-0.5">Директор школы</p>
                    </div>
                  </div>
                  <div className="glass-card p-5 rounded-lg border-l-4 border-l-primary">
                    <p className="text-muted-foreground italic text-sm leading-relaxed">"Мы создаем будущее, воспитывая поколение лидеров и творцов."</p>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;