import { useRef, useMemo, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { SiWhatsapp, SiTelegram } from "react-icons/si";

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
    const scriptSrc = `https://api-maps.yandex.ru/services/constructor/1.0/js/?um=constructor%3A${constructorHash}&width=100%25&height=400&lang=ru_RU&scroll=true`;
    const iframeSrc = `https://yandex.ru/map-widget/v1/?um=constructor%3A${constructorHash}&source=constructor&scroll=true`;
    const openMapUrl = `https://yandex.ru/maps/?um=constructor%3A${constructorHash}&source=constructorLink`;

    const mapHostRef = useRef<HTMLDivElement | null>(null);
    const [mapFailed, setMapFailed] = useState(false);

    useEffect(() => {
        const host = mapHostRef.current;
        if (!host) return;

        setMapFailed(false);
        host.innerHTML = "";

        const script = document.createElement("script");
        script.type = "text/javascript";
        script.async = true;
        script.charset = "utf-8";
        script.src = scriptSrc;
        script.onerror = () => setMapFailed(true);
        host.appendChild(script);

        return () => {
            host.innerHTML = "";
        };
    }, [scriptSrc]);

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
                    <header className="mb-10 text-center">
                        <h1 className="text-4xl font-bold text-foreground mb-4">Наши контакты</h1>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Мы находимся в городе Горячий Ключ. Всегда рады видеть вас и ответить на вопросы!
                        </p>
                    </header>

                    <div className="grid lg:grid-cols-2 gap-12">

                        {/* Contact Info & Map */}
                        <div className="space-y-8">
                            <Card className="p-6">
                                <h2 className="text-2xl font-bold mb-6">Информация</h2>
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="bg-primary/10 p-3 rounded-lg"><MapPin className="text-primary w-6 h-6" /></div>
                                        <div>
                                            <div className="font-semibold mb-1">Адрес</div>
                                            <div className="text-muted-foreground">Краснодарский край, г. Горячий Ключ,<br />переулок Школьный, д. 27</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="bg-accent/10 p-3 rounded-lg"><Phone className="text-accent w-6 h-6" /></div>
                                        <div>
                                            <div className="font-semibold mb-1">Телефон</div>
                                            <a href="tel:+79282619928" className="text-muted-foreground hover:text-primary transition-colors">+7 (928) 261-99-28</a>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="bg-success/10 p-3 rounded-lg"><Mail className="text-success w-6 h-6" /></div>
                                        <div>
                                            <div className="font-semibold mb-1">Email</div>
                                            <a href="mailto:slichnost5@mail.ru" className="text-muted-foreground hover:text-primary transition-colors">slichnost5@mail.ru</a>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="bg-primary/10 p-3 rounded-lg"><Clock className="text-primary w-6 h-6" /></div>
                                        <div>
                                            <div className="font-semibold mb-1">График работы</div>
                                            <div className="text-muted-foreground">Пн-Пт: 08:00 - 17:00<br />Сб-Вс: Выходной</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-8">
                                    <Button onClick={sendToWhatsApp} variant="secondary" className="flex-1 gap-2">
                                        <SiWhatsapp className="w-5 h-5" /> WhatsApp
                                    </Button>
                                    <Button onClick={sendToTelegram} variant="outline" className="flex-1 gap-2">
                                        <SiTelegram className="w-5 h-5" /> Telegram
                                    </Button>
                                </div>
                            </Card>

                            <Card className="overflow-hidden h-[400px] border-none shadow-lg">
                                {mapFailed ? (
                                    <iframe src={iframeSrc} width="100%" height="100%" frameBorder="0" />
                                ) : (
                                    <div ref={mapHostRef} className="w-full h-full" />
                                )}
                            </Card>
                        </div>

                        {/* Form */}
                        <div>
                            <Card className="p-8 sticky top-28">
                                <h2 className="text-2xl font-bold mb-2">Напишите нам</h2>
                                <p className="text-muted-foreground mb-6">Оставьте заявку на экскурсию или задайте вопрос.</p>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Ваше имя</label>
                                        <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Иван" />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Телефон</label>
                                        <Input required type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+7 (999) 000-00-00" />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Возраст ребёнка (необязательно)</label>
                                        <Input value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} placeholder="7 лет" />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Сообщение</label>
                                        <Textarea value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} placeholder="Здравствуйте, хочу узнать про..." rows={4} />
                                    </div>
                                    <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" size="lg">
                                        <Send className="w-4 h-4 mr-2" /> Отправить
                                    </Button>
                                    <p className="text-xs text-center text-muted-foreground">Нажимая кнопку, вы соглашаетесь на обработку персональных данных</p>
                                </form>
                            </Card>
                        </div>

                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
