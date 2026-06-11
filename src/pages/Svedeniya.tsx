import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    ChevronLeft, ChevronRight, Printer, FileText, FileSpreadsheet,
    File, Download, Eye, X, Phone, Mail, BookOpen, GraduationCap,
    Clock, Award, Building2, MapPin, Globe, Hash, Scale, Calendar,
    Users, UserCheck, Star, Play
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

// ─── Документы раздела ────────────────────────────────────────────────────────
function SectionDocs({ sectionId }: { sectionId: string }) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const { data: docs = [] } = useQuery<DocRow[]>({
        queryKey: ["svedeniya_documents_public", sectionId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("svedeniya_documents")
                .select("id,section_id,title,description,file_url,file_name,file_type,file_size,sort_order")
                .eq("section_id", sectionId).eq("is_visible", true)
                .order("sort_order").order("created_at");
            if (error) { console.error(error); return []; }
            return (data as DocRow[]) || [];
        },
    });
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

// ─── Карточка руководителя ────────────────────────────────────────────────────
function ManagementCard({ p }: { p: Person }) {
    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="group flex gap-5 p-5 rounded-2xl border border-border/60 bg-white/60 dark:bg-card/40 backdrop-blur-sm hover:shadow-lg hover:bg-white/90 dark:hover:bg-card/60 transition-all">
            {/* Фото */}
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted border border-border/60 shrink-0 group-hover:scale-105 transition-transform">
                {p.image_url
                    ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/40">
                        <UserCheck className="w-8 h-8 text-blue-400" />
                    </div>
                }
            </div>
            {/* Инфо */}
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base leading-tight">{p.name}</h3>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mt-0.5">{p.title}</p>
                {p.education  && <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 shrink-0" />{p.education}</p>}
                {p.experience && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 shrink-0" />Стаж: {p.experience}</p>}
                {p.category   && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5"><Award className="w-3.5 h-3.5 shrink-0" />{p.category}</p>}
                {(p.phone || p.email) && (
                    <div className="mt-3 pt-3 border-t border-border/40 space-y-1">
                        {p.phone && <a href={`tel:${p.phone}`} className="text-xs flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"><Phone className="w-3.5 h-3.5 shrink-0" />{p.phone}</a>}
                        {p.email && <a href={`mailto:${p.email}`} className="text-xs flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"><Mail className="w-3.5 h-3.5 shrink-0" />{p.email}</a>}
                    </div>
                )}
                {p.description && <p className="text-xs text-muted-foreground mt-2 italic leading-relaxed line-clamp-3">{p.description}</p>}
            </div>
        </motion.div>
    );
}

// ─── Карточка педагога ────────────────────────────────────────────────────────
function TeacherCard({ p, onVideo }: { p: Person; onVideo: (u: string) => void }) {
    return (
        <motion.div initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }}
            className="group rounded-2xl border border-border/60 bg-white/60 dark:bg-card/40 backdrop-blur-sm hover:shadow-lg hover:bg-white/90 dark:hover:bg-card/60 transition-all overflow-hidden">
            {/* Фото */}
            <div className="relative aspect-[3/4] bg-muted overflow-hidden">
                {p.image_url
                    ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/40 dark:to-emerald-900/40">
                        <Users className="w-14 h-14 text-green-400" />
                    </div>
                }
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                {p.subjects && (
                    <div className="absolute bottom-3 left-3 right-3">
                        <div className="flex flex-wrap gap-1">
                            {p.subjects.split(",").slice(0, 2).map(s => (
                                <span key={s} className="inline-flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                                    <BookOpen className="w-2.5 h-2.5" />{s.trim()}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
                {p.video_url && (
                    <button onClick={() => onVideo(p.video_url!)}
                        className="absolute top-3 right-3 w-9 h-9 bg-black/40 hover:bg-primary backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 transition-all hover:scale-110 shadow">
                        <Play className="w-4 h-4 text-white fill-white" />
                    </button>
                )}
            </div>
            {/* Инфо */}
            <div className="p-4">
                <h3 className="font-bold text-sm leading-tight">{p.name}</h3>
                <p className="text-[11px] text-primary font-semibold uppercase tracking-wider mt-0.5">{p.title}</p>
                <div className="mt-2 space-y-1">
                    {p.education  && <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><GraduationCap className="w-3 h-3 shrink-0" />{p.education}</p>}
                    {p.experience && <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Clock className="w-3 h-3 shrink-0" />Стаж: {p.experience}</p>}
                    {p.category   && <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Star className="w-3 h-3 shrink-0" />{p.category}</p>}
                </div>
                {p.description && <p className="text-[11px] text-muted-foreground mt-2 italic line-clamp-2">{p.description}</p>}
            </div>
        </motion.div>
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

    /* активный раздел */
    const activeId = useMemo(() => {
        const h = location.hash.replace("#", "");
        return SECTIONS.some(s => s.id === h) ? h : SECTIONS[0].id;
    }, [location.hash]);

    useEffect(() => {
        const h = location.hash.replace("#", "");
        if (!h) return;
        document.getElementById(h)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, [location.hash]);

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
                            <span className="text-primary font-bold tracking-widest uppercase text-[10px] mb-2 block">Сведения ОО</span>
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
                                {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
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
                                    {SECTIONS.map((s, idx) => {
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
                            {SECTIONS.map(s => {
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
                                                    ? <div className="grid gap-4 sm:grid-cols-2">
                                                        {managers.map(p => <ManagementCard key={p.id} p={p} />)}
                                                    </div>
                                                    : <Placeholder />
                                            )}

                                            {/* ─── Педагоги ─── */}
                                            {s.type === "teachers" && (
                                                teachers.length > 0
                                                    ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                                        {teachers.map(p => <TeacherCard key={p.id} p={p} onVideo={setVideoUrl} />)}
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
                                            <SectionDocs sectionId={s.id} />
                                        </article>
                                    </section>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </main>

            {/* Видео-модалка */}
            <AnimatePresence>
                {videoUrl && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl"
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
