import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SiWhatsapp, SiTelegram } from "react-icons/si";

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    age: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Заявка отправлена!",
      description: "Мы свяжемся с вами в ближайшее время.",
    });
    setFormData({ name: "", phone: "", email: "", age: "", message: "" });
  };

  const sendToWhatsApp = () => {
    const message = encodeURIComponent(
      `Здравствуйте! Меня зовут ${formData.name || "[Имя]"}. Хочу записаться на экскурсию. ${formData.message || ""}`
    );
    window.open(`https://wa.me/79282619928?text=${message}`, "_blank");
  };

  const sendToTelegram = () => {
    window.open("https://t.me/lichnost_PLUS", "_blank");
  };

  const constructorHash = "4f61ac17bbf756654de58429231d443241ac89a38745ebe8760ff57bfecb15e8";
  const iframeSrc = useMemo(
    () => `https://yandex.ru/map-widget/v1/?um=constructor%3A${constructorHash}&source=constructor&scroll=true`,
    []
  );

  return (
    <section id="contacts" className="py-20 relative overflow-hidden bg-background">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-primary font-bold tracking-widest uppercase text-[10px] mb-2 block font-bold">Связь с нами</span>
            <h2 className="text-3xl md:text-5xl font-black text-foreground mb-4 tracking-tighter">Начните обучение у нас</h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-lg mx-auto mb-8 font-medium">
              Оставьте заявку на персональную экскурсию по школе. Мы покажем классы и ответим на все вопросы.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              <Button
                onClick={sendToWhatsApp}
                className="rounded-full bg-[#25D366] hover:bg-[#25D366]/90 text-white px-6 h-10 text-xs font-bold shadow-md active:scale-95 transition-all uppercase tracking-wider"
              >
                <SiWhatsapp className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
              <Button
                onClick={sendToTelegram}
                className="rounded-full bg-[#0088cc] hover:bg-[#0088cc]/90 text-white px-6 h-10 text-xs font-bold shadow-md active:scale-95 transition-all uppercase tracking-wider"
              >
                <SiTelegram className="w-4 h-4 mr-2" />
                Telegram
              </Button>
            </div>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 items-stretch max-w-6xl mx-auto">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="h-full flex flex-col gap-6"
            >
              <div className="glass-card p-6 rounded-2xl space-y-6 border-border/50 shadow-sm flex-1">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-foreground font-bold text-sm mb-0.5 tracking-tight">Адрес</h4>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                      г. Горячий Ключ, пер. Школьный, 27
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center border border-accent/20 shrink-0">
                    <Phone className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="text-foreground font-bold text-sm mb-0.5 tracking-tight">Телефон</h4>
                    <a href="tel:+79282619928" className="text-foreground font-bold text-lg tracking-tighter hover:text-primary transition-colors">
                      +7 (928) 261-99-28
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center border border-border shrink-0">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="text-foreground font-bold text-sm mb-0.5 tracking-tight">Email</h4>
                    <a href="mailto:slichnost5@mail.ru" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors tracking-tight">
                      slichnost5@mail.ru
                    </a>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden border border-border/50 aspect-video shadow-lg relative group">
                <iframe
                  src={iframeSrc}
                  className="w-full h-full border-0 grayscale hover:grayscale-0 transition-all duration-700"
                  title="Location Map"
                />
                <div className="absolute inset-0 pointer-events-none border-4 border-white/10 rounded-2xl" />
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 15 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-3"
          >
            <div className="glass-card p-6 md:p-8 rounded-2xl relative overflow-hidden bg-white/40 dark:bg-card/40 backdrop-blur-md border-border/50 h-full">
              <form onSubmit={handleSubmit} className="relative space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Имя</label>
                    <Input
                      placeholder="Как к вам обращаться?"
                      className="h-10 rounded-xl bg-background border-border/50 text-sm font-medium placeholder:text-muted-foreground/40 px-4 focus:ring-1 ring-primary/20"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Телефон</label>
                    <Input
                      placeholder="+7 (___) ___"
                      className="h-10 rounded-xl bg-background border-border/50 text-sm font-medium placeholder:text-muted-foreground/40 px-4 focus:ring-1 ring-primary/20"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Email</label>
                    <Input
                      placeholder="example@mail.ru"
                      className="h-10 rounded-xl bg-background border-border/50 text-sm font-medium placeholder:text-muted-foreground/40 px-4 focus:ring-1 ring-primary/20"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Возраст ребенка</label>
                    <Input
                      placeholder="Например: 7 лет"
                      className="h-10 rounded-xl bg-background border-border/50 text-sm font-medium placeholder:text-muted-foreground/40 px-4 focus:ring-1 ring-primary/20"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Сообщение</label>
                  <Textarea
                    placeholder="Ваш вопрос или комментарий..."
                    className="min-h-[100px] rounded-xl bg-background border-border/50 text-sm font-medium placeholder:text-muted-foreground/40 p-4 resize-none focus:ring-1 ring-primary/20"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>

                <Button className="w-full h-11 rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-sm transition-all shadow-lg shadow-primary/10 uppercase tracking-widest">
                  Записаться на экскурсию
                </Button>

                <p className="text-[9px] text-center text-muted-foreground uppercase tracking-widest leading-relaxed font-bold opacity-60">
                  Нажимая кнопку, вы подтверждаете согласие на обработку персональных данных
                </p>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Contact;