import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Clock, Send, Loader2, CheckCircle2 } from "lucide-react";
import MaxLogo from "@/components/MaxLogo";
import { useContactForm } from "@/hooks/use-contact-form";

const MAX_URL = "https://max.ru/u/f9LHodD0cOKT6ie5z3UjEOeVzc19VegOtnM4T0jP9RThVVqC30DyPA-1NEE";

const Contact = () => {
  const {
    formData,
    setField,
    handlePhoneInput,
    handleBlur,
    fieldErrors,
    formError,
    status,
    submit,
    reset,
    summaryRef,
  } = useContactForm();

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
              <Button asChild variant="gradient" size="pill" className="text-xs font-bold uppercase tracking-wider">
                <a href={MAX_URL} target="_blank" rel="noopener noreferrer">
                  <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                    <MaxLogo className="w-4 h-4" />
                  </span>
                  Написать в MAX
                </a>
              </Button>
              <Button asChild size="pill" className="text-xs font-bold uppercase tracking-wider">
                <a href="tel:+79282619928">
                  <Phone className="w-4 h-4 mr-2" />
                  Позвонить
                </a>
              </Button>
              <Button asChild variant="outline" size="pill" className="text-xs font-bold uppercase tracking-wider">
                <a href="mailto:slichnost5@mail.ru">
                  <Mail className="w-4 h-4 mr-2" />
                  Написать email
                </a>
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
                  <div className="w-10 h-10 bg-gradient-to-br from-primary/15 to-blue-500/15 rounded-xl flex items-center justify-center border border-primary/25 shrink-0">
                    <MaxLogo className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-foreground font-bold text-sm mb-0.5 tracking-tight flex items-center gap-2">
                      Мессенджер MAX
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5">основной</span>
                    </h4>
                    <a href={MAX_URL} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-primary hover:text-blue-600 dark:hover:text-blue-400 transition-colors tracking-tight">
                      Написать нам в MAX →
                    </a>
                  </div>
                </div>

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

              <div className="rounded-2xl overflow-hidden border border-border/50 aspect-video shadow-lg relative group h-[300px]">
                <iframe
                  src={iframeSrc}
                  className="w-full h-full border-0 grayscale dark:invert-[90%] dark:hue-rotate-[180deg] hover:grayscale-0 dark:hover:invert-0 dark:hover:hue-rotate-0 transition-all duration-700"
                  title="Location Map"
                />
                <div className="absolute bottom-3 right-3 z-10 transition-transform duration-300 hover:scale-105">
                  <Button asChild size="sm" className="rounded-full bg-white/90 dark:bg-card/90 text-foreground hover:bg-white border border-border/50 text-[10px] uppercase tracking-wider font-bold h-8 shadow-md">
                    <a href="https://yandex.ru/maps/?text=Горячий+Ключ,+переулок+Школьный,+27" target="_blank" rel="noopener noreferrer">
                      Открыть на картах
                    </a>
                  </Button>
                </div>
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
              {status === "success" ? (
                <div role="status" className="relative h-full flex flex-col items-center justify-center text-center space-y-5 py-10">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/25 flex items-center justify-center"
                  >
                    <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </motion.div>
                  <h3 className="text-2xl font-black text-foreground tracking-tighter">Заявка отправлена!</h3>
                  <p className="text-sm text-muted-foreground font-medium max-w-sm leading-relaxed">
                    Мы получили заявку и свяжемся с вами в ближайшее время. Для быстрой связи напишите нам в MAX.
                  </p>
                  <Button variant="outline" size="pill" className="text-xs font-bold uppercase tracking-wider" onClick={reset}>
                    Отправить ещё одну
                  </Button>
                </div>
              ) : (
              <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="relative space-y-5">
                {formError && (
                  <div
                    ref={summaryRef}
                    tabIndex={-1}
                    role="alert"
                    className="rounded-xl bg-destructive/10 border border-destructive/25 px-4 py-3 text-xs font-semibold text-destructive focus:outline-none"
                  >
                    {formError}
                  </div>
                )}
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label htmlFor="contact-c-name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Имя</label>
                    <Input
                      id="contact-c-name"
                      placeholder="Как к вам обращаться?"
                      className="h-10 rounded-xl bg-background border-border/50 text-sm font-medium placeholder:text-muted-foreground/40 px-4 focus:ring-1 ring-primary/20"
                      value={formData.name}
                      onChange={(e) => setField("name", e.target.value)}
                      onBlur={() => handleBlur("name")}
                      aria-invalid={!!fieldErrors.name}
                      aria-describedby={fieldErrors.name ? "contact-c-name-err" : undefined}
                      required
                    />
                    {fieldErrors.name && <p role="alert" className="text-[10px] font-semibold text-destructive">{fieldErrors.name}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="contact-c-phone" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Телефон</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" aria-hidden="true" />
                      <Input
                        id="contact-c-phone"
                        placeholder="+7 (___) ___-__-__"
                        className={`h-10 rounded-xl bg-background border-border/50 text-sm font-medium placeholder:text-muted-foreground/40 pl-10 pr-4 focus:ring-1 ring-primary/20 ${fieldErrors.phone ? "border-destructive/60" : ""}`}
                        value={formData.phone}
                        onChange={(e) => handlePhoneInput(e.target.value)}
                        onBlur={() => handleBlur("phone")}
                        aria-invalid={!!fieldErrors.phone}
                        aria-describedby={fieldErrors.phone ? "contact-c-phone-err" : undefined}
                        inputMode="tel"
                        autoComplete="tel"
                        required
                      />
                    </div>
                    {fieldErrors.phone && <p role="alert" className="text-[10px] font-semibold text-destructive">{fieldErrors.phone}</p>}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label htmlFor="contact-c-email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" aria-hidden="true" />
                      <Input
                        id="contact-c-email"
                        type="email"
                        placeholder="example@mail.ru"
                        className={`h-10 rounded-xl bg-background border-border/50 text-sm font-medium placeholder:text-muted-foreground/40 pl-10 pr-4 focus:ring-1 ring-primary/20 ${fieldErrors.email ? "border-destructive/60" : ""}`}
                        value={formData.email}
                        onChange={(e) => setField("email", e.target.value)}
                        onBlur={() => handleBlur("email")}
                        aria-invalid={!!fieldErrors.email}
                        aria-describedby={fieldErrors.email ? "contact-c-email-err" : undefined}
                        autoComplete="email"
                      />
                    </div>
                    {fieldErrors.email && <p role="alert" className="text-[10px] font-semibold text-destructive">{fieldErrors.email}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="contact-c-age" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Возраст ребенка</label>
                    <Input
                      id="contact-c-age"
                      placeholder="Например: 7 лет"
                      className="h-10 rounded-xl bg-background border-border/50 text-sm font-medium placeholder:text-muted-foreground/40 px-4 focus:ring-1 ring-primary/20"
                      value={formData.age}
                      onChange={(e) => setField("age", e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contact-c-message" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Сообщение</label>
                  <Textarea
                    id="contact-c-message"
                    placeholder="Ваш вопрос или комментарий..."
                    className="min-h-[100px] rounded-xl bg-background border-border/50 text-sm font-medium placeholder:text-muted-foreground/40 p-4 resize-none focus:ring-1 ring-primary/20"
                    value={formData.message}
                    onChange={(e) => setField("message", e.target.value)}
                  />
                </div>

                {/* Honeypot: скрытое поле для ботов */}
                <input
                  type="text"
                  name="company_website"
                  value={formData.company_website}
                  onChange={(e) => setField("company_website", e.target.value)}
                  className="absolute -left-[9999px] h-0 w-0 opacity-0 pointer-events-none"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />

                <Button type="submit" variant="gradient" className="w-full h-11 rounded-full font-bold text-sm uppercase tracking-widest" disabled={status === "submitting"}>
                  {status === "submitting" ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                      Отправляем...
                    </>
                  ) : (
                    <>Записаться на экскурсию</>
                  )}
                </Button>

                <p className="text-[9px] text-center text-muted-foreground uppercase tracking-widest leading-relaxed font-bold opacity-60">
                  Нажимая кнопку, вы подтверждаете согласие на обработку персональных данных
                </p>
              </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Contact;