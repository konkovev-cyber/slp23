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
  const openMapUrl = useMemo(
    () => `https://yandex.ru/maps/?um=constructor%3A${constructorHash}&source=constructorLink`,
    []
  );

  return (
    <section id="contacts" className="py-20 relative overflow-hidden bg-background">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-primary font-bold tracking-widest uppercase text-[11px] mb-3 block">Свяжитесь с нами</span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">Начните обучение у нас</h2>
            <p className="text-base text-muted-foreground max-w-xl mx-auto mb-8 font-medium">
              Оставьте заявку, и мы пригласим вас на персональную экскурсию по школе.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Button
                onClick={sendToWhatsApp}
                className="rounded-full bg-[#25D366] hover:bg-[#25D366]/90 text-white px-8 h-12 text-sm font-bold shadow-md active:scale-95 transition-all"
              >
                <SiWhatsapp className="w-5 h-5 mr-2" />
                WhatsApp
              </Button>
              <Button
                onClick={sendToTelegram}
                className="rounded-full bg-[#0088cc] hover:bg-[#0088cc]/90 text-white px-8 h-12 text-sm font-bold shadow-md active:scale-95 transition-all"
              >
                <SiTelegram className="w-5 h-5 mr-2" />
                Telegram
              </Button>
            </div>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-5 gap-10 items-start max-w-6xl mx-auto">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="glass-card p-8 rounded-2xl space-y-8">
                <div className="flex items-start gap-5">
                  <div className="w-11 h-11 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-foreground font-bold text-base mb-1">Адрес</h4>
                    <p className="text-sm text-muted-foreground font-medium">
                      г. Горячий Ключ, пер. Школьный, 27
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="w-11 h-11 bg-accent/10 rounded-full flex items-center justify-center border border-accent/20 shrink-0">
                    <Phone className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="text-foreground font-bold text-base mb-1">Телефон</h4>
                    <a href="tel:+79282619928" className="text-foreground font-bold text-xl tracking-tight hover:text-primary transition-colors">
                      +7 (928) 261-99-28
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="w-11 h-11 bg-success/10 rounded-full flex items-center justify-center border border-success/20 shrink-0">
                    <Mail className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <h4 className="text-foreground font-bold text-base mb-1">Email</h4>
                    <a href="mailto:slichnost5@mail.ru" className="text-sm text-muted-foreground font-semibold hover:text-primary transition-colors">
                      slichnost5@mail.ru
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="rounded-2xl overflow-hidden border border-border aspect-video shadow-sm">
              <iframe
                src={iframeSrc}
                className="w-full h-full border-0"
                title="Location Map"
              />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-3"
          >
            <div className="glass-card p-8 md:p-10 rounded-2xl relative overflow-hidden bg-white/50 backdrop-blur-sm">
              <form onSubmit={handleSubmit} className="relative space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Имя</label>
                    <Input
                      placeholder="Как к вам обращаться?"
                      className="h-12 rounded-xl bg-background border-border text-foreground font-medium placeholder:text-muted-foreground/50 px-4 focus:ring-1 ring-primary/20"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Телефон</label>
                    <Input
                      placeholder="+7 (___) ___"
                      className="h-12 rounded-xl bg-background border-border text-foreground font-medium placeholder:text-muted-foreground/50 px-4 focus:ring-1 ring-primary/20"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Email</label>
                    <Input
                      placeholder="example@mail.ru"
                      className="h-12 rounded-xl bg-background border-border text-foreground font-medium placeholder:text-muted-foreground/50 px-4 focus:ring-1 ring-primary/20"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Возраст ребенка</label>
                    <Input
                      placeholder="Например: 7 лет"
                      className="h-12 rounded-xl bg-background border-border text-foreground font-medium placeholder:text-muted-foreground/50 px-4 focus:ring-1 ring-primary/20"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Сообщение</label>
                  <Textarea
                    placeholder="Ваш вопрос или комментарий..."
                    className="min-h-[120px] rounded-xl bg-background border-border text-foreground font-medium placeholder:text-muted-foreground/50 p-4 resize-none focus:ring-1 ring-primary/20"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>

                <Button className="w-full h-12 rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-base transition-all shadow-md">
                  Записаться на экскурсию
                </Button>

                <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest leading-relaxed">
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