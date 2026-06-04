import { useMemo } from "react";
import { SiInstagram, SiTelegram, SiVk } from "react-icons/si";
import { Link } from "react-router-dom";
import { Download } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const isNative = Capacitor.isNativePlatform();

const Footer = () => {
  // В нативном приложении (APK) не показываем кнопку скачивания
  const showApkDownload = !isNative;

  const { data: visibility = {} } = useQuery({
    queryKey: ["sections-visibility"],
    queryFn: async () => {
      const { data } = await supabase.from("site_content").select("id, is_visible");
      return (data || []).reduce((acc, item) => ({
        ...acc,
        [item.id]: item.is_visible
      }), {} as Record<string, boolean>);
    }
  });

  const mainNavItems = useMemo(() => {
    const items = [
      { id: "home", label: "Главная страница", href: "/" },
      { id: "about", label: "О нашей школе", href: "/#about" },
      { id: "programs", label: "Программы обучения", href: "/#programs" },
      { id: "clubs", label: "Кружки и секции", href: "/#clubs" },
      { id: "news", label: "Новости школы", href: "/news" },
      { id: "gallery", label: "Фотогалерея", href: "/#gallery" },
    ];
    // Главную оставляем всегда, остальные проверяем
    return items.filter(item => item.id === "home" || visibility[item.id] !== false);
  }, [visibility]);

  return (
    <footer className="bg-background border-t border-border pt-16 pb-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div className="space-y-6">
            <div className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105">
                <span className="text-white font-bold text-lg">Л+</span>
              </div>
              <span className="font-bold text-xl text-foreground tracking-tight">Личность ПЛЮС</span>
            </div>
            <p className="text-muted-foreground text-[13px] font-medium leading-relaxed max-w-xs">
              Частная школа дополнительного образования. Создаём условия для развития лидеров будущего.
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
              {mainNavItems.map((item) => (
                <li key={item.id}>
                  <Link to={item.href} className="text-muted-foreground hover:text-primary transition-colors text-[13px] font-medium">
                    {item.label}
                  </Link>
                </li>
              ))}
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

        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-widest text-center md:text-left">
            © 2026 ЧОУ «Личность ПЛЮС». Все права защищены. <br className="md:hidden" />
            <span className="hidden md:inline"> | </span> ИНН 2368015470 | ОГРН 1212300048179
          </p>

          <div className="flex items-center gap-6">
            {/* APK Download Icon - показываем только в веб-версии */}
            {showApkDownload && (
              <a
                href="https://slp23.ru/slp23.apk"
                target="_blank"
                rel="noopener noreferrer"
                download
                className="inline-flex items-center justify-center w-9 h-9 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-all hover:scale-110 border-2 border-primary/20"
                title="Скачать приложение для Android"
              >
                <Download className="w-4 h-4" />
              </a>
            )}

            <div className="flex gap-8">
              <Link to="/privacy" className="text-muted-foreground text-[10px] font-medium uppercase tracking-widest hover:text-foreground transition-colors">Конфиденциальность</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
