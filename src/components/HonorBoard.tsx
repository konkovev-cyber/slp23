import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Star, Trophy, Medal } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type HonorItem = {
    id: string;
    name: string;
    achievement: string;
    image_url: string;
    category: string;
    year: string;
};

const CATEGORIES = [
    { id: "all", label: "Все", icon: Star },
    { id: "scientific", label: "Наука", icon: Trophy },
    { id: "sports", label: "Спорт", icon: Medal },
    { id: "creative", label: "Творчество", icon: Award },
];

export default function HonorBoard() {
    const [activeTab, setActiveTab] = useState("all");

    const { data: items = [] } = useQuery({
        queryKey: ["honor_board"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("honor_board" as any)
                .select("*")
                .order("sort_order", { ascending: true });
            if (error) {
                console.error("Error fetching honor board:", error);
                return [];
            }
            return (data as any) as HonorItem[];
        },
    });

    const filteredItems = activeTab === "all"
        ? items
        : items.filter(item => item.category === activeTab);

    if (items.length === 0) return null;

    return (
        <section id="honor-board" className="py-24 bg-muted/30 relative overflow-hidden">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <span className="text-primary font-bold tracking-widest uppercase text-[10px] mb-2 block">Гордость школы</span>
                    <h2 className="text-3xl md:text-5xl font-black text-foreground tracking-tight">Доска почета</h2>
                    <p className="mt-4 text-sm text-muted-foreground max-w-xl mx-auto font-medium">
                        Наши ученики — наша главная ценность. Здесь мы отмечаем тех, кто достиг выдающихся результатов в учебе, спорте и творчестве.
                    </p>
                </motion.div>

                <div className="flex flex-wrap justify-center gap-2 mb-12">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveTab(cat.id)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[12px] font-bold transition-all border ${activeTab === cat.id
                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                                : "bg-background text-muted-foreground border-border hover:border-primary/50"
                                }`}
                        >
                            <cat.icon className="w-3.5 h-3.5" />
                            {cat.label}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                    <AnimatePresence mode="popLayout">
                        {filteredItems.map((item, idx) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.4, delay: idx * 0.05 }}
                            >
                                <Card className="overflow-hidden border-border/50 bg-card group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 rounded-3xl">
                                    <div className="relative aspect-square overflow-hidden bg-muted">
                                        <img
                                            src={item.image_url || "/placeholder.svg"}
                                            alt={item.name}
                                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                                        <div className="absolute top-4 right-4">
                                            <div className="bg-primary/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-widest border border-white/20">
                                                {item.year}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-5 text-center relative">
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                                            <div className="w-12 h-12 bg-background rounded-2xl flex items-center justify-center shadow-xl border border-border group-hover:scale-110 transition-transform">
                                                {(() => {
                                                    const CatIcon = CATEGORIES.find(c => c.id === item.category)?.icon || Star;
                                                    return <CatIcon className="w-6 h-6 text-primary" />;
                                                })()}
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <h3 className="text-lg font-bold text-foreground leading-tight">{item.name}</h3>
                                            <p className="text-xs text-primary font-bold uppercase tracking-widest mt-1 mb-3">
                                                {CATEGORIES.find(c => c.id === item.category)?.label}
                                            </p>
                                            <div className="bg-muted/50 rounded-2xl p-3 border border-border/50">
                                                <p className="text-[11px] text-muted-foreground leading-snug italic font-medium">
                                                    «{item.achievement}»
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
}
