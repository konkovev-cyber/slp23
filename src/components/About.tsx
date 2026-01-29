import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, Building2, BookOpen, Volume2, VolumeX, CheckCircle2 } from "lucide-react";
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
        <div className="flex flex-col lg:flex-row gap-12 items-center max-w-5xl mx-auto">

          {/* Video Side - Compact and refined */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-[380px] shrink-0"
          >
            <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-xl relative group border border-border/50 bg-muted">
              <video
                ref={videoRef}
                src={aboutVideo}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                className="w-full h-full object-cover brightness-[0.9] group-hover:brightness-100 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

              <div className="absolute bottom-4 right-4">
                <button
                  onClick={toggleMute}
                  className="p-2.5 rounded-full bg-black/20 text-white backdrop-blur-xl border border-white/10 hover:bg-black/40 transition-all shadow-lg"
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
              <h2 className="text-3xl md:text-5xl font-black text-foreground leading-tight tracking-tight">Пространство для роста личности</h2>
              <p className="text-[15px] text-muted-foreground leading-relaxed max-w-xl font-medium">
                Личность ПЛЮС — это экосистема, где ребенка учат думать, созидать и верить в свои силы через современные методики обучения.
              </p>
            </div>

            <Tabs defaultValue="about" className="w-full">
              <div className="flex mb-6">
                <TabsList className="bg-muted/50 p-1 rounded-xl flex h-auto overflow-hidden border border-border/50">
                  <TabsTrigger value="about" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all text-[13px]">Миссия</TabsTrigger>
                  <TabsTrigger value="facilities" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all text-[13px]">Оснащение</TabsTrigger>
                  <TabsTrigger value="leadership" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all text-[13px]">Команда</TabsTrigger>
                </TabsList>
              </div>

              <div className="min-h-[200px]">
                <TabsContent value="about" className="space-y-4 mt-0">
                  <div className="glass-card p-5 rounded-xl space-y-3 border-primary/10">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 shadow-sm">
                        <BookOpen className="w-4 h-4 text-primary" />
                      </div>
                      <h4 className="text-base font-bold text-foreground tracking-tight">Авторская методика</h4>
                    </div>
                    <p className="text-[13px] text-muted-foreground leading-relaxed font-medium">Развиваем критическое мышление и soft skills через современный подход к предметам.</p>
                  </div>
                  <div className="glass-card p-5 rounded-xl space-y-3 border-accent/10">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-accent/10 rounded-lg flex items-center justify-center border border-accent/20 shadow-sm">
                        <Award className="w-4 h-4 text-accent" />
                      </div>
                      <h4 className="text-base font-bold text-foreground tracking-tight">Лицензия и стандарты</h4>
                    </div>
                    <p className="text-[13px] text-muted-foreground leading-relaxed font-medium">Лицензия государственного образца. Высокие результаты на олимпиадах и конкурсах.</p>
                  </div>
                </TabsContent>

                <TabsContent value="facilities" className="space-y-4 mt-0">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-border shadow-sm">
                      <img src={facilitiesClassroomImage} alt="Класс" className="w-full h-full object-cover" />
                    </div>
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-border shadow-sm">
                      <img src={facilitiesHallImage} alt="Зал" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="glass-card p-5 rounded-xl border-border/50">
                    <h4 className="text-base font-bold text-foreground mb-1 tracking-tight">Безопасность и комфорт</h4>
                    <p className="text-[13px] text-muted-foreground leading-relaxed font-medium">Современные классы, зоны для творчества, охраняемая территория и здоровое питание.</p>
                  </div>
                </TabsContent>

                <TabsContent value="leadership" className="space-y-4 mt-0">
                  <div className="glass-card p-5 rounded-xl flex items-center gap-5 border-border/50 shadow-sm">
                    <img src={directorKianImage} alt="Директор" className="w-16 h-16 rounded-full object-cover shadow-md border-2 border-background" />
                    <div>
                      <h4 className="text-base font-bold text-foreground tracking-tight">Киян Юлия Юрьевна</h4>
                      <div className="text-primary font-bold uppercase tracking-widest text-[9px] mt-1">Директор школы</div>
                    </div>
                  </div>
                  <div className="glass-card p-6 rounded-xl border-l-[6px] border-l-primary bg-primary/5 italic text-sm font-medium leading-relaxed text-foreground/80">
                    "Мы создаем будущее, воспитывая поколение лидеров, мыслителей и творцов, готовых к вызовам современного мира."
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