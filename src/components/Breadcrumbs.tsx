import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { Helmet } from "react-helmet-async";

type BreadcrumbItem = {
    label: string;
    path: string;
};

const routeLabels: Record<string, string> = {
    "/": "Главная",
    "/about": "О школе",
    "/programs": "Программы обучения",
    "/clubs": "Кружки и секции",
    "/gallery": "Фотогалерея",
    "/news": "Новости школы",
    "/contact": "Контакты",
    "/svedeniya": "Сведения об организации",
    "/privacy": "Политика конфиденциальности",
};

export default function Breadcrumbs() {
    const location = useLocation();
    const pathnames = location.pathname.split("/").filter((x) => x);

    if (location.pathname === "/") return null;

    const breadcrumbs: BreadcrumbItem[] = [
        { label: "Главная", path: "/" },
    ];

    let currentPath = "";
    pathnames.forEach((segment) => {
        currentPath += `/${segment}`;
        const label = routeLabels[currentPath] || segment;
        breadcrumbs.push({ label, path: currentPath });
    });

    // JSON-LD Schema для хлебных крошек
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbs.map((crumb, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": crumb.label,
            "item": `${window.location.origin}${crumb.path}`,
        })),
    };

    return (
        <>
            <Helmet>
                <script type="application/ld+json">
                    {JSON.stringify(breadcrumbSchema)}
                </script>
            </Helmet>

            <nav aria-label="Навигационная цепочка" className="py-4 print-hidden">
                <ol className="flex items-center gap-2 text-sm flex-wrap">
                    {breadcrumbs.map((crumb, index) => {
                        const isLast = index === breadcrumbs.length - 1;

                        return (
                            <li key={crumb.path} className="flex items-center gap-2">
                                {index === 0 ? (
                                    <Link
                                        to={crumb.path}
                                        className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors font-medium"
                                        aria-label="Вернуться на главную страницу"
                                    >
                                        <Home className="w-4 h-4" aria-hidden="true" />
                                        <span className="hidden sm:inline">{crumb.label}</span>
                                    </Link>
                                ) : isLast ? (
                                    <span className="text-foreground font-semibold" aria-current="page">
                                        {crumb.label}
                                    </span>
                                ) : (
                                    <Link
                                        to={crumb.path}
                                        className="text-muted-foreground hover:text-primary transition-colors font-medium"
                                    >
                                        {crumb.label}
                                    </Link>
                                )}

                                {!isLast && (
                                    <ChevronRight className="w-4 h-4 text-muted-foreground/50" aria-hidden="true" />
                                )}
                            </li>
                        );
                    })}
                </ol>
            </nav>
        </>
    );
}
