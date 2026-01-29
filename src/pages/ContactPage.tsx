import { useRef, useMemo, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { SiWhatsapp, SiTelegram } from "react-icons/si";
import { motion } from "framer-motion";

export default function ContactPage() {
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        age: "",
        message: "",
    });

    // Map logic
    const constructorHash = "4f61ac17bbf756654de58429231d443241ac89a38745ebe8760ff57bfecb15e8";
    const iframeSrc = `https://yandex.ru/map-widget/v1/?um=constructor%3A${constructorHash}&source=constructor&scroll=true`;

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
            `Здравствуйте! Меня зовут ${formData.name || '[Имя]'}. Хочу записаться на экскурсию. ${formData.message || ''}`
        );
        window.open(`https://wa.me/79282619928?text=${message}`, '_blank');
    };

    const sendToTelegram = () => {
        window.open("https://t.me/julia_slp", "_blank");
    };

    return (
        <div className="min-h-screen bg-background">
            <Helmet>
                <title>Контакты — Личность ПЛЮС</title>
                <meta name="description" content="Контакты школы «Личность ПЛЮС»: адрес, телефон, email и карта проезда." />
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

                                    <div className="flex gap-3 mt-8">
                                        <Button onClick={sendToWhatsApp} size="sm" className="flex-1 gap-2 rounded-full h-10 font-bold bg-[#25D366] hover:bg-[#25D366]/90 text-white shadow-sm" aria-label="Написать в WhatsApp">
                                            <SiWhatsapp className="w-4 h-4" /> WhatsApp
                                        </Button>
                                        <Button onClick={sendToTelegram} size="sm" variant="outline" className="flex-1 gap-2 rounded-full h-10 font-bold border-border shadow-sm" aria-label="Открыть Telegram">
                                            <SiTelegram className="w-4 h-4" /> Telegram
                                        </Button>
                                    </div>
                                </article>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="rounded-xl overflow-hidden h-[300px] border border-border shadow-sm"
                            >
                                <iframe src={iframeSrc} width="100%" height="100%" frameBorder="0" title="Карта проезда к школе Личность ПЛЮС" />
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

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="grid md:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label htmlFor="contact-name" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Как к вам обращаться?</label>
                                            <Input id="contact-name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Имя" className="h-11 rounded-lg bg-background/50 focus:ring-1 ring-primary/20" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label htmlFor="contact-phone" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Контактный телефон</label>
                                            <Input id="contact-phone" required type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+7 (___) ___-__-__" className="h-11 rounded-lg bg-background/50 focus:ring-1 ring-primary/20" />
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label htmlFor="contact-email" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Email адрес</label>
                                            <Input id="contact-email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="example@mail.ru" className="h-11 rounded-lg bg-background/50 focus:ring-1 ring-primary/20" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label htmlFor="contact-age" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Возраст ребёнка</label>
                                            <Input id="contact-age" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} placeholder="Например: 7 лет" className="h-11 rounded-lg bg-background/50 focus:ring-1 ring-primary/20" />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label htmlFor="contact-message" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Ваше сообщение</label>
                                        <Textarea id="contact-message" value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} placeholder="Задайте ваш вопрос..." rows={3} className="rounded-lg bg-background/50 focus:ring-1 ring-primary/20 resize-none p-3" />
                                    </div>

                                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-full shadow-md shadow-primary/20 transition-all text-base">
                                        Отправить запрос <Send className="w-4 h-4 ml-2" aria-hidden="true" />
                                    </Button>

                                    <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest leading-relaxed">
                                        Нажимая кнопку, вы соглашаетесь на обработку персональных данных
                                    </p>
                                </form>
                            </article>
                        </motion.section>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}
