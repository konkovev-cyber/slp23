import { useEffect, useMemo, useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    ChevronLeft, Printer, FileText, FileSpreadsheet,
    File, Download, Eye, X, Phone, Mail, BookOpen, GraduationCap,
    Clock, Award, Building2, MapPin, Globe, Hash, Scale, Calendar,
    Users, UserCheck, Star, Play, Briefcase
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import type { BasicInfoData } from "@/components/admin/BasicInfoForm";

// ─── типы ────────────────────────────────────────────────────────────────────
interface DocRow {
    id: string; section_id: string; title: string; description: string | null;
    file_url: string; file_name: string; file_type: string; file_size: number | null;
    sort_order: number;
}
interface Person {
    id: string; name: string; title: string; description: string | null;
    image_url: string | null; video_url: string | null; sort_order: number;
    role_type: string; phone: string | null; email: string | null;
    education: string | null; category: string | null; experience: string | null;
    subjects: string | null;
}

// ─── вспомогалки ─────────────────────────────────────────────────────────────
function buildCanonical(p: string) { return new URL(p, window.location.origin).toString(); }

function formatSize(b: number | null) {
    if (!b) return "";
    if (b < 1024) return `${b} Б`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} КБ`;
    return `${(b / 1024 / 1024).toFixed(1)} МБ`;
}

function getFileIcon(t: string) {
    if (t === "pdf")              return <FileText       className="w-7 h-7 text-red-500"   />;
    if (t === "xls" || t === "xlsx") return <FileSpreadsheet className="w-7 h-7 text-green-600" />;
    return <File className="w-7 h-7 text-blue-500" />;
}

function typeBadge(t: string) {
    const cls: Record<string, string> = {
        pdf:  "bg-red-50   text-red-700   border-red-200   dark:bg-red-950/30   dark:text-red-400   dark:border-red-800",
        xls:  "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800",
        xlsx: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800",
    };
    return (
        <span className={cn("inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider shrink-0",
            cls[t] || "bg-blue-50 text-blue-700 border-blue-200")}>
            {t}
        </span>
    );
}

// ─── Документ-карточка ────────────────────────────────────────────────────────
function DocCard({ doc, onPreview }: { doc: DocRow; onPreview: (u: string) => void }) {
    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="group flex items-start gap-4 p-4 rounded-xl border border-border/60 bg-white/60 dark:bg-card/40 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-card/60 hover:shadow-md transition-all">
            <div className="shrink-0 flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-muted/80 to-muted border border-border/50 group-hover:scale-105 transition-transform">
                {getFileIcon(doc.file_type)}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm text-foreground leading-snug">{doc.title}</h3>
                    {typeBadge(doc.file_type)}
                </div>
                {doc.description && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{doc.description}</p>}
                {doc.file_size && <p className="text-[11px] text-muted-foreground/60 mt-1">{formatSize(doc.file_size)}</p>}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
                {doc.file_type === "pdf" && (
                    <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs"
                        onClick={() => onPreview(doc.file_url)}>
                        <Eye className="w-3.5 h-3.5" /><span className="hidden sm:inline">Просмотр</span>
                    </Button>
                )}
                <Button variant="default" size="sm" className="h-8 gap-1.5 text-xs" asChild>
                    <a href={doc.file_url} download={doc.file_name} target="_blank" rel="noreferrer">
                        <Download className="w-3.5 h-3.5" /><span className="hidden sm:inline">Скачать</span>
                    </a>
                </Button>
            </div>
        </motion.div>
    );
}

function isHtmlEmpty(html?: string) {
    if (!html) return true;
    const cleanText = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, "").trim();
    return cleanText === "";
}

// ─── Документы раздела ────────────────────────────────────────────────────────
function SectionDocs({ docs }: { docs: DocRow[] }) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    if (!docs.length) return null;
    return (
        <>
            {previewUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <motion.div initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-card rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3.5 border-b bg-muted/30">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-red-500" />
                                <span className="font-semibold text-sm">Просмотр документа</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" asChild>
                                    <a href={previewUrl} download target="_blank" rel="noreferrer">
                                        <Download className="w-3 h-3" /> Скачать
                                    </a>
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreviewUrl(null)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        <iframe src={previewUrl} className="flex-1 w-full" title="Просмотр" />
                    </motion.div>
                </div>
            )}
            <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1 bg-border/50" />
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-2">Документы раздела</span>
                    <div className="h-px flex-1 bg-border/50" />
                </div>
                {docs.map(doc => <DocCard key={doc.id} doc={doc} onPreview={setPreviewUrl} />)}
            </div>
        </>
    );
}

// ─── Модальная карточка персоны ───────────────────────────────────────────────
function PersonModal({ p, onClose, onVideo }: { p: Person; onClose: () => void; onVideo?: (u: string) => void }) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: "spring", stiffness: 300, damping: 26 }}
                className="bg-white dark:bg-card rounded-3xl shadow-2xl w-full max-w-lg md:max-w-3xl lg:max-w-4xl overflow-hidden flex flex-col md:flex-row md:h-[550px] relative"
                onClick={e => e.stopPropagation()}
            >
                {/* Левая сторона: Изображение */}
                <div className="relative w-full md:w-[280px] lg:w-[340px] md:h-full shrink-0 bg-muted overflow-hidden flex-none">
                    {p.image_url ? (
                        <img
                            src={p.image_url}
                            alt={p.name}
                            className="w-full h-72 md:h-full object-cover object-top"
                        />
                    ) : (
                        <div className="w-full h-72 md:h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/15 to-primary/5 text-primary/30">
                            <UserCheck className="w-24 h-24" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary/40 mt-2">Личность ПЛЮС</span>
                        </div>
                    )}
                    {/* Градиентный оверлей для текста на мобильных */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent md:hidden" />
                    
                    {/* Имя поверх фото на мобильных */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 md:hidden">
                        <h2 className="text-xl font-black text-white leading-tight drop-shadow">{p.name}</h2>
                        <p className="text-xs font-bold text-white/80 uppercase tracking-widest mt-1">{p.title}</p>
                    </div>

                    {/* Видео кнопка поверх фото */}
                    {p.video_url && onVideo && (
                        <button
                            onClick={() => onVideo(p.video_url!)}
                            className="absolute top-4 left-4 w-10 h-10 bg-primary/95 hover:bg-primary text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                            title="Смотреть видео-визитку"
                        >
                            <Play className="w-4 h-4 fill-white ml-0.5" />
                        </button>
                    )}

                    {/* Кнопка закрыть на мобильных */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-9 h-9 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all md:hidden"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Правая сторона: Информация */}
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
                            <h2 className="text-2xl lg:text-3xl font-black text-foreground leading-tight tracking-tight">{p.name}</h2>
                            <p className="text-xs font-bold text-primary uppercase tracking-widest">{p.title}</p>
                        </div>

                        {/* Сетка характеристик */}
                        <div className="grid grid-cols-2 gap-3">
                            {p.experience && (
                                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-muted/40 border border-border/40 hover:bg-muted/60 transition-colors">
                                    <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Стаж</div>
                                        <div className="text-xs font-bold text-foreground">{p.experience}</div>
                                    </div>
                                </div>
                            )}
                            {p.category && (
                                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-muted/40 border border-border/40 hover:bg-muted/60 transition-colors">
                                    <Award className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Категория</div>
                                        <div className="text-xs font-bold text-foreground">{p.category}</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {p.subjects && (
                            <div className="flex items-start gap-3 p-3 rounded-2xl bg-muted/40 border border-border/40 hover:bg-muted/60 transition-colors">
                                <BookOpen className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <div>
                                    <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Предметы</div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {p.subjects.split(",").map(s => (
                                            <span key={s} className="px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full">{s.trim()}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {p.education && (
                            <div className="flex items-start gap-3 p-3 rounded-2xl bg-muted/40 border border-border/40 hover:bg-muted/60 transition-colors">
                                <GraduationCap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <div>
                                    <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Образование</div>
                                    <div className="text-xs font-medium text-foreground/90">{p.education}</div>
                                </div>
                            </div>
                        )}

                        {p.description && (
                            <div className="flex items-start gap-3 p-3 rounded-2xl bg-muted/40 border border-border/40 hover:bg-muted/60 transition-colors">
                                <Briefcase className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <div>
                                    <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">О себе</div>
                                    <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">{p.description}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Контакты (всегда внизу) */}
                    {(p.phone || p.email) && (
                        <div className="flex gap-3 pt-4 mt-auto border-t border-border/50">
                            {p.phone && (
                                <Button asChild className="flex-1 rounded-full h-10 gap-2 font-bold shadow-md hover:shadow-lg transition-all text-xs">
                                    <a href={`tel:${p.phone}`}><Phone className="w-3.5 h-3.5" /> Позвонить</a>
                                </Button>
                            )}
                            {p.email && (
                                <Button asChild variant="outline" className="flex-1 rounded-full h-10 gap-2 font-bold transition-all text-xs">
                                    <a href={`mailto:${p.email}`}><Mail className="w-3.5 h-3.5" /> Email</a>
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Единая карточка персоны (портрет) ───────────────────────────────────────
function PersonCard({ p, onOpen }: { p: Person; onOpen: (p: Person) => void }) {
    const defaultIcon = p.role_type === "management" ? UserCheck : Users;
    const DefaultIcon = defaultIcon;
    return (
        <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            onClick={() => onOpen(p)}
            className="group text-left rounded-2xl border border-border/60 bg-white/60 dark:bg-card/40 backdrop-blur-sm hover:shadow-xl hover:bg-white/90 dark:hover:bg-card/60 transition-all overflow-hidden cursor-pointer w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={`Открыть профиль: ${p.name}`}
        >
            {/* Фото */}
            <div className="relative aspect-[3/4] bg-muted overflow-hidden">
                {p.image_url
                    ? <img src={p.image_url} alt={p.name}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                        <DefaultIcon className="w-16 h-16 text-primary/30" />
                    </div>
                }
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

                {/* Предметы */}
                {p.subjects && (
                    <div className="absolute bottom-14 left-3 right-3">
                        <div className="flex flex-wrap gap-1">
                            {p.subjects.split(",").slice(0, 2).map(s => (
                                <span key={s} className="inline-flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                                    <BookOpen className="w-2.5 h-2.5" />{s.trim()}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Имя поверх фото */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="text-sm font-black text-white leading-tight drop-shadow">{p.name}</div>
                    <div className="text-[10px] font-bold text-white/75 uppercase tracking-wider mt-0.5 truncate">{p.title}</div>
                </div>

                {/* Видео-кнопка */}
                {p.video_url && (
                    <div className="absolute top-3 right-3 w-8 h-8 bg-primary/80 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow">
                        <Play className="w-3.5 h-3.5 text-white fill-white" />
                    </div>
                )}

                {/* Hover-оверлей «подробнее» */}
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white/90 dark:bg-card/90 text-foreground text-xs font-bold px-4 py-2 rounded-full shadow-lg backdrop-blur-sm translate-y-2 group-hover:translate-y-0 transition-transform">
                        Подробнее →
                    </span>
                </div>
            </div>

            {/* Короткая инфо */}
            <div className="p-3.5">
                <div className="flex items-center gap-1.5">
                    {p.experience && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />{p.experience}
                        </span>
                    )}
                    {p.category && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 ml-auto">
                            <Star className="w-2.5 h-2.5 text-amber-500" />{p.category}
                        </span>
                    )}
                </div>
            </div>
        </motion.button>
    );
}

// ─── Основные сведения ────────────────────────────────────────────────────────
function BasicInfoBlock({ info }: { info: BasicInfoData }) {
    const rows: { icon: React.ElementType; label: string; value: string | undefined }[] = [
        { icon: Building2,  label: "Полное наименование",            value: info.full_name             },
        { icon: Building2,  label: "Краткое наименование",           value: info.short_name            },
        { icon: MapPin,     label: "Юридический адрес",              value: info.legal_address         },
        { icon: MapPin,     label: "Фактический адрес",              value: info.actual_address        },
        { icon: Phone,      label: "Телефон",                        value: info.phone                 },
        { icon: Phone,      label: "Факс",                           value: info.fax                   },
        { icon: Mail,       label: "Электронная почта",              value: info.email                 },
        { icon: Globe,      label: "Сайт",                           value: info.website               },
        { icon: Clock,      label: "Режим работы",                   value: info.work_hours            },
        { icon: Hash,       label: "ИНН",                            value: info.inn                   },
        { icon: Hash,       label: "ОГРН",                           value: info.ogrn                  },
        { icon: Hash,       label: "КПП",                            value: info.kpp                   },
        { icon: Scale,      label: "Лицензия №",                     value: info.license_number        },
        { icon: Calendar,   label: "Дата выдачи лицензии",           value: info.license_date ? new Date(info.license_date).toLocaleDateString("ru-RU") : undefined },
        { icon: Scale,      label: "Аккредитация №",                 value: info.accreditation_number  },
        { icon: Calendar,   label: "Дата аккредитации",              value: info.accreditation_date ? new Date(info.accreditation_date).toLocaleDateString("ru-RU") : undefined },
    ].filter(r => r.value);

    if (!rows.length) return null;

    return (
        <div className="space-y-2 mt-2">
            {info.description && (
                <p className="text-sm text-foreground/80 leading-relaxed mb-4 p-4 rounded-xl bg-muted/40 border border-border/40 italic">
                    {info.description}
                </p>
            )}
            <dl className="divide-y divide-border/40 rounded-xl border border-border/60 overflow-hidden bg-white/60 dark:bg-card/40">
                {rows.map(({ icon: Icon, label, value }) => (
                    <div key={label} className="grid grid-cols-[auto_1fr] gap-3 items-start px-5 py-3 hover:bg-muted/30 transition-colors">
                        <dt className="flex items-center gap-2 text-xs font-semibold text-muted-foreground whitespace-nowrap min-w-[200px]">
                            <Icon className="w-3.5 h-3.5 shrink-0 text-primary/60" />
                            {label}
                        </dt>
                        <dd className="text-sm text-foreground font-medium">
                            {label === "Сайт"
                                ? <a href={value} target="_blank" rel="noreferrer" className="text-primary hover:underline">{value}</a>
                                : label === "Электронная почта"
                                ? <a href={`mailto:${value}`} className="text-primary hover:underline">{value}</a>
                                : label === "Телефон" || label === "Факс"
                                ? <a href={`tel:${value}`} className="text-primary hover:underline">{value}</a>
                                : value}
                        </dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

// ─── Список разделов ──────────────────────────────────────────────────────────
const SECTIONS = [
    { id: "basic",         title: "Основные сведения",     icon: Building2,  type: "basic"      },
    { id: "structure",     title: "Структура и органы",    icon: Building2,  type: "text"       },
    { id: "documents",     title: "Документы",             icon: FileText,   type: "text"       },
    { id: "education",     title: "Образование",           icon: BookOpen,   type: "text"       },
    { id: "standards",     title: "Стандарты",             icon: Award,      type: "text"       },
    { id: "management",    title: "Руководство",           icon: UserCheck,  type: "management" },
    { id: "teachers",      title: "Педагоги",              icon: Users,      type: "teachers"   },
    { id: "facilities",    title: "Оснащение",             icon: Building2,  type: "text"       },
    { id: "paid-services", title: "Платные услуги",        icon: Hash,       type: "text"       },
    { id: "finance",       title: "Финансы",               icon: Scale,      type: "text"       },
    { id: "vacancies",     title: "Вакансии",              icon: Users,      type: "text"       },
    { id: "accessibility", title: "Доступность",           icon: MapPin,     type: "text"       },
];

// ─── Основная страница ────────────────────────────────────────────────────────
export default function Svedeniya() {
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
    const openPerson = useCallback((p: Person) => setSelectedPerson(p), []);

    /* данные */
    const { data: rawContent = {} } = useQuery({
        queryKey: ["svedeniya_content_public"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("site_content").select("content")
                .eq("section_name", "svedeniya").maybeSingle();
            if (error) { console.error(error); return {}; }
            return (data?.content as Record<string, any>) || {};
        },
    });

    const contentMap = useMemo<Record<string, string>>(() => {
        const { __basic_form, ...rest } = rawContent;
        return rest;
    }, [rawContent]);

    const basicInfo = useMemo<BasicInfoData | null>(() => {
        try { return rawContent.__basic_form ? JSON.parse(rawContent.__basic_form) : null; }
        catch { return null; }
    }, [rawContent]);

    const { data: managers = [] } = useQuery<Person[]>({
        queryKey: ["persons_public", "management"],
        queryFn: async () => {
            const { data, error } = await supabase.from("teachers" as any)
                .select("*").eq("role_type", "management").order("sort_order");
            if (error) { console.error(error); return []; }
            return (data ?? []) as Person[];
        },
    });

    const { data: teachers = [] } = useQuery<Person[]>({
        queryKey: ["persons_public", "teacher"],
        queryFn: async () => {
            const { data, error } = await supabase.from("teachers" as any)
                .select("*").eq("role_type", "teacher").order("sort_order");
            if (error) { console.error(error); return []; }
            return (data ?? []) as Person[];
        },
    });

    const { data: allDocs = [] } = useQuery<DocRow[]>({
        queryKey: ["svedeniya_documents_all_public"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("svedeniya_documents")
                .select("id,section_id,title,description,file_url,file_name,file_type,file_size,sort_order")
                .eq("is_visible", true)
                .order("sort_order").order("created_at");
            if (error) { console.error(error); return []; }
            return (data as DocRow[]) || [];
        },
    });

    const docsBySection = useMemo(() => {
        const map: Record<string, DocRow[]> = {};
        allDocs.forEach(d => {
            if (!map[d.section_id]) map[d.section_id] = [];
            map[d.section_id].push(d);
        });
        return map;
    }, [allDocs]);

    const visibleSections = useMemo(() => {
        return SECTIONS.filter(s => {
            const hasDocs = (docsBySection[s.id] || []).length > 0;
            if (s.id === "basic") {
                const hasBasic = basicInfo && Object.entries(basicInfo).some(([k, v]) => v !== null && v !== undefined && String(v).trim() !== "");
                const hasText = !isHtmlEmpty(contentMap[s.id]);
                return hasBasic || hasText || hasDocs;
            }
            if (s.id === "management") {
                return managers.length > 0 || hasDocs;
            }
            if (s.id === "teachers") {
                return teachers.length > 0 || hasDocs;
            }
            const hasText = !isHtmlEmpty(contentMap[s.id]);
            return hasText || hasDocs;
        });
    }, [docsBySection, basicInfo, contentMap, managers, teachers]);

    /* активный раздел */
    const activeId = useMemo(() => {
        const h = location.hash.replace("#", "");
        return visibleSections.some(s => s.id === h) ? h : (visibleSections[0]?.id || "");
    }, [location.hash, visibleSections]);

    useEffect(() => {
        const h = location.hash.replace("#", "");
        if (!h) return;
        const timer = setTimeout(() => {
            const el = document.getElementById(h);
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [location.hash, visibleSections]);

    const canonical = buildCanonical("/svedeniya");

    return (
        <div className="min-h-screen bg-background">
            <Helmet>
                <title>Сведения — Личность ПЛЮС</title>
                <meta name="description" content="Раздел обязательных сведений образовательной организации." />
                <link rel="canonical" href={canonical} />
            </Helmet>

            <div className="print-hidden"><Navigation /></div>

            <main className="pt-24 pb-16">
                <div className="container mx-auto px-4">
                    <Breadcrumbs />

                    {/* Заголовок */}
                    <motion.header initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                        className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between border-b pb-8">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Основные сведения</h1>
                            <p className="mt-2 text-sm text-muted-foreground max-w-2xl font-medium">
                                Раздел обязательных сведений образовательной организации.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 print-hidden">
                            <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2 rounded-full font-bold h-9">
                                <Printer className="h-3.5 w-3.5" /> Печать
                            </Button>
                            <Button variant="secondary" size="sm"
                                onClick={() => setCollapsed(v => !v)}
                                className="gap-2 hidden lg:inline-flex rounded-full font-bold h-9">
                                <ChevronLeft className="h-3.5 w-3.5" />
                                {collapsed ? "Меню" : "Скрыть"}
                            </Button>
                        </div>
                    </motion.header>

                    <div className="grid gap-8 lg:grid-cols-[auto_1fr]">
                        {/* Сайдбар */}
                        <aside role="navigation" aria-label="Навигация по разделам"
                            className={cn("print-hidden lg:sticky lg:top-24 lg:self-start transition-all duration-300",
                                collapsed ? "lg:w-12" : "lg:w-72")}>
                            <div className="glass-card p-2 rounded-xl border-border/50">
                                <nav aria-label="Меню раздела" className="space-y-0.5">
                                    {visibleSections.map((s, idx) => {
                                        const Icon = s.icon;
                                        return (
                                            <a key={s.id} href={`#${s.id}`}
                                                className={cn("flex items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-bold transition-all",
                                                    s.id === activeId
                                                        ? "bg-primary text-white shadow-sm"
                                                        : "text-muted-foreground hover:bg-muted hover:text-foreground")}
                                                title={collapsed ? s.title : undefined}>
                                                <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded-md border text-[10px] shrink-0",
                                                    s.id === activeId ? "border-white/20 bg-white/10" : "border-border bg-background")}>
                                                    {idx + 1}
                                                </span>
                                                {!collapsed && <span className="truncate">{s.title}</span>}
                                            </a>
                                        );
                                    })}
                                </nav>
                            </div>
                        </aside>

                        {/* Контент */}
                        <div className="space-y-6">
                            {visibleSections.map(s => {
                                const Icon = s.icon;
                                return (
                                    <section key={s.id} id={s.id} className="scroll-mt-24" aria-label={s.title}>
                                        <article className="glass-card p-6 md:p-8 rounded-2xl shadow-sm border-border/50 bg-white/50 dark:bg-card/30 backdrop-blur-sm">

                                            {/* Заголовок раздела */}
                                            <div className="flex items-center gap-3 mb-1">
                                                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 border border-primary/20">
                                                    <Icon className="w-4 h-4 text-primary" />
                                                </div>
                                                <h2 className="text-xl font-bold text-foreground tracking-tight">{s.title}</h2>
                                            </div>
                                            <p className="text-[13px] text-muted-foreground font-medium mb-6 ml-12">
                                                {s.id === "basic"         && "Ключевая информация об организации: наименование, адрес, контакты и реквизиты."}
                                                {s.id === "structure"     && "Описание структуры управления, подразделений и органов управления."}
                                                {s.id === "documents"     && "Учредительные документы, локальные акты, правила приёма, устав и прочее."}
                                                {s.id === "education"     && "Сведения о реализуемых программах, формах обучения и возрастных группах."}
                                                {s.id === "standards"     && "Информация о стандартах и используемых подходах к обучению."}
                                                {s.id === "management"    && "Сведения о руководителях, контакты, образование."}
                                                {s.id === "teachers"      && "Информация о педагогах, квалификации и направлениях работы."}
                                                {s.id === "facilities"    && "Помещения, оборудование, учебные материалы и условия реализации."}
                                                {s.id === "paid-services" && "Порядок оказания платных услуг, стоимость, договоры и условия."}
                                                {s.id === "finance"       && "Сведения о финансировании, отчётности и хозяйственной деятельности."}
                                                {s.id === "vacancies"     && "Информация о наличии свободных мест по программам."}
                                                {s.id === "accessibility" && "Условия доступности для обучающихся с ОВЗ."}
                                            </p>

                                            {/* ─── Основные сведения ─── */}
                                            {s.type === "basic" && (
                                                basicInfo && Object.values(basicInfo).some(Boolean)
                                                    ? <BasicInfoBlock info={basicInfo} />
                                                    : contentMap[s.id]
                                                        ? <div className="prose prose-sm max-w-none dark:prose-invert"
                                                            dangerouslySetInnerHTML={{ __html: contentMap[s.id] }} />
                                                        : <Placeholder />
                                            )}

                                            {/* ─── Руководство ─── */}
                                            {s.type === "management" && (
                                                managers.length > 0
                                                    ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                                        {managers.map(p => <PersonCard key={p.id} p={p} onOpen={openPerson} />)}
                                                    </div>
                                                    : <Placeholder />
                                            )}

                                            {/* ─── Педагоги ─── */}
                                            {s.type === "teachers" && (
                                                teachers.length > 0
                                                    ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                                        {teachers.map(p => <PersonCard key={p.id} p={p} onOpen={openPerson} />)}
                                                    </div>
                                                    : <Placeholder />
                                            )}

                                            {/* ─── Текстовый раздел ─── */}
                                            {s.type === "text" && (
                                                contentMap[s.id]
                                                    ? <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/80"
                                                        dangerouslySetInnerHTML={{ __html: contentMap[s.id] }} />
                                                    : <Placeholder />
                                            )}

                                            {/* Документы раздела */}
                                            <SectionDocs docs={docsBySection[s.id] || []} />
                                        </article>
                                    </section>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </main>

            {/* Модалка персоны */}
            <AnimatePresence>
                {selectedPerson && (
                    <PersonModal
                        p={selectedPerson}
                        onClose={() => setSelectedPerson(null)}
                        onVideo={url => { setSelectedPerson(null); setVideoUrl(url); }}
                    />
                )}
            </AnimatePresence>

            {/* Видео-модалка */}
            <AnimatePresence>
                {videoUrl && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl"
                        onClick={() => setVideoUrl(null)}>
                        <div className="relative w-full max-w-4xl aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10"
                            onClick={e => e.stopPropagation()}>
                            <iframe src={videoUrl.replace("watch?v=", "embed/")}
                                className="w-full h-full" allowFullScreen
                                allow="autoplay; encrypted-media" />
                            <button onClick={() => setVideoUrl(null)}
                                className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-md transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="print-hidden"><Footer /></div>
        </div>
    );
}

function Placeholder() {
    return (
        <div className="p-6 border border-dashed rounded-xl bg-muted/20 text-muted-foreground text-xs text-center font-medium italic">
            Информация уточняется…
        </div>
    );
}
