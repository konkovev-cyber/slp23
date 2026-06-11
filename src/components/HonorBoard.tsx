import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Star, Trophy, Medal, X, Calendar } from "lucide-react";

type HonorItem = {
    id: string;
    name: string;
    achievement: string;
    image_url: string;
    category: string;
    year: string;
    description?: string;
};

const CATEGORIES = [
    { id: "all",        label: "Все",        icon: Star   },
    { id: "scientific", label: "Наука",      icon: Trophy },
    { id: "sports",     label: "Спорт",      icon: Medal  },
    { id: "creative",   label: "Творчество", icon: Award  },
];

// ─── Модалка ──────────────────────────────────────────────────────────────────
function HonorModal({ item, onClose }: { item: HonorItem; onClose: () => void }) {
    const cat = CATEGORIES.find(c => c.id === item.category);
    const CatIcon = cat?.icon ?? Star;

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 24 }}
                transition={{ type: "spring", stiffness: 300, damping: 26 }}
                className="bg-white dark:bg-card rounded-3xl shadow-2xl w-full max-w-lg md:max-w-3xl lg:max-w-4xl overflow-hidden flex flex-col md:flex-row md:h-[520px] relative"
                onClick={e => e.stopPropagation()}
            >
                {/* Левая сторона: Фото */}
                <div className="relative w-full md:w-[280px] lg:w-[340px] md:h-full shrink-0 bg-muted overflow-hidden flex-none">
                    {item.image_url ? (
                        <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-72 md:h-full object-cover object-top"
                        />
                    ) : (
                        <div className="w-full h-72 md:h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/15 to-primary/5 text-primary/30">
                            <Star className="w-16 h-16 mb-2 opacity-40 text-primary animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Гордость школы</span>
                        </div>
                    )}
                    {/* Оверлей на мобильных */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent md:hidden" />

                    {/* Имя поверх фото на мобильных */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 md:hidden">
                        <h2 className="text-xl font-black text-white leading-tight drop-shadow">{item.name}</h2>
                        <p className="text-xs font-bold text-white/75 uppercase tracking-widest mt-1">{cat?.label}</p>
                    </div>

                    {/* Год (всегда в углу фото) */}
                    <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[11px] font-bold border border-white/20">
                        <Calendar className="w-3 h-3" /> {item.year}
                    </div>

                    {/* Иконка категории на фото */}
                    <div className="absolute top-4 right-12 w-9 h-9 bg-primary/80 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow">
                        <CatIcon className="w-4 h-4 text-white" />
                    </div>

                    {/* Закрыть на мобильных */}
                    <button onClick={onClose}
                        className="absolute top-4 right-2 w-9 h-9 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all md:hidden">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Правая сторона: Контент */}
                <div className="flex-1 p-6 md:p-8 flex flex-col h-full overflow-hidden relative">
                    {/* Кнопка закрыть на десктопе */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-9 h-9 bg-muted hover:bg-muted-foreground/10 rounded-full hidden md:flex items-center justify-center text-foreground/75 transition-all z-10"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Скроллируемое тело */}
                    <div className="flex-1 overflow-y-auto space-y-5 pr-1 md:pr-2">
                        {/* Имя и звание на десктопе */}
                        <div className="hidden md:block space-y-1.5 pr-6">
                            <h2 className="text-2xl lg:text-3xl font-black text-foreground leading-tight tracking-tight">{item.name}</h2>
                            <p className="text-xs font-bold text-primary uppercase tracking-widest">{cat?.label}</p>
                        </div>

                        {/* Достижение */}
                        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/15 relative">
                            <div className="text-[9px] font-bold text-primary uppercase tracking-widest mb-1.5">Достижение</div>
                            <p className="text-sm font-medium text-foreground leading-relaxed italic">
                                «{item.achievement}»
                            </p>
                        </div>

                        {/* Год + направление */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-muted/40 border border-border/40 hover:bg-muted/60 transition-colors">
                                <Calendar className="w-4 h-4 text-primary shrink-0" />
                                <div>
                                    <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Год</div>
                                    <div className="text-xs font-bold text-foreground">{item.year}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-muted/40 border border-border/40 hover:bg-muted/60 transition-colors">
                                <CatIcon className="w-4 h-4 text-primary shrink-0" />
                                <div>
                                    <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Направление</div>
                                    <div className="text-xs font-bold text-foreground">{cat?.label}</div>
                                </div>
                            </div>
                        </div>

                        {item.description && (
                            <div className="flex items-start gap-3 p-3 rounded-2xl bg-muted/40 border border-border/40 hover:bg-muted/60 transition-colors">
                                <Briefcase className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <div>
                                    <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Подробнее</div>
                                    <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">{item.description}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Карточка-портрет ─────────────────────────────────────────────────────────
function HonorCard({ item, onOpen, index }: { item: HonorItem; onOpen: (i: HonorItem) => void; index: number }) {
    const cat = CATEGORIES.find(c => c.id === item.category);
    const CatIcon = cat?.icon ?? Star;

    return (
        <motion.button
            type="button"
            layout
            initial={{ opacity: 0, scale: 0.93 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.93 }}
            transition={{ duration: 0.35, delay: index * 0.04 }}
            onClick={() => onOpen(item)}
            className="group text-left rounded-2xl border border-border/60 bg-white/60 dark:bg-card/40 backdrop-blur-sm hover:shadow-xl hover:bg-white/90 dark:hover:bg-card/60 transition-all overflow-hidden cursor-pointer w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={`Подробнее: ${item.name}`}
        >
            {/* Фото */}
            <div className="relative aspect-[3/4] bg-muted overflow-hidden">
                {item.image_url ? (
                    <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-muted/50 to-muted dark:from-[#1e1e24] dark:to-background text-muted-foreground/30 group-hover:scale-105 transition-transform duration-500">
                        <Star className="w-10 h-10 mb-2 opacity-40 text-primary animate-pulse" />
                        <span className="text-[9px] font-bold uppercase tracking-wider opacity-60">Гордость школы</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

                {/* Год */}
                <div className="absolute top-3 left-3 bg-primary/80 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border border-white/20">
                    <Calendar className="w-2.5 h-2.5" /> {item.year}
                </div>

                {/* Иконка категории */}
                <div className="absolute top-3 right-3 w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/25 shadow">
                    <CatIcon className="w-3.5 h-3.5 text-white" />
                </div>

                {/* Имя поверх фото */}
                <div className="absolute bottom-0 left-0 right-0 p-3.5">
                    <div className="text-sm font-black text-white leading-tight drop-shadow">{item.name}</div>
                    <div className="text-[10px] font-bold text-white/70 uppercase tracking-wider mt-0.5 truncate">{cat?.label}</div>
                </div>

                {/* Hover-оверлей */}
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white/90 dark:bg-card/90 text-foreground text-xs font-bold px-4 py-2 rounded-full shadow-lg backdrop-blur-sm translate-y-2 group-hover:translate-y-0 transition-transform">
                        Подробнее →
                    </span>
                </div>
            </div>

            {/* Краткое достижение */}
            <div className="p-3.5">
                <p className="text-[11px] text-muted-foreground italic leading-snug line-clamp-2 font-medium">
                    «{item.achievement}»
                </p>
            </div>
        </motion.button>
    );
}

// ─── Основной компонент ───────────────────────────────────────────────────────
export default function HonorBoard() {
    const [activeTab, setActiveTab] = useState("all");
    const [selected, setSelected] = useState<HonorItem | null>(null);

    const { data: items = [] } = useQuery({
        queryKey: ["honor_board"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("honor_board" as any)
                .select("*")
                .order("year", { ascending: false });
            if (error) { console.error("Error fetching honor board:", error); return []; }
            return (data as any) as HonorItem[];
        },
    });

    const filtered = activeTab === "all" ? items : items.filter(i => i.category === activeTab);

    if (items.length === 0) return null;

    return (
        <section id="honor-board" className="py-24 bg-muted/30 relative overflow-hidden">
            <div className="container mx-auto px-4">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="text-center mb-14">
                    <span className="text-primary font-bold tracking-widest uppercase text-[10px] mb-2 block">Гордость школы</span>
                    <h2 className="text-3xl md:text-5xl font-black text-foreground tracking-tight">Доска почёта</h2>
                    <p className="mt-4 text-sm text-muted-foreground max-w-xl mx-auto font-medium">
                        Наши ученики — наша главная ценность. Здесь мы отмечаем тех, кто достиг выдающихся результатов.
                    </p>
                </motion.div>

                {/* Фильтры */}
                <div className="flex flex-wrap justify-center gap-2 mb-10">
                    {CATEGORIES.map(cat => (
                        <button key={cat.id} onClick={() => setActiveTab(cat.id)}
                            className={`flex items-center gap-2 px-5 py-2 rounded-full text-[12px] font-bold transition-all border ${
                                activeTab === cat.id
                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                                    : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:bg-primary/5"
                            }`}>
                            <cat.icon className="w-3.5 h-3.5" />
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Сетка */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-w-6xl mx-auto">
                    <AnimatePresence mode="popLayout">
                        {filtered.map((item, idx) => (
                            <HonorCard key={item.id} item={item} onOpen={setSelected} index={idx} />
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Модалка */}
            <AnimatePresence>
                {selected && <HonorModal item={selected} onClose={() => setSelected(null)} />}
            </AnimatePresence>
        </section>
    );
}
