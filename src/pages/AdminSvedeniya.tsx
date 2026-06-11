import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { Printer, FileDown, Files, Users, UserCheck, Building2, Loader2 } from "lucide-react";
import SvedeniyaDocuments from "@/components/admin/SvedeniyaDocuments";
import PersonsEditor from "@/components/admin/PersonsEditor";
import BasicInfoForm, { BasicInfoData, BASIC_INFO_DEFAULTS } from "@/components/admin/BasicInfoForm";

// ─── конфигурация разделов ───────────────────────────────────────────────────
const SECTIONS = [
    { id: "basic",          title: "Основные сведения",     type: "basic"                 },
    { id: "structure",      title: "Структура и органы",    type: "text"                  },
    { id: "documents",      title: "Документы",             type: "text"                  },
    { id: "education",      title: "Образование",           type: "text"                  },
    { id: "standards",      title: "Стандарты",             type: "text"                  },
    { id: "management",     title: "Руководство",           type: "persons-management"    },
    { id: "teachers",       title: "Пед. состав",           type: "persons-teacher"       },
    { id: "facilities",     title: "Мат.-тех. обеспечение", type: "text"                  },
    { id: "paid-services",  title: "Платные услуги",        type: "text"                  },
    { id: "finance",        title: "Финансы",               type: "text"                  },
    { id: "vacancies",      title: "Вакансии",              type: "text"                  },
    { id: "accessibility",  title: "Доступная среда",       type: "text"                  },
] as const;

type SubTab = "text" | "docs";

// ─── главный компонент ───────────────────────────────────────────────────────
export default function AdminSvedeniya() {
    const { toast }       = useToast();
    const queryClient     = useQueryClient();
    const [contentMap, setContentMap] = useState<Record<string, string>>({});
    const [basicInfo,  setBasicInfo]  = useState<BasicInfoData>(BASIC_INFO_DEFAULTS);
    const [subTab,     setSubTab]     = useState<Record<string, SubTab>>({});

    // ── загрузка ──
    const { data, isLoading: loadingContent } = useQuery({
        queryKey: ["svedeniya_content"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("site_content")
                .select("content")
                .eq("section_name", "svedeniya")
                .maybeSingle();
            if (error) throw error;
            return (data?.content as Record<string, any>) || {};
        },
    });

    useEffect(() => {
        if (!data) return;
        const { __basic_form, ...rest } = data;
        setContentMap(rest as Record<string, string>);
        if (__basic_form) {
            try { setBasicInfo(JSON.parse(__basic_form)); } catch { /* ignore */ }
        }
    }, [data]);

    // ── сохранение ──
    const saveMutation = useMutation({
        mutationFn: async () => {
            const { data: existing } = await supabase
                .from("site_content")
                .select("id")
                .eq("section_name", "svedeniya")
                .maybeSingle();

            const fullContent = {
                ...contentMap,
                __basic_form: JSON.stringify(basicInfo),
            };

            const { error } = await supabase
                .from("site_content")
                .upsert({
                    id:           existing?.id || "svedeniya",
                    section_name: "svedeniya",
                    content:      fullContent as any,
                });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["svedeniya_content"] });
            toast({ title: "Сохранено ✓", description: "Все изменения записаны." });
        },
        onError: (e: any) =>
            toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
    });

    // ── PDF ──
    const printSection = (title: string, html: string) => {
        const w = window.open("", "_blank");
        if (!w) return;
        w.document.write(`<html><head><title>${title}</title>
        <style>body{font-family:sans-serif;padding:40px;line-height:1.6}
        h1{border-bottom:2px solid #eee;padding-bottom:15px}
        .c{white-space:pre-wrap;font-size:14px;color:#444}</style></head>
        <body><h1>${title}</h1><div class="c">${html}</div></body></html>`);
        w.document.close();
        setTimeout(() => w.print(), 400);
    };

    const getSubTab = (id: string) => subTab[id] || "text";
    const setSubTabFor = (id: string, tab: SubTab) =>
        setSubTab(p => ({ ...p, [id]: tab }));

    return (
        <div className="space-y-6">
            <Helmet><title>Сведения об организации</title></Helmet>

            {/* ── Шапка ── */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold">Сведения об организации</h1>
                    <p className="text-sm text-muted-foreground">
                        Руководство и педсостав — здесь. Текст и документы — по разделам.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link to="/admin/instructions">Инструкции</Link>
                    </Button>
                    <Button
                        onClick={() => saveMutation.mutate()}
                        disabled={saveMutation.isPending}
                        className="gap-2"
                    >
                        {saveMutation.isPending
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Сохранение...</>
                            : "Сохранить всё"}
                    </Button>
                </div>
            </div>

            {/* ── Основной блок ── */}
            <Card className="p-6">
                <Tabs defaultValue="basic" className="flex flex-col md:flex-row gap-6 items-start">

                    {/* Боковое меню */}
                    <TabsList className="flex flex-col h-auto items-stretch w-full md:w-56 bg-muted/50 p-2 gap-0.5 md:sticky md:top-4 shrink-0">
                        {SECTIONS.map(s => (
                            <TabsTrigger
                                key={s.id}
                                value={s.id}
                                className="w-full justify-start text-left h-auto py-2 px-3 gap-2 text-xs"
                            >
                                {s.type === "persons-management" &&
                                    <UserCheck className="w-3.5 h-3.5 shrink-0 text-blue-500" />}
                                {s.type === "persons-teacher" &&
                                    <Users className="w-3.5 h-3.5 shrink-0 text-green-500" />}
                                {s.type === "basic" &&
                                    <Building2 className="w-3.5 h-3.5 shrink-0 text-orange-500" />}
                                {s.title}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {/* Контент */}
                    <div className="flex-1 min-w-0 min-h-[500px]">
                        {SECTIONS.map(s => (
                            <TabsContent key={s.id} value={s.id} className="mt-0 space-y-3">

                                {/* ═══ Основные сведения (форма) ═══ */}
                                {s.type === "basic" && (
                                    <>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Building2 className="w-5 h-5 text-orange-500" />
                                            <Label className="text-base font-semibold">{s.title}</Label>
                                        </div>
                                        <BasicInfoForm
                                            value={basicInfo}
                                            onChange={setBasicInfo}
                                        />
                                        <div className="pt-2">
                                            <Button
                                                onClick={() => saveMutation.mutate()}
                                                disabled={saveMutation.isPending}
                                                size="sm"
                                                className="gap-2 w-full"
                                            >
                                                {saveMutation.isPending
                                                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Сохранение...</>
                                                    : "Сохранить основные сведения"}
                                            </Button>
                                        </div>
                                    </>
                                )}

                                {/* ═══ Руководство ═══ */}
                                {s.type === "persons-management" && (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <UserCheck className="w-5 h-5 text-blue-500" />
                                            <Label className="text-base font-semibold">{s.title}</Label>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Карточки руководителей с фото, должностью и контактами.
                                            Отображаются в публичном разделе «Руководство».
                                        </p>
                                        <PersonsEditor roleType="management" />
                                    </>
                                )}

                                {/* ═══ Пед. состав ═══ */}
                                {s.type === "persons-teacher" && (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <Users className="w-5 h-5 text-green-500" />
                                            <Label className="text-base font-semibold">{s.title}</Label>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Карточки педагогов с фото, предметами, образованием и стажем.
                                            Отображаются в публичном разделе «Пед. состав».
                                        </p>
                                        <PersonsEditor roleType="teacher" />
                                    </>
                                )}

                                {/* ═══ Текстовый раздел ═══ */}
                                {s.type === "text" && (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <Label className="text-base font-semibold">{s.title}</Label>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" className="h-8 gap-1.5"
                                                    onClick={() => printSection(s.title, contentMap[s.id] || "")}>
                                                    <Printer className="w-3.5 h-3.5" /> Печать
                                                </Button>
                                                <Button variant="outline" size="sm" className="h-8 gap-1.5"
                                                    onClick={() => printSection(s.title, contentMap[s.id] || "")}>
                                                    <FileDown className="w-3.5 h-3.5" /> PDF
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Подвкладки: Текст / Документы */}
                                        <div className="flex gap-1 border-b">
                                            {(["text", "docs"] as SubTab[]).map(tab => (
                                                <button
                                                    key={tab}
                                                    onClick={() => setSubTabFor(s.id, tab)}
                                                    className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
                                                        getSubTab(s.id) === tab
                                                            ? "border-primary text-primary"
                                                            : "border-transparent text-muted-foreground hover:text-foreground"
                                                    }`}
                                                >
                                                    {tab === "docs" && <Files className="w-3.5 h-3.5" />}
                                                    {tab === "text" ? "Текст раздела" : "Документы"}
                                                </button>
                                            ))}
                                        </div>

                                        {getSubTab(s.id) === "text" ? (
                                            <>
                                                <p className="text-xs text-muted-foreground">
                                                    Поддерживается простой текст и HTML-разметка.
                                                </p>
                                                <Textarea
                                                    className="font-mono text-sm min-h-[420px]"
                                                    value={contentMap[s.id] || ""}
                                                    onChange={e =>
                                                        setContentMap({ ...contentMap, [s.id]: e.target.value })
                                                    }
                                                    placeholder={`Введите содержимое для раздела «${s.title}»…`}
                                                />
                                                <Button
                                                    size="sm" className="gap-2"
                                                    onClick={() => saveMutation.mutate()}
                                                    disabled={saveMutation.isPending}
                                                >
                                                    {saveMutation.isPending
                                                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Сохранение...</>
                                                        : "Сохранить текст"}
                                                </Button>
                                            </>
                                        ) : (
                                            <SvedeniyaDocuments sectionId={s.id} />
                                        )}
                                    </>
                                )}
                            </TabsContent>
                        ))}
                    </div>
                </Tabs>
            </Card>
        </div>
    );
}
