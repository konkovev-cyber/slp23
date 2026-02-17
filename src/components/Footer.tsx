import { SiInstagram, SiTelegram, SiVk, SiGithub } from "react-icons/si";
import { Link } from "react-router-dom";
import { APP_VERSION } from "@/config/app-info";
import { Download } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-background border-t border-border pt-16 pb-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <div className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105">
                <span className="text-white font-bold text-lg">Л+</span>
              </div>
              <span className="font-bold text-xl text-foreground tracking-tight">Личность ПЛЮС</span>
            </div>
            <p className="text-muted-foreground text-[13px] font-medium leading-relaxed max-w-xs">
              Частная общеобразовательная школа нового поколения. Создаем условия для развития лидеров будущего.
            </p>
            <div className="flex space-x-3 pt-2">
              {[
                { i: SiVk, l: "https://vk.com/lichnostplus", label: "VK" },
                { i: SiTelegram, l: "https://t.me/lichnost_PLUS", label: "TG" },
                { i: SiInstagram, l: "https://www.instagram.com/lichnost_plus_gk/", label: "IG" }
              ].map((Soc, idx) => (
                <a
                  key={idx}
                  href={Soc.l}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={Soc.label}
                  className="w-9 h-9 bg-muted rounded-full flex items-center justify-center border border-border hover:bg-primary/10 hover:border-primary transition-all group"
                >
                  <Soc.i className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
              ))}
            </div>
          </div>

          <nav role="navigation" aria-label="Навигация в подвале">
            <h4 className="text-foreground font-bold mb-6 uppercase tracking-wider text-[10px]">Навигация</h4>
            <ul className="space-y-3.5">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary transition-colors text-[13px] font-medium">
                  Главная страница
                </Link>
              </li>
              <li>
                <Link to="/#about" className="text-muted-foreground hover:text-primary transition-colors text-[13px] font-medium">
                  О нашей школе
                </Link>
              </li>
              <li>
                <Link to="/#programs" className="text-muted-foreground hover:text-primary transition-colors text-[13px] font-medium">
                  Программы обучения
                </Link>
              </li>
              <li>
                <Link to="/#clubs" className="text-muted-foreground hover:text-primary transition-colors text-[13px] font-medium">
                  Кружки и секции
                </Link>
              </li>
              <li>
                <Link to="/news" className="text-muted-foreground hover:text-primary transition-colors text-[13px] font-medium">
                  Новости школы
                </Link>
              </li>
              <li>
                <Link to="/#gallery" className="text-muted-foreground hover:text-primary transition-colors text-[13px] font-medium">
                  Фотогалерея
                </Link>
              </li>
            </ul>
          </nav>

          <nav role="navigation" aria-label="Информационное меню подвала">
            <h4 className="text-foreground font-bold mb-6 uppercase tracking-wider text-[10px]">Информация</h4>
            <ul className="space-y-3.5">
              <li>
                <Link to="/svedeniya" className="text-muted-foreground hover:text-primary transition-colors text-[13px] font-medium">
                  Сведения об организации
                </Link>
              </li>
              <li>
                <Link to="/svedeniya#documents" className="text-muted-foreground hover:text-primary transition-colors text-[13px] font-medium">
                  Документы и лицензия
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors text-[13px] font-medium">
                  Контакты и адрес
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors text-[13px] font-medium">
                  Политика конфиденциальности
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h4 className="text-foreground font-bold mb-6 uppercase tracking-wider text-[10px]">Контакты</h4>
            <div className="space-y-4">
              <p className="text-muted-foreground text-[13px] font-medium leading-relaxed">
                Краснодарский край,<br />
                г. Горячий Ключ, пер. Школьный, 27
              </p>
              <div className="space-y-1.5 pt-2">
                <a href="tel:+79282619928" className="block text-lg font-bold text-foreground hover:text-primary transition-colors tracking-tight">
                  +7 (928) 261-99-28
                </a>
                <a href="mailto:slichnost5@mail.ru" className="block text-muted-foreground font-medium hover:text-primary transition-colors text-[13px] underline underline-offset-4 decoration-border">
                  slichnost5@mail.ru
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* APK Download Section */}
        <div className="mb-12 p-6 bg-primary/5 rounded-[32px] border-2 border-primary/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
                <Download className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground mb-1">Мобильное приложение</h3>
                <p className="text-sm text-muted-foreground font-medium">
                  Версия <span className="font-bold text-primary">v{APP_VERSION}</span> • Всегда актуальная
                </p>
              </div>
            </div>
            <a
              href="https://github.com/konkovev-cyber/slp23/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:translate-y-[-2px] transition-all active:scale-[0.98]"
            >
              <SiGithub className="w-5 h-5" />
              Скачать APK
            </a>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-widest text-center md:text-left">
            © 2026 ЧОУ «Личность ПЛЮС». Все права защищены.
          </p>
          <div className="flex gap-8">
            <Link to="/privacy" className="text-muted-foreground text-[10px] font-medium uppercase tracking-widest hover:text-foreground transition-colors">Конфиденциальность</Link>
            <Link to="/terms" className="text-muted-foreground text-[10px] font-medium uppercase tracking-widest hover:text-foreground transition-colors">Условия</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;