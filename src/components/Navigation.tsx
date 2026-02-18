import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "@/hooks/use-auth";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isSchoolMenuOpen, setIsSchoolMenuOpen] = useState(false);
  const [isSvedeniyaMenuOpen, setIsSvedeniyaMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { userId, isLoading } = useAuth();
  const isHome = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const schoolItems = [
    { label: "О школе", href: "/about" },
    { label: "Программы", href: "/programs" },
    { label: "Кружки", href: "/clubs" },
    { label: "Галерея", href: "/gallery" },
    { label: "Новости", href: "/news" },
  ];

  const svedeniyaItems = [
    { label: "Основные сведения", href: "/svedeniya#osnovnye-svedeniya" },
    { label: "Структура и органы", href: "/svedeniya#struktura-i-organy-upravleniya" },
    { label: "Документы", href: "/svedeniya#dokumenty" },
    { label: "Образование", href: "/svedeniya#obrazovanie" },
    { label: "Руководство", href: "/svedeniya#rukovodstvo" },
    { label: "Пед. состав", href: "/svedeniya#pedagogicheskij-sostav" },
  ];

  const navLinkClass = "text-[11px] font-bold uppercase tracking-widest text-foreground/80 hover:text-primary px-4 h-10 flex items-center transition-all hover:bg-transparent focus:bg-transparent data-[state=open]:text-primary cursor-pointer outline-none";

  const diaryLabel = isLoading ? "Загружаем…" : userId ? "Открыть дневник" : "Войти в дневник";

  const handleDiaryClick = () => {
    navigate(userId ? "/school/diary" : "/school/login");
    setIsOpen(false);
  };

  return (
    <nav
      role="navigation"
      aria-label="Главная навигация"
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "glass-nav py-2 shadow-sm" : "bg-transparent py-4"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">

          <Link to="/" className="flex items-center space-x-3 group outline-none">
            <div className="w-10 h-10 overflow-hidden transform group-hover:scale-105 transition-transform">
              <img
                src="/logo.png"
                alt="Личность ПЛЮС"
                className="w-full h-full object-contain dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
              />
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-base text-foreground tracking-tight leading-none uppercase">Личность ПЛЮС</div>
              <div className="text-[9px] uppercase font-bold tracking-tight text-muted-foreground mt-0.5">частная школа</div>
            </div>
          </Link>

          <div className="hidden lg:flex items-center px-1 py-0.5 bg-white/50 dark:bg-white/5 backdrop-blur-md border border-border/50 rounded-full shadow-sm">
            <div className="flex items-center gap-0.5">
              <Link to="/" className={navLinkClass}>
                Главная
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger className={cn(navLinkClass, "gap-1")}>
                  Школа <ChevronDown className="w-3 h-3 mt-0.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[200px] p-1.5 bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-xl mt-2 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 duration-200">
                  {schoolItems.map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link
                        to={item.href}
                        className="w-full cursor-pointer flex items-center rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors focus:bg-primary/10 focus:text-primary outline-none"
                      >
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Link to="/gallery" className={navLinkClass}>
                Галерея
              </Link>

              <Link to="/news" className={navLinkClass}>
                Новости
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger className={cn(navLinkClass, "gap-1")}>
                  Сведения <ChevronDown className="w-3 h-3 mt-0.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[240px] p-1.5 bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-xl mt-2 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 duration-200">
                  {svedeniyaItems.map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link
                        to={item.href}
                        className="w-full cursor-pointer flex items-center rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors focus:bg-primary/10 focus:text-primary outline-none"
                      >
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Link to="/contact" className={navLinkClass}>
                Контакты
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              type="button"
              variant="outline"
              className="rounded-full font-bold h-9 px-4 text-sm shadow-sm transition-all hidden sm:flex"
              onClick={handleDiaryClick}
              disabled={isLoading}
            >
              {diaryLabel}
            </Button>
            <Button asChild className="rounded-full font-bold h-9 px-5 text-sm shadow-sm transition-all hidden sm:flex bg-primary hover:bg-primary/90 text-white">
              <a href={isHome ? "#contacts" : "/#contacts"}>Записаться</a>
            </Button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden w-11 h-11 flex items-center justify-center text-foreground bg-muted rounded-full active:scale-95 transition-transform"
              aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={isOpen}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden fixed inset-0 z-40 bg-background/98 backdrop-blur-3xl overflow-y-auto"
          >
            <div className="flex flex-col space-y-6 max-w-sm mx-auto p-6 pt-24 pb-8">
              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className="text-2xl font-bold py-2 active:text-primary transition-colors"
              >
                Главная
              </Link>
              <Link
                to="/gallery"
                onClick={() => setIsOpen(false)}
                className="text-2xl font-bold py-2 active:text-primary transition-colors"
              >
                Галерея
              </Link>
              <Link
                to="/news"
                onClick={() => setIsOpen(false)}
                className="text-2xl font-bold py-2 active:text-primary transition-colors"
              >
                Новости
              </Link>

              <button
                type="button"
                onClick={handleDiaryClick}
                className="text-2xl font-bold py-2 active:text-primary transition-colors text-left"
                aria-label="Перейти в дневник"
              >
                {diaryLabel}
              </button>

              <div className="space-y-3">
                <button
                  onClick={() => setIsSchoolMenuOpen(!isSchoolMenuOpen)}
                  className="flex items-center justify-between w-full text-lg font-semibold text-muted-foreground py-2 active:text-primary transition-colors min-h-[44px]"
                  aria-expanded={isSchoolMenuOpen}
                  aria-label="Меню раздела Школа"
                >
                  <span>Школа</span>
                  <ChevronDown className={cn("w-5 h-5 transition-all", isSchoolMenuOpen && "rotate-180")} aria-hidden="true" />
                </button>
                <AnimatePresence>
                  {isSchoolMenuOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="flex flex-col gap-3 pl-4 overflow-hidden"
                    >
                      {schoolItems.map((item) => (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => setIsOpen(false)}
                          className="text-base font-medium py-2 active:text-primary transition-colors min-h-[44px] flex items-center"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setIsSvedeniyaMenuOpen(!isSvedeniyaMenuOpen)}
                  className="flex items-center justify-between w-full text-lg font-semibold text-muted-foreground py-2 active:text-primary transition-colors min-h-[44px]"
                  aria-expanded={isSvedeniyaMenuOpen}
                  aria-label="Меню раздела Сведения"
                >
                  <span>Сведения</span>
                  <ChevronDown className={cn("w-5 h-5 transition-all", isSvedeniyaMenuOpen && "rotate-180")} aria-hidden="true" />
                </button>
                <AnimatePresence>
                  {isSvedeniyaMenuOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="flex flex-col gap-3 pl-4 overflow-hidden"
                    >
                      {svedeniyaItems.map((item) => (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => setIsOpen(false)}
                          className="text-base font-medium py-2 active:text-primary transition-colors min-h-[44px] flex items-center"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="pt-6 border-t border-border">
                <Button asChild size="lg" className="w-full rounded-full h-14 text-base font-bold shadow-lg active:scale-95 transition-transform bg-primary hover:bg-primary/90 text-white">
                  <a href={isHome ? "#contacts" : "/#contacts"} onClick={() => setIsOpen(false)}>Подать заявку</a>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navigation;