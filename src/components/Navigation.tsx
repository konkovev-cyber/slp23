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
 
     const navItems = [
       { label: "Главная", href: "#home" },
       { label: "О школе", href: "/about" },
       { label: "Программы", href: "/programs" },
       { label: "Кружки", href: "/clubs" },
       { label: "Новости", href: "/news" },
       { label: "Галерея", href: "/gallery" },
       { label: "Контакты", href: "#contacts" },
     ];

    const location = useLocation();
    const isHome = location.pathname === "/";
 
  const aboutItems = [
    { label: "Основные сведения", href: "/svedeniya#basic" },
    { label: "Структура и органы управления", href: "/svedeniya#structure" },
    { label: "Документы", href: "/svedeniya#documents" },
    { label: "Образование", href: "/svedeniya#education" },
    { label: "Образовательные стандарты", href: "/svedeniya#standards" },
    { label: "Руководство", href: "/svedeniya#management" },
    { label: "Педагогический состав", href: "/svedeniya#teachers" },
    { label: "Материально‑техническое обеспечение", href: "/svedeniya#facilities" },
    { label: "Платные образовательные услуги", href: "/svedeniya#paid-services" },
    { label: "Финансово‑хозяйственная деятельность", href: "/svedeniya#finance" },
    { label: "Вакантные места для приёма", href: "/svedeniya#vacancies" },
    { label: "Доступная среда", href: "/svedeniya#accessibility" },
  ];
 
   return (
     <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
       <div className="container mx-auto px-4">
         <div className="flex items-center justify-between h-20">
           {/* Logo */}
           <motion.div
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             className="flex items-center space-x-3"
           >
             <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
               <span className="text-primary-foreground font-bold text-xl">Л+</span>
             </div>
             <div>
               <div className="font-bold text-lg text-foreground">Личность ПЛЮС</div>
               <div className="text-xs text-muted-foreground">Школа доп. образования</div>
             </div>
           </motion.div>
 
           {/* Desktop Navigation */}
           <div className="hidden lg:flex items-center space-x-8">
             <NavigationMenu>
               <NavigationMenuList>
                   {navItems.slice(0, 1).map((item) => (
                   <NavigationMenuItem key={item.href}>
                     <NavigationMenuLink
                        href={isHome ? item.href : `/${item.href}`}
                       className="text-foreground hover:text-primary transition-colors font-medium px-4 py-2"
                     >
                       {item.label}
                     </NavigationMenuLink>
                   </NavigationMenuItem>
                 ))}
                 
                 <NavigationMenuItem>
                   <NavigationMenuTrigger className="text-foreground hover:text-primary transition-colors font-medium">
                     Основные сведения
                   </NavigationMenuTrigger>
                   <NavigationMenuContent>
                     <div className="grid w-[600px] gap-3 p-4 md:grid-cols-2">
                       {aboutItems.map((item) => (
                         <NavigationMenuLink
                           key={item.href}
                           href={item.href}
                           className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                         >
                           <div className="text-sm font-medium leading-none">{item.label}</div>
                         </NavigationMenuLink>
                       ))}
                     </div>
                   </NavigationMenuContent>
                 </NavigationMenuItem>
 
                   {navItems.slice(1).map((item) => (
                   <NavigationMenuItem key={item.href}>
                      {item.href.startsWith("/") ? (
                        <NavigationMenuLink asChild className="text-foreground hover:text-primary transition-colors font-medium px-4 py-2">
                          <Link to={item.href}>{item.label}</Link>
                        </NavigationMenuLink>
                      ) : (
                        <NavigationMenuLink
                          href={isHome ? item.href : `/${item.href}`}
                          className="text-foreground hover:text-primary transition-colors font-medium px-4 py-2"
                        >
                          {item.label}
                        </NavigationMenuLink>
                      )}
                   </NavigationMenuItem>
                 ))}
               </NavigationMenuList>
             </NavigationMenu>
           </div>
 
           {/* Contact Info & CTA */}
           <div className="hidden lg:flex items-center space-x-4">
             <div className="flex items-center space-x-4 text-sm">
               <a href="tel:+79282619928" className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors">
                 <Phone className="w-4 h-4" />
                 <span>+7 (928) 261-99-28</span>
               </a>
             </div>
              <Button asChild variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <a href={isHome ? "#contacts" : "/#contacts"}>Записаться</a>
              </Button>
           </div>
 
           {/* Mobile Menu Button */}
           <button
             onClick={() => setIsOpen(!isOpen)}
             className="lg:hidden p-2 text-foreground"
           >
             {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
           </button>
         </div>
       </div>
 
       {/* Mobile Menu */}
       <AnimatePresence>
         {isOpen && (
           <motion.div
             initial={{ opacity: 0, height: 0 }}
             animate={{ opacity: 1, height: "auto" }}
             exit={{ opacity: 0, height: 0 }}
             className="lg:hidden border-t border-border bg-background"
           >
             <div className="container mx-auto px-4 py-4 space-y-4">
               <div className="border-b border-border pb-2">
                 <button
                   onClick={() => {}}
                   className="flex items-center justify-between w-full py-2 text-foreground hover:text-primary transition-colors font-medium"
                 >
                   <span>Основные сведения</span>
                   <ChevronDown className="w-4 h-4" />
                 </button>
                 <div className="pl-4 space-y-2 mt-2">
                   {aboutItems.map((item) => (
                     <a
                       key={item.href}
                       href={item.href}
                       onClick={() => setIsOpen(false)}
                       className="block py-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                     >
                       {item.label}
                     </a>
                   ))}
                 </div>
               </div>
               
                 {navItems.map((item) =>
                   item.href.startsWith("/") ? (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className="block py-2 text-foreground hover:text-primary transition-colors font-medium"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      key={item.href}
                      href={isHome ? item.href : `/${item.href}`}
                      onClick={() => setIsOpen(false)}
                      className="block py-2 text-foreground hover:text-primary transition-colors font-medium"
                    >
                      {item.label}
                    </a>
                  )
                )}
               <div className="pt-4 border-t border-border space-y-3">
                 <a href="tel:+79282619928" className="flex items-center space-x-2 text-muted-foreground">
                   <Phone className="w-4 h-4" />
                   <span>+7 (928) 261-99-28</span>
                 </a>
                  <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                    <a href={isHome ? "#contacts" : "/#contacts"} onClick={() => setIsOpen(false)}>
                      Записаться на экскурсию
                    </a>
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