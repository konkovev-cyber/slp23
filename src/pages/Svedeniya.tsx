import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

type Section = {
  id: string;
  title: string;
  lead: string;
};

function buildCanonical(pathname: string) {
  return new URL(pathname, window.location.origin).toString();
}

export default function Svedeniya() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const { data: contentMap = {} } = useQuery({
    queryKey: ["svedeniya_content_public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("content")
        .eq("section_name", "svedeniya")
        .maybeSingle();

      if (error) {
        console.error("Error fetching svedeniya:", error);
        return {};
      }
      return (data?.content as Record<string, string>) || {};
    },
  });

  const sections: Section[] = useMemo(
    () => [
      { id: "basic", title: "Основные сведения", lead: "Ключевая информация об организации: наименование, адрес, контакты и режим работы." },
      { id: "structure", title: "Структура и органы", lead: "Описание структуры управления, подразделений и органов управления." },
      { id: "documents", title: "Документы", lead: "Учредительные документы, локальные акты, правила приёма, устав и прочее." },
      { id: "education", title: "Образование", lead: "Сведения о реализуемых программах, формах обучения и возрастных группах." },
      { id: "standards", title: "Стандарты", lead: "Информация о стандартах/требованиях и используемых подходах к обучению." },
      { id: "management", title: "Руководство", lead: "Сведения о руководителе(ях), контакты, график приёма." },
      { id: "teachers", title: "Педагоги", lead: "Информация о преподавателях, квалификации и направлениях работы." },
      { id: "facilities", title: "Оснащение", lead: "Помещения, оборудование, учебные материалы и условия реализации." },
      { id: "paid-services", title: "Платные услуги", lead: "Порядок оказания платных услуг, стоимость, договоры и условия." },
      { id: "finance", title: "Финансы", lead: "Сведения о финансировании, отчётности и хозяйственной деятельности." },
      { id: "vacancies", title: "Вакансии", lead: "Информация о наличии свободных мест по программам/группам." },
      { id: "accessibility", title: "Доступность", lead: "Условия доступности для обучающихся с ОВЗ и иных категорий." },
    ],
    []
  );

  const activeId = useMemo(() => {
    const hash = (location.hash || "").replace("#", "");
    return sections.some((s) => s.id === hash) ? hash : sections[0]?.id;
  }, [location.hash, sections]);

  useEffect(() => {
    const hash = (location.hash || "").replace("#", "");
    if (!hash) return;
    const el = document.getElementById(hash);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.hash]);

  const title = "Сведения — Личность ПЛЮС";
  const description = "Раздел обязательных сведений образовательной организации.";
  const canonical = buildCanonical("/svedeniya");

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <div className="print-hidden">
        <Navigation />
      </div>

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Breadcrumbs />

          <motion.header
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between border-b pb-8"
          >
            <div>
              <span className="text-primary font-bold tracking-widest uppercase text-[10px] mb-2 block">Сведения ОО</span>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Основные сведения</h1>
              <p className="mt-2 text-sm text-muted-foreground max-w-2xl font-medium">{description}</p>
            </div>

            <div className="flex items-center gap-2 print-hidden">
              <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2 rounded-full font-bold h-9">
                <Printer className="h-3.5 w-3.5" />
                Печать
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCollapsed((v) => !v)}
                className="gap-2 hidden lg:inline-flex rounded-full font-bold h-9"
              >
                {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
                {collapsed ? "Меню" : "Скрыть меню"}
              </Button>
            </div>
          </motion.header>

          <div className="grid gap-8 lg:grid-cols-[auto_1fr]">
            {/* Sidebar */}
            <aside
              role="navigation"
              aria-label="Боковое меню разделов"
              className={cn(
                "print-hidden lg:sticky lg:top-24 lg:self-start transition-all duration-300",
                collapsed ? "lg:w-12" : "lg:w-72"
              )}
            >
              <div className="glass-card p-2 rounded-xl border-border/50">
                <nav aria-label="Меню раздела" className="space-y-0.5">
                  {sections.map((s, idx) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-bold transition-all",
                        s.id === activeId
                          ? "bg-primary text-white shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                      title={collapsed ? s.title : undefined}
                    >
                      <span className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-md border text-[10px]",
                        s.id === activeId ? "border-white/20 bg-white/10" : "border-border bg-background"
                      )}>
                        {idx + 1}
                      </span>
                      {!collapsed ? <span className="truncate">{s.title}</span> : null}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Content */}
            <div className="space-y-6">
              {sections.map((s) => (
                <section key={s.id} id={s.id} className="scroll-mt-24" aria-label={s.title}>
                  <article className="glass-card p-6 md:p-8 rounded-xl shadow-sm border-border/50 bg-white/50 dark:bg-card/30 backdrop-blur-sm">
                    <h2 className="text-xl font-bold text-foreground mb-1 tracking-tight">{s.title}</h2>
                    <p className="text-[13px] text-muted-foreground font-medium mb-6">{s.lead}</p>

                    <div className="text-sm text-foreground leading-relaxed">
                      {contentMap[s.id] ? (
                        <div
                          dangerouslySetInnerHTML={{ __html: contentMap[s.id] }}
                          className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/80"
                        />
                      ) : (
                        <div className="p-6 border border-dashed rounded-lg bg-muted/20 text-muted-foreground text-xs text-center font-medium italic">
                          Информация уточняется...
                        </div>
                      )}
                    </div>
                  </article>
                </section>
              ))}
            </div>
          </div>
        </div>
      </main>

      <div className="print-hidden">
        <Footer />
      </div>
    </div>
  );
}
