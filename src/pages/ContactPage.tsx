import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Mail, Clock, Send, Loader2, CheckCircle2 } from "lucide-react";
import MaxLogo from "@/components/MaxLogo";
import { motion } from "framer-motion";
import { useContactForm } from "@/hooks/use-contact-form";

const MAX_URL = "https://max.ru/u/f9LHodD0cOKT6ie5z3UjEOeVzc19VegOtnM4T0jP9RThVVqC30DyPA-1NEE";

export default function ContactPage() {
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

    // Map logic
    const constructorHash = "4f61ac17bbf756654de58429231d443241ac89a38745ebe8760ff57bfecb15e8";
    const iframeSrc = `https://yandex.ru/map-widget/v1/?um=constructor%3A${constructorHash}&source=constructor&scroll=true`;

    return (
        <div className="min-h-screen bg-background">
            <Helmet>
                <title>Контакты — Личность ПЛЮС</title>
                <meta name="description" content="Контакты школы «Личность ПЛЮС»: мессенджер MAX, адрес, телефон, email и карта проезда." />
                <script type="application/ld+json">
                  {`
                    {
                      "@context": "https://schema.org",
                      "@type": "School",
                      "name": "Личность ПЛЮС",
                      "alternateName": "Частная школа Личность ПЛЮС в Горячем Ключе",
                      "url": "https://slp23.ru/contact",
                      "logo": "https://slp23.ru/logo.png",
                      "image": "https://slp23.ru/logo.png",
                      "description": "Контакты школы «Личность ПЛЮС»: мессенджер MAX, адрес, телефон, email и карта проезда.",
                      "address": {
                        "@type": "PostalAddress",
                        "streetAddress": "переулок Школьный, 27",
                        "addressLocality": "Горячий Ключ",
                        "addressRegion": "Краснодарский край",
                        "postalCode": "353290",
                        "addressCountry": "RU"
                      },
                      "geo": {
                        "@type": "GeoCoordinates",
                        "latitude": "44.629392",
                        "longitude": "39.124239"
                      },
                      "telephone": "+7-928-261-99-28",
                      "email": "slichnost5@mail.ru",
                      "openingHoursSpecification": [
                        {
                          "@type": "OpeningHoursSpecification",
                          "dayOfWeek": [
                            "Monday",
                            "Tuesday",
                            "Wednesday",
                            "Thursday",
                            "Friday"
                          ],
                          "opens": "08:00",
                          "closes": "17:00"
                        }
                      ]
                    }
                  `}
                </script>
            </Helmet>

            <Navigation />

            <main className="pt-28 pb-16">
                <div className="container mx-auto px-4">
                    <Breadcrumbs />

                    <motion.header
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12 text-center"
                    >
                        <span className="text-primary font-bold tracking-widest uppercase text-[10px] mb-2 block">Связь с нами</span>
                        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">Наши контакты</h1>
                        <p className="text-base text-muted-foreground max-w-xl mx-auto font-medium">
                            Мы находимся в Горячем Ключе. Всегда рады видеть вас и ответить на любые вопросы!
                        </p>
                    </motion.header>

                    <div className="grid lg:grid-cols-5 gap-8 max-w-6xl mx-auto">

                        {/* Contact Info & Map */}
                        <section className="lg:col-span-2 space-y-6" aria-label="Контактная информация и карта">
                            <motion.div
                                initial={{ opacity: 0, x: -15 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                <article className="glass-card p-7 rounded-xl space-y-7 shadow-sm">
                                    <h2 className="text-xl font-bold mb-2 tracking-tight">Информация</h2>
                                    <div className="space-y-6">
                                        <div className="flex items-start gap-4">
                                            <div className="bg-gradient-to-br from-primary/15 to-blue-500/15 p-2.5 rounded-lg border border-primary/25" aria-hidden="true"><MaxLogo className="w-5 h-5" /></div>
                                            <div>
                                                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5 flex items-center gap-2">
                                                    Мессенджер MAX
                                                    <span className="text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5">основной</span>
                                                </div>
                                                <a href={MAX_URL} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-primary hover:text-blue-600 dark:hover:text-blue-400 transition-all">Написать нам в MAX →</a>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="bg-primary/10 p-2.5 rounded-lg border border-primary/20" aria-hidden="true"><MapPin className="text-primary w-5 h-5" /></div>
                                            <div>
                                                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Адрес</div>
                                                <address className="text-sm font-bold text-foreground leading-tight not-italic">г. Горячий Ключ, переулок Школьный, 27</address>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="bg-accent/10 p-2.5 rounded-lg border border-accent/20" aria-hidden="true"><Phone className="text-accent w-5 h-5" /></div>
                                            <div>
                                                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Телефон</div>
                                                <a href="tel:+79282619928" className="text-lg font-bold text-foreground hover:text-primary transition-all tracking-tight">+7 (928) 261-99-28</a>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="bg-success/10 p-2.5 rounded-lg border-success/20 border" aria-hidden="true"><Mail className="text-success w-5 h-5" /></div>
                                            <div>
                                                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Электронная почта</div>
                                                <a href="mailto:slichnost5@mail.ru" className="text-sm font-bold text-foreground hover:text-primary transition-all">slichnost5@mail.ru</a>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="bg-primary/10 p-2.5 rounded-lg border-primary/20 border" aria-hidden="true"><Clock className="text-primary w-5 h-5" /></div>
                                            <div>
                                                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">График работы</div>
                                                <div className="text-sm font-bold text-foreground">Пн-Пт: 08:00 - 17:00</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3 mt-8">
                                        <Button asChild size="sm" variant="gradient" className="gap-2 rounded-full h-10 font-bold" aria-label="Написать в MAX">
                                            <a href={MAX_URL} target="_blank" rel="noopener noreferrer">
                                                <MaxLogo className="w-4 h-4 mr-2" /> Написать в MAX
                                            </a>
                                        </Button>
                                        <Button asChild size="sm" className="gap-2 rounded-full h-10 font-bold" aria-label="Позвонить">
                                            <a href="tel:+79282619928">
                                                <Phone className="w-4 h-4" /> Позвонить
                                            </a>
                                        </Button>
                                        <Button asChild size="sm" variant="outline" className="gap-2 rounded-full h-10 font-bold" aria-label="Написать email">
                                            <a href="mailto:slichnost5@mail.ru">
                                                <Mail className="w-4 h-4" /> Email
                                            </a>
                                        </Button>
                                    </div>
                                </article>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="rounded-2xl overflow-hidden h-[300px] border border-border/50 shadow-lg relative group"
                            >
                                <iframe
                                    src={iframeSrc}
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    className="w-full h-full border-0 grayscale dark:invert-[90%] dark:hue-rotate-[180deg] hover:grayscale-0 dark:hover:invert-0 dark:hover:hue-rotate-0 transition-all duration-700"
                                    title="Карта проезда к школе Личность ПЛЮС"
                                />
                                <div className="absolute bottom-3 right-3 z-10 transition-transform duration-300 hover:scale-105">
                                    <Button asChild size="sm" className="rounded-full bg-white/90 dark:bg-card/90 text-foreground hover:bg-white border border-border/50 text-[10px] uppercase tracking-wider font-bold h-8 shadow-md">
                                        <a href="https://yandex.ru/maps/?text=Горячий+Ключ,+переулок+Школьный,+27" target="_blank" rel="noopener noreferrer">
                                            Открыть на картах
                                        </a>
                                    </Button>
                                </div>
                                <div className="absolute inset-0 pointer-events-none border-4 border-white/10 rounded-2xl" />
                            </motion.div>
                        </section>

                        {/* Form */}
                        <motion.section
                            initial={{ opacity: 0, x: 15 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:col-span-3"
                            aria-label="Форма обратной связи"
                        >
                            <article className="glass-card p-8 md:p-10 rounded-xl relative overflow-hidden bg-white/60 dark:bg-card/40 backdrop-blur-md border-border shadow-sm">
                                <h2 className="text-xl font-bold mb-2 tracking-tight">Обратная связь</h2>
                                <p className="text-sm text-muted-foreground mb-8 font-medium">Оставьте свои данные, и мы перезвоним вам для консультации.</p>

                                {status === "success" ? (
                                    <div role="status" className="text-center py-12 space-y-6">
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ duration: 0.4 }}
                                            className="w-16 h-16 mx-auto rounded-full bg-green-500/10 border border-green-500/25 flex items-center justify-center"
                                        >
                                            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                                        </motion.div>
                                        <h3 className="text-2xl font-black text-foreground tracking-tighter">Заявка отправлена!</h3>
                                        <p className="text-sm text-muted-foreground font-medium max-w-sm mx-auto">
                                            Мы получили заявку и свяжемся с вами в ближайшее время. Для быстрой связи напишите нам в MAX.
                                        </p>
                                        <Button variant="outline" size="pill" className="text-xs font-bold uppercase tracking-wider" onClick={reset}>
                                            Отправить ещё одну
                                        </Button>
                                    </div>
                                ) : (
                                <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-5">
                                    {formError && (
                                        <div
                                            ref={summaryRef}
                                            role="alert"
                                            tabIndex={-1}
                                            className="rounded-xl bg-destructive/10 border border-destructive/25 px-4 py-3 text-xs font-semibold text-destructive focus:outline-none"
                                        >
                                            {formError}
                                        </div>
                                    )}
                                    <div className="grid md:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label htmlFor="contact-name" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Как к вам обращаться?</label>
                                            <Input id="contact-name" required value={formData.name} onChange={e => setField("name", e.target.value)} onBlur={() => handleBlur("name")} aria-invalid={!!fieldErrors.name} aria-describedby={fieldErrors.name ? "contact-name-err" : undefined} placeholder="Имя" className={`h-12 md:h-11 rounded-lg bg-background/50 focus:ring-2 ring-primary/20 text-base ${fieldErrors.name ? "border-destructive/60" : ""}`} />
                                            {fieldErrors.name && <p role="alert" id="contact-name-err" className="text-[10px] font-semibold text-destructive">{fieldErrors.name}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label htmlFor="contact-phone" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Контактный телефон</label>
                                            <div className="relative">
                                                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" aria-hidden="true" />
                                                <Input id="contact-phone" required type="tel" value={formData.phone} onChange={e => handlePhoneInput(e.target.value)} onBlur={() => handleBlur("phone")} aria-invalid={!!fieldErrors.phone} aria-describedby={fieldErrors.phone ? "contact-phone-err" : undefined} placeholder="+7 (___) ___-__-__" className={`h-12 md:h-11 rounded-lg bg-background/50 focus:ring-2 ring-primary/20 text-base pl-11 pr-4 ${fieldErrors.phone ? "border-destructive/60" : ""}`} />
                                            </div>
                                            {fieldErrors.phone && <p role="alert" id="contact-phone-err" className="text-[10px] font-semibold text-destructive">{fieldErrors.phone}</p>}
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label htmlFor="contact-email" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Email адрес</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" aria-hidden="true" />                                                <Input id="contact-email" type="email" value={formData.email} onChange={e => setField("email", e.target.value)} onBlur={() => handleBlur("email")} aria-invalid={!!fieldErrors.email} aria-describedby={fieldErrors.email ? "contact-email-err" : undefined} placeholder="example@mail.ru" className={`h-12 md:h-11 rounded-lg bg-background/50 focus:ring-2 ring-primary/20 text-base pl-11 pr-4 ${fieldErrors.email ? "border-destructive/60" : ""}`} />
                                            </div>
                                            {fieldErrors.email && <p role="alert" id="contact-email-err" className="text-[10px] font-semibold text-destructive">{fieldErrors.email}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label htmlFor="contact-age" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Возраст ребёнка</label>
                                            <Input id="contact-age" value={formData.age} onChange={e => setField("age", e.target.value)} placeholder="Например: 7 лет" className="h-12 md:h-11 rounded-lg bg-background/50 focus:ring-2 ring-primary/20 text-base" autoComplete="off" />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label htmlFor="contact-message" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Ваше сообщение</label>
                                        <Textarea id="contact-message" value={formData.message} onChange={e => setField("message", e.target.value)} placeholder="Задайте ваш вопрос..." rows={4} className="rounded-lg bg-background/50 focus:ring-2 ring-primary/20 resize-none p-4 text-base min-h-[120px]" />
                                    </div>

                                    {/* Honeypot: скрытое поле для ботов */}
                                    <input
                                        type="text"
                                        name="company_website"
                                        value={formData.company_website}
                                        onChange={e => setField("company_website", e.target.value)}
                                        className="absolute -left-[9999px] h-0 w-0 opacity-0 pointer-events-none"
                                        tabIndex={-1}
                                        autoComplete="off"
                                        aria-hidden="true"
                                    />

                                    <Button type="submit" variant="gradient" className="w-full font-bold h-14 md:h-12 rounded-full text-base" disabled={status === "submitting"}>
                                        {status === "submitting" ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                                                Отправляем...
                                            </>
                                        ) : (
                                            <>
                                                Отправить запрос <Send className="w-4 h-4 ml-2" aria-hidden="true" />
                                            </>
                                        )}
                                    </Button>

                                    <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest leading-relaxed">
                                        Нажимая кнопку, вы соглашаетесь на обработку персональных данных
                                    </p>
                                </form>
                                )}
                            </article>
                        </motion.section>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}
