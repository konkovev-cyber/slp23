import { SiInstagram, SiTelegram, SiVk } from "react-icons/si";
import { Link } from "react-router-dom";

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

          <div>
            <h4 className="text-foreground font-bold mb-6 uppercase tracking-wider text-[10px]">Навигация</h4>
            <ul className="space-y-3.5">
              {["Главная", "Новости", "Галерея", "Программы", "Кружки"].map((item) => (
                <li key={item}>
                  <Link
                    to={item === "Главная" ? "/" : `/${item.toLowerCase()}`}
                    className="text-muted-foreground hover:text-primary transition-colors text-[13px] font-medium"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-foreground font-bold mb-6 uppercase tracking-wider text-[10px]">Информация</h4>
            <ul className="space-y-3.5">
              {["Сведения", "Документы", "Лицензия", "Вакансии"].map((item) => (
                <li key={item}>
                  <Link
                    to="/svedeniya"
                    className="text-muted-foreground hover:text-primary transition-colors text-[13px] font-medium"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

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