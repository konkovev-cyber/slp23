import { useState } from "react";
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

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSchoolMenuOpen, setIsSchoolMenuOpen] = useState(false);
  const [isSvedeniyaMenuOpen, setIsSvedeniyaMenuOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  const schoolItems = [
    { label: "О школе", href: "/about" },
    { label: "Программы", href: "/programs" },
    { label: "Кружки", href: "/clubs" },
    { label: "Новости", href: "/news" },
  ];

  const svedeniyaItems = [
    { label: "Основные сведения", href: "/svedeniya#osnovnye-svedeniya" },
    { label: "Структура и органы управления", href: "/svedeniya#struktura-i-organy-upravleniya" },
    { label: "Документы", href: "/svedeniya#dokumenty" },
    { label: "Образование", href: "/svedeniya#obrazovanie" },
    { label: "Руководство", href: "/svedeniya#rukovodstvo" },
    { label: "Педагогический состав", href: "/svedeniya#pedagogicheskij-sostav" },
    { label: "Материально‑техническое обеспечение", href: "/svedeniya#materialno-tekhnicheskoe-obespechenie" },
    { label: "Платные образовательные услуги", href: "/svedeniya#platnye-obrazovatelnye-uslugi" },
    { label: "Финансово‑хозяйственная деятельность", href: "/svedeniya#finansovo-khozyajstvennaya-deyatelnost" },
    { label: "Вакантные места", href: "/svedeniya#vakansii" },
    { label: "Доступная среда", href: "/svedeniya#dostupnaya-sreda" },
    { label: "Международное сотрудничество", href: "/svedeniya#mezhdunarodnoe-sotrudnichestvo" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">Л+</span>
              </div>
              <div>
                <div className="font-bold text-lg text-foreground">Личность ПЛЮС</div>
                <div className="text-xs text-muted-foreground">Школа доп. образования</div>
              </div>
            </Link>
          </motion.div>

          <div className="hidden lg:flex items-center space-x-8">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem><Link to="/"><NavigationMenuLink className="text-foreground hover:text-primary transition-colors font-medium px-4 py-2">Главная</NavigationMenuLink></Link></NavigationMenuItem>
                <NavigationMenuItem><Link to="/news"><NavigationMenuLink className="text-foreground hover:text-primary transition-colors font-medium px-4 py-2">Новости</NavigationMenuLink></Link></NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-foreground hover:text-primary transition-colors font-medium">Школа</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[240px] gap-1 p-3">
                      {schoolItems.map((item) => (<Link key={item.href} to={item.href}><NavigationMenuLink className="block select-none rounded-md p-2 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground"><div className="text-sm font-medium">{item.label}</div></NavigationMenuLink></Link>))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem><Link to="/gallery"><NavigationMenuLink className="text-foreground hover:text-primary transition-colors font-medium px-4 py-2">Галерея</NavigationMenuLink></Link></NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-foreground hover:text-primary transition-colors font-medium">Сведения</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[320px] gap-1 p-3">
                      {svedeniyaItems.map((item) => (<NavigationMenuLink key={item.href} href={item.href} className="block select-none rounded-md p-2 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground"><div className="text-sm font-medium">{item.label}</div></NavigationMenuLink>))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/contact" className="text-foreground hover:text-primary transition-colors font-medium px-4 py-2 block">
                    Контакты
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          <div className="hidden lg:flex items-center space-x-4">
            <a href="tel:+79282619928" className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-primary transition-colors"><Phone className="w-4 h-4" /><span>+7 (928) 261-99-28</span></a>
            <Button asChild variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground"><a href={isHome ? "#contacts" : "/#contacts"}>Записаться</a></Button>
          </div>

          <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden p-2 text-foreground">{isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="lg:hidden border-t border-border bg-background">
            <div className="container mx-auto px-4 py-4 space-y-4">
              <Link to="/" onClick={() => setIsOpen(false)} className="block py-2 text-foreground hover:text-primary transition-colors font-medium">Главная</Link>
              <Link to="/news" onClick={() => setIsOpen(false)} className="block py-2 text-foreground hover:text-primary transition-colors font-medium">Новости</Link>
              <div className="border-b border-border pb-2">
                <button onClick={() => setIsSchoolMenuOpen(!isSchoolMenuOpen)} className="flex items-center justify-between w-full py-2 text-foreground hover:text-primary transition-colors font-medium"><span>Школа</span><ChevronDown className={`w-4 h-4 transition-transform ${isSchoolMenuOpen ? 'rotate-180' : ''}`} /></button>
                {isSchoolMenuOpen && (<div className="pl-4 space-y-2 mt-2">{schoolItems.map((item) => (<Link key={item.href} to={item.href} onClick={() => setIsOpen(false)} className="block py-1 text-sm text-muted-foreground hover:text-primary transition-colors">{item.label}</Link>))}</div>)}
              </div>
              <Link to="/gallery" onClick={() => setIsOpen(false)} className="block py-2 text-foreground hover:text-primary transition-colors font-medium">Галерея</Link>
              <a href={isHome ? "#contacts" : "/#contacts"} onClick={() => setIsOpen(false)} className="block py-2 text-foreground hover:text-primary transition-colors font-medium">Контакты</a>
              <div className="border-b border-border pb-2">
                <button onClick={() => setIsSvedeniyaMenuOpen(!isSvedeniyaMenuOpen)} className="flex items-center justify-between w-full py-2 text-foreground hover:text-primary transition-colors font-medium"><span>Сведения</span><ChevronDown className={`w-4 h-4 transition-transform ${isSvedeniyaMenuOpen ? 'rotate-180' : ''}`} /></button>
                {isSvedeniyaMenuOpen && (<div className="pl-4 space-y-2 mt-2">{svedeniyaItems.map((item) => (<a key={item.href} href={item.href} onClick={() => setIsOpen(false)} className="block py-1 text-sm text-muted-foreground hover:text-primary transition-colors">{item.label}</a>))}</div>)}
              </div>
              <div className="pt-4 border-t border-border space-y-3">
                <a href="tel:+79282619928" className="flex items-center space-x-2 text-muted-foreground"><Phone className="w-4 h-4" /><span>+7 (928) 261-99-28</span></a>
                <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"><a href={isHome ? "#contacts" : "/#contacts"} onClick={() => setIsOpen(false)}>Записаться на экскурсию</a></Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navigation;