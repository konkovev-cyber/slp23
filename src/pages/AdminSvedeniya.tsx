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
import { FileText, Printer, FileDown } from "lucide-react";

const SECTIONS = [
    { id: "basic", title: "Основные сведения" },
    { id: "structure", title: "Структура и органы" },
    { id: "documents", title: "Документы" },
    { id: "education", title: "Образование" },
    { id: "standards", title: "Стандарты" },
    { id: "management", title: "Руководство" },
    { id: "teachers", title: "Пед. состав" },
    { id: "facilities", title: "Мат.-тех. обеспечение" },
    { id: "paid-services", title: "Платные услуги" },
    { id: "finance", title: "Финансы" },
    { id: "vacancies", title: "Вакансии" },
    { id: "accessibility", title: "Доступная среда" },
];

export default function AdminSvedeniya() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [contentMap, setContentMap] = useState<Record<string, string>>({});

    const { data } = useQuery({
        queryKey: ["svedeniya_content"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("site_content")
                .select("content")
                .eq("section_name", "svedeniya")
                .maybeSingle();

            if (error) throw error;
            return data?.content as Record<string, string> || {};
        },
    });

    useEffect(() => {
        if (data) {
            setContentMap(data);
        }
    }, [data]);

    const saveMutation = useMutation({
        mutationFn: async () => {
            const { data: existing } = await supabase
                .from("site_content")
                .select("id")
                .eq("section_name", "svedeniya")
                .maybeSingle();

            const targetId = existing?.id || "svedeniya";

            const { error: e } = await supabase
                .from("site_content")
                .upsert({
                    id: targetId,
                    section_name: "svedeniya",
                    content: contentMap as any
                });

            if (e) throw e;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["svedeniya_content"] });
            toast({ title: "Сохранено", description: "Сведения обновлены." });
        },
        onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
    });

    const handleExportPdf = (sectionTitle: string, htmlContent: string) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        printWindow.document.write(`
            <html>
                <head>
                    <title>${sectionTitle}</title>
                    <style>
                        body { font-family: sans-serif; padding: 40px; line-height: 1.6; }
                        h1 { color: #1a1a1a; border-bottom: 2px solid #eee; padding-bottom: 15px; margin-bottom: 30px; }
                        .content { white-space: pre-wrap; font-size: 14px; color: #444; }
                        @media print {
                            body { padding: 0; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <h1>${sectionTitle}</h1>
                    <div class="content">${htmlContent}</div>
                </body>
            </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
        }, 500);
    };

    return (
        <div className="space-y-6">
            <Helmet><title>Редактор сведений</title></Helmet>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Основные сведения</h1>
                    <p className="text-muted-foreground text-sm">Редактирование содержимого разделов "Сведения об организации"</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link to="/admin/instructions">Инструкции</Link>
                    </Button>
                    <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                        {saveMutation.isPending ? "Сохранение..." : "Сохранить всё"}
                    </Button>
                </div>
            </div>

            <Card className="p-6">
                <Tabs defaultValue={SECTIONS[0].id} className="flex flex-col md:flex-row gap-6 items-start">
                    <TabsList className="flex flex-col h-auto items-stretch justify-start w-full md:w-64 bg-muted/50 p-2 gap-1 md:sticky md:top-0">
                        {SECTIONS.map(s => (
                            <TabsTrigger key={s.id} value={s.id} className="w-full justify-start text-left whitespace-normal h-auto py-2">
                                {s.title}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    <div className="flex-1 min-h-[500px] w-full">
                        {SECTIONS.map(s => (
                            <TabsContent key={s.id} value={s.id} className="mt-0 h-full flex flex-col gap-2">
                                <div className="flex items-center justify-between mb-2">
                                    <Label className="text-lg font-semibold">{s.title}</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 gap-2"
                                            onClick={() => handleExportPdf(s.title, contentMap[s.id] || "")}
                                        >
                                            <Printer className="w-3.5 h-3.5" /> Печать
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 gap-2"
                                            onClick={() => {
                                                toast({ title: "Генерация...", description: "Документ готов к печати/сохранению" });
                                                handleExportPdf(s.title, contentMap[s.id] || "");
                                            }}
                                        >
                                            <FileDown className="w-3.5 h-3.5" /> PDF
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground mb-2">Поддерживается простой текст и HTML.</p>
                                <Textarea
                                    className="flex-1 font-mono text-sm min-h-[400px]"
                                    value={contentMap[s.id] || ""}
                                    onChange={(e) => setContentMap({ ...contentMap, [s.id]: e.target.value })}
                                    placeholder={`Введите содержимое для раздела "${s.title}"...`}
                                />
                            </TabsContent>
                        ))}
                    </div>
                </Tabs>
            </Card>
        </div>
    );
}
