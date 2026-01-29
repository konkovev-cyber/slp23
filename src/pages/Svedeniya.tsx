import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
      {
        id: "basic",
        title: "Основные сведения",
        lead: "Ключевая информация об организации: наименование, адрес, контакты и режим работы.",
      },
      {
        id: "structure",
        title: "Структура и органы управления",
        lead: "Описание структуры управления, подразделений и органов управления.",
      },
      {
        id: "documents",
        title: "Документы",
        lead: "Учредительные документы, локальные акты, правила приёма, устав и прочее.",
      },
      {
        id: "education",
        title: "Образование",
        lead: "Сведения о реализуемых программах, формах обучения и возрастных группах.",
      },
      {
        id: "standards",
        title: "Образовательные стандарты",
        lead: "Информация о стандартах/требованиях и используемых подходах к обучению.",
      },
      {
        id: "management",
        title: "Руководство",
        lead: "Сведения о руководителе(ях), контакты, график приёма.",
      },
      {
        id: "teachers",
        title: "Педагогический состав",
        lead: "Информация о преподавателях, квалификации и направлениях работы.",
      },
      {
        id: "facilities",
        title: "Материально‑техническое обеспечение",
        lead: "Помещения, оборудование, учебные материалы и условия реализации программ.",
      },
      {
        id: "paid-services",
        title: "Платные образовательные услуги",
        lead: "Порядок оказания платных услуг, стоимость, договоры и условия оплаты.",
      },
      {
        id: "finance",
        title: "Финансово‑хозяйственная деятельность",
        lead: "Сведения о финансировании, отчётности и хозяйственной деятельности.",
      },
      {
        id: "vacancies",
        title: "Вакантные места для приёма",
        lead: "Информация о наличии свободных мест по программам/группам.",
      },
      {
        id: "accessibility",
        title: "Доступная среда",
        lead: "Условия доступности для обучающихся с ОВЗ и иных категорий.",
      },
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

  const title = "Основные сведения — Личность ПЛЮС";
  const description =
    "Раздел «Основные сведения» образовательной организации: структура, документы, образование, педсостав и другие обязательные сведения.";
  const canonical = buildCanonical("/svedeniya");

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />

        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />

        <meta name="twitter:card" content="summary" />
      </Helmet>

      <div className="print-hidden">
        <Navigation />
      </div>

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Основные сведения</h1>
              <p className="mt-3 text-muted-foreground max-w-3xl">{description}</p>
            </div>

            <div className="flex items-center gap-2 print-hidden">
              <Button variant="outline" onClick={() => window.print()} className="gap-2">
                <Printer className="h-4 w-4" />
                Печать
              </Button>
              <Button
                variant="secondary"
                onClick={() => setCollapsed((v) => !v)}
                className="gap-2 hidden lg:inline-flex"
              >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                {collapsed ? "Показать меню" : "Скрыть меню"}
              </Button>
            </div>
          </header>

          {/* Mobile anchor tabs */}
          <div className="print-hidden lg:hidden -mx-4 px-4 pb-2 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className={cn(
                    "px-3 py-2 rounded-full border border-border text-sm whitespace-nowrap transition-colors",
                    s.id === activeId
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-foreground hover:bg-muted"
                  )}
                >
                  {s.title}
                </a>
              ))}
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[auto_1fr]">
            {/* Sidebar */}
            <aside
              className={cn(
                "print-hidden lg:sticky lg:top-28 lg:self-start",
                collapsed ? "lg:w-14" : "lg:w-80"
              )}
            >
              <Card className="p-2">
                <nav aria-label="Меню раздела" className="space-y-1">
                  {sections.map((s, idx) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        s.id === activeId
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                      title={collapsed ? s.title : undefined}
                    >
                      <span
                        className={cn(
                          "inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-xs",
                          s.id === activeId ? "bg-background" : "bg-card"
                        )}
                        aria-hidden="true"
                      >
                        {idx + 1}
                      </span>
                      {!collapsed ? <span className="leading-snug">{s.title}</span> : null}
                    </a>
                  ))}
                </nav>
              </Card>
            </aside>

            {/* Content */}
            <div className="space-y-6">
              {sections.map((s) => (
                <section key={s.id} id={s.id} className="scroll-mt-28">
                  <Card className="p-6">
                    <h2 className="text-2xl font-bold text-foreground">{s.title}</h2>
                    <p className="mt-2 text-muted-foreground">{s.lead}</p>

                    <div className="mt-5 space-y-3 text-foreground leading-relaxed">
                      {contentMap[s.id] ? (
                        <div
                          dangerouslySetInnerHTML={{ __html: contentMap[s.id] }}
                          className="prose max-w-none dark:prose-invert"
                        />
                      ) : (
                        <div className="p-4 border border-dashed rounded bg-muted/30 text-muted-foreground text-sm">
                          <p>
                            Заполните этот блок официальной информацией (текст, таблицы, ссылки и документы).
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
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
