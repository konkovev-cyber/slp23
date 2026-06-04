import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie } from "lucide-react";

export default function CookieBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem("cookie-consent");
        if (!consent) {
            const timer = setTimeout(() => setIsVisible(true), 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    const accept = () => {
        localStorage.setItem("cookie-consent", "true");
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-6 left-6 right-6 z-50 md:left-auto md:max-w-md"
                >
                    <div className="glass-card p-5 rounded-2xl border-primary/20 shadow-2xl flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-lg">
                                <Cookie className="w-5 h-5 text-primary" />
                            </div>
                            <p className="text-xs font-medium text-foreground leading-snug">
                                Мы используем файлы cookie и сервисы метрик для улучшения работы сайта. Продолжая использование, вы соглашаетесь с нашей <a href="/privacy" className="underline font-bold">Политикой конфиденциальности</a>.
                            </p>
                        </div>
                        <Button onClick={accept} size="sm" className="w-full rounded-full font-bold h-10">
                            Принять и продолжить
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}