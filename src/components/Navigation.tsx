 import { useState } from "react";
 import { Menu, X, Phone, Mail } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { motion, AnimatePresence } from "framer-motion";
 
 const Navigation = () => {
   const [isOpen, setIsOpen] = useState(false);
 
   const navItems = [
     { label: "Главная", href: "#home" },
     { label: "О школе", href: "#about" },
     { label: "Программы", href: "#programs" },
     { label: "Кружки", href: "#clubs" },
     { label: "Контакты", href: "#contacts" },
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
             {navItems.map((item) => (
               <a
                 key={item.href}
                 href={item.href}
                 className="text-foreground hover:text-primary transition-colors font-medium"
               >
                 {item.label}
               </a>
             ))}
           </div>
 
           {/* Contact Info & CTA */}
           <div className="hidden lg:flex items-center space-x-4">
             <div className="flex items-center space-x-4 text-sm">
               <a href="tel:+74951234567" className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors">
                 <Phone className="w-4 h-4" />
                 <span>+7 (495) 123-45-67</span>
               </a>
             </div>
             <Button variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground">
               Записаться
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
               {navItems.map((item) => (
                 <a
                   key={item.href}
                   href={item.href}
                   onClick={() => setIsOpen(false)}
                   className="block py-2 text-foreground hover:text-primary transition-colors font-medium"
                 >
                   {item.label}
                 </a>
               ))}
               <div className="pt-4 border-t border-border space-y-3">
                 <a href="tel:+74951234567" className="flex items-center space-x-2 text-muted-foreground">
                   <Phone className="w-4 h-4" />
                   <span>+7 (495) 123-45-67</span>
                 </a>
                 <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                   Записаться на экскурсию
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