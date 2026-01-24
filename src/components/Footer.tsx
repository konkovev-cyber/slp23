 import { Facebook, Instagram, Youtube } from "lucide-react";
 
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
               <li><a href="#about" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">О школе</a></li>
               <li><a href="#programs" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Программы</a></li>
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
               <a href="#" className="w-10 h-10 bg-primary-foreground/10 hover:bg-primary-foreground/20 rounded-lg flex items-center justify-center transition-colors">
                 <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.78 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.491-.085.744-.576.744z"/>
                 </svg>
               </a>
               <a href="#" className="w-10 h-10 bg-primary-foreground/10 hover:bg-primary-foreground/20 rounded-lg flex items-center justify-center transition-colors">
                 <Instagram className="w-5 h-5" />
               </a>
               <a href="#" className="w-10 h-10 bg-primary-foreground/10 hover:bg-primary-foreground/20 rounded-lg flex items-center justify-center transition-colors">
                 <Youtube className="w-5 h-5" />
               </a>
             </div>
             <p className="text-primary-foreground/80 text-sm mt-4">
               info@lichnost-plus.ru<br />
               +7 (495) 123-45-67
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