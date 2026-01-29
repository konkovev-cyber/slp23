import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Phone, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import ThemeToggle from "./ThemeToggle";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isSchoolMenuOpen, setIsSchoolMenuOpen] = useState(false);
  const [isSvedeniyaMenuOpen, setIsSvedeniyaMenuOpen] = useState(false);
  const location = useLocation();
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

  const navLinkClass = "text-[11px] font-bold uppercase tracking-widest text-foreground/80 hover:text-primary px-4 h-10 flex items-center transition-all hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent data-[active]:bg-transparent";

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      scrolled ? "glass-nav py-2 shadow-sm" : "bg-transparent py-4"
    )}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">

          <Link to="/" className="flex items-center space-x-2 group outline-none">
            <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center shadow-sm transform group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-base">Л+</span>
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-base text-foreground tracking-tight leading-none">Личность ПЛЮС</div>
              <div className="text-[9px] uppercase font-bold tracking-tight text-muted-foreground mt-0.5">частная школа</div>
            </div>
          </Link>

          <div className="hidden lg:flex items-center px-1 py-0.5 bg-white/50 dark:bg-white/5 backdrop-blur-md border border-border/50 rounded-full">
            <NavigationMenu>
              <NavigationMenuList className="gap-0.5">
                <NavigationMenuItem>
                  <Link to="/">
                    <NavigationMenuLink className={navLinkClass}>Главная</NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className={cn("bg-transparent", navLinkClass)}>Школа</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[200px] gap-0.5 p-2 bg-card border border-border rounded-xl shadow-lg">
                      {schoolItems.map((item) => (
                        <Link key={item.href} to={item.href}>
                          <NavigationMenuLink className="block select-none rounded-lg p-2.5 leading-none no-underline outline-none transition-all hover:bg-muted hover:text-primary">
                            <div className="text-sm font-medium">{item.label}</div>
                          </NavigationMenuLink>
                        </Link>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/gallery">
                    <NavigationMenuLink className={navLinkClass}>Галерея</NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/news">
                    <NavigationMenuLink className={navLinkClass}>Новости</NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className={cn("bg-transparent", navLinkClass)}>Сведения</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[220px] gap-0.5 p-2 bg-card border border-border rounded-xl shadow-lg">
                      {svedeniyaItems.map((item) => (
                        <NavigationMenuLink key={item.href} href={item.href} className="block select-none rounded-lg p-2.5 leading-none no-underline outline-none transition-all hover:bg-muted hover:text-primary">
                          <div className="text-sm font-medium">{item.label}</div>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/contact">
                    <NavigationMenuLink className={navLinkClass}>Контакты</NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild className="rounded-full font-bold h-9 px-5 text-sm shadow-sm transition-all hidden sm:flex">
              <a href={isHome ? "#contacts" : "/#contacts"}>Записаться</a>
            </Button>
            <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden w-9 h-9 flex items-center justify-center text-foreground bg-muted rounded-full">
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
            className="lg:hidden fixed inset-0 z-40 bg-background/98 backdrop-blur-3xl p-6 pt-20"
          >
            <div className="flex flex-col space-y-5 max-w-sm mx-auto">
              <Link to="/" onClick={() => setIsOpen(false)} className="text-2xl font-bold">Главная</Link>
              <Link to="/gallery" onClick={() => setIsOpen(false)} className="text-2xl font-bold">Галерея</Link>
              <Link to="/news" onClick={() => setIsOpen(false)} className="text-2xl font-bold">Новости</Link>

              <div className="space-y-2">
                <button onClick={() => setIsSchoolMenuOpen(!isSchoolMenuOpen)} className="flex items-center justify-between w-full text-lg font-semibold text-muted-foreground">
                  <span>Школа</span>
                  <ChevronDown className={cn("w-5 h-5 transition-all", isSchoolMenuOpen && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {isSchoolMenuOpen && (
                    <motion.div className="flex flex-col gap-2 pl-4">
                      {schoolItems.map((item) => (
                        <Link key={item.href} to={item.href} onClick={() => setIsOpen(false)} className="text-base font-medium">
                          {item.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-2">
                <button onClick={() => setIsSvedeniyaMenuOpen(!isSvedeniyaMenuOpen)} className="flex items-center justify-between w-full text-lg font-semibold text-muted-foreground">
                  <span>Сведения</span>
                  <ChevronDown className={cn("w-5 h-5 transition-all", isSvedeniyaMenuOpen && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {isSvedeniyaMenuOpen && (
                    <motion.div className="flex flex-col gap-2 pl-4">
                      {svedeniyaItems.map((item) => (
                        <Link key={item.href} to={item.href} onClick={() => setIsOpen(false)} className="text-base font-medium">
                          {item.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="pt-4">
                <Button asChild size="lg" className="w-full rounded-full h-12 text-base font-bold">
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