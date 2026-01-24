 import { Youtube } from "lucide-react";
 import { SiVk, SiTelegram } from "react-icons/si";
 
 const Footer = () => {
   return (
     <footer className="bg-primary text-primary-foreground">
       <div className="container mx-auto px-4 py-12">
         <div className="grid md:grid-cols-4 gap-8 mb-8">
           <div>
             <div className="flex items-center space-x-2 mb-4">
               <div className="w-10 h-10 bg-primary-foreground text-primary rounded-lg flex items-center justify-center">
                 <span className="font-bold text-lg">Л+</span>
               </div>
               <span className="font-bold text-lg">Личность ПЛЮС</span>
             </div>
             <p className="text-primary-foreground/80 text-sm">
               Частная школа дополнительного образования для детей 6–16 лет
             </p>
           </div>
 
           <div>
             <h4 className="font-bold mb-4">Навигация</h4>
             <ul className="space-y-2 text-sm">
               <li><a href="#home" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Главная</a></li>
               <li><a href="#programs" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Программы</a></li>
               <li><a href="#clubs" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Кружки</a></li>
               <li><a href="#news" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Новости</a></li>
               <li><a href="#contacts" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Контакты</a></li>
             </ul>
           </div>
 
           <div>
             <h4 className="font-bold mb-4">Документы</h4>
             <ul className="space-y-2 text-sm">
               <li><a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Лицензия</a></li>
               <li><a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Документы</a></li>
               <li><a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Политика конфиденциальности</a></li>
               <li><a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Вакансии</a></li>
             </ul>
           </div>
 
           <div>
             <h4 className="font-bold mb-4">Социальные сети</h4>
             <div className="flex space-x-3">
               <a href="https://vk.com/lichnostplus" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-primary-foreground/10 hover:bg-primary-foreground/20 rounded-lg flex items-center justify-center transition-colors">
                 <SiVk className="w-5 h-5" />
               </a>
               <a href="https://t.me/lichnost_PLUS" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-primary-foreground/10 hover:bg-primary-foreground/20 rounded-lg flex items-center justify-center transition-colors">
                 <SiTelegram className="w-5 h-5" />
               </a>
               <a href="https://www.youtube.com/@user-ki6kz5jw4o" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-primary-foreground/10 hover:bg-primary-foreground/20 rounded-lg flex items-center justify-center transition-colors">
                 <Youtube className="w-5 h-5" />
               </a>
             </div>
             <p className="text-primary-foreground/80 text-sm mt-4">
               <a href="mailto:slichnost5@mail.ru" className="hover:text-primary-foreground transition-colors">
                 slichnost5@mail.ru
               </a>
               <br />
               <a href="tel:+79282619928" className="hover:text-primary-foreground transition-colors">
                 +7 (928) 261-99-28
               </a>
             </p>
           </div>
         </div>
 
         <div className="border-t border-primary-foreground/20 pt-8 text-center text-sm text-primary-foreground/60">
           <p>© 2026 Частная школа дополнительного образования «Личность ПЛЮС». Все права защищены.</p>
         </div>
       </div>
     </footer>
   );
 };
 
 export default Footer;