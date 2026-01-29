import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, MessageSquare, X, Send, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { SiWhatsapp, SiTelegram } from "react-icons/si";

const FloatingActions = () => {
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 400);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Заявка отправлена",
            description: "Мы перезвоним вам в ближайшее время.",
        });
        setShowForm(false);
        setIsOpen(false);
    };

    const actions = [
        {
            id: 'wa',
            icon: <SiWhatsapp className="w-5 h-5" />,
            label: "WhatsApp",
            href: "https://wa.me/79282619928",
            color: "bg-[#25D366] text-white"
        },
        {
            id: 'tg',
            icon: <SiTelegram className="w-5 h-5" />,
            label: "Telegram",
            href: "https://t.me/lichnost_PLUS",
            color: "bg-[#0088cc] text-white"
        },
        {
            id: 'call',
            icon: <Phone className="w-5 h-5" />,
            label: "Позвонить",
            href: "tel:+79282619928",
            color: "bg-primary text-white"
        },
        {
            id: 'form',
            icon: <Send className="w-5 h-5" />,
            label: "Заявка",
            onClick: () => setShowForm(true),
            color: "bg-foreground text-background"
        },
    ];

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3">

            {/* Refined Minimalist Form Popup */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="mb-2"
                    >
                        <div className="w-[300px] bg-white dark:bg-card border border-border rounded-2xl p-6 shadow-2xl overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-3xl rounded-full" />
                            <div className="relative space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-base tracking-tight text-foreground">Обратная связь</h4>
                                    <button onClick={() => setShowForm(false)} className="p-1 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit} className="space-y-3">
                                    <Input placeholder="Ваше имя" className="h-10 rounded-lg bg-muted/50 border-transparent focus:border-primary transition-all text-sm font-medium" required />
                                    <Input placeholder="Телефон" type="tel" className="h-10 rounded-lg bg-muted/50 border-transparent focus:border-primary transition-all text-sm font-medium" required />
                                    <Button className="w-full h-10 rounded-full font-bold shadow-md shadow-primary/10 text-sm">
                                        Отправить
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Elegant Action Bubbles */}
            <AnimatePresence>
                {isOpen && !showForm && (
                    <motion.div className="flex flex-col gap-2 mb-2">
                        {actions.map((action, i) => (
                            <motion.div
                                key={action.id}
                                initial={{ opacity: 0, x: 20, scale: 0.8 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 20, scale: 0.8 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <a
                                    href={action.href}
                                    onClick={action.onClick}
                                    target={action.href ? "_blank" : undefined}
                                    rel="noopener noreferrer"
                                    className={`flex items-center justify-center w-11 h-11 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all outline-none ${action.color}`}
                                    title={action.label}
                                >
                                    {action.icon}
                                </a>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col gap-2 items-end">
                {/* Main FAB - Now ABOVE the scroll button */}
                <button
                    onClick={() => {
                        if (showForm) setShowForm(false);
                        else setIsOpen(!isOpen);
                    }}
                    className={`w-13 h-13 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-90 hover:scale-105 border-4 border-background ${isOpen || showForm ? "bg-muted text-foreground" : "bg-primary text-white"
                        }`}
                >
                    {isOpen || showForm ? <X className="w-5 h-5 md:w-6 md:h-6" /> : <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />}
                </button>

                {/* Scroll Top Button - Now BELOW the main FAB */}
                <AnimatePresence>
                    {showScrollTop && (
                        <motion.button
                            initial={{ opacity: 0, y: 10, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.8 }}
                            onClick={scrollToTop}
                            className="w-10 h-10 bg-white dark:bg-card border border-border rounded-full flex items-center justify-center shadow-md hover:bg-muted text-foreground transition-all"
                            title="Вверх"
                        >
                            <ArrowUp className="w-4 h-4" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default FloatingActions;
