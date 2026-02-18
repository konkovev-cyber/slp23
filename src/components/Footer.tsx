import { SiInstagram, SiTelegram, SiVk, SiGithub } from "react-icons/si";
import { Link } from "react-router-dom";
import { Download } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-background border-t border-border pt-16 pb-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div className="space-y-6">
            <div className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105">
                <span className="text-white font-bold text-lg">Р›+</span>
              </div>
              <span className="font-bold text-xl text-foreground tracking-tight">Р›РёС‡РЅРѕСЃС‚СЊ РџР›Р®РЎ</span>
            </div>
            <p className="text-muted-foreground text-[13px] font-medium leading-relaxed max-w-xs">
              Р§Р°СЃС‚РЅР°СЏ РѕР±С‰РµРѕР±СЂР°Р·РѕРІР°С‚РµР»СЊРЅР°СЏ С€РєРѕР»Р° РЅРѕРІРѕРіРѕ РїРѕРєРѕР»РµРЅРёСЏ. РЎРѕР·РґР°РµРј СѓСЃР»РѕРІРёСЏ РґР»СЏ СЂР°Р·РІРёС‚РёСЏ Р»РёРґРµСЂРѕРІ Р±СѓРґСѓС‰РµРіРѕ.
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

          <nav role="navigation" aria-label="РќР°РІРёРіР°С†РёСЏ РІ РїРѕРґРІР°Р»Рµ">
            <h4 className="text-foreground font-bold mb-6 uppercase tracking-wider text-[10px]">РќР°РІРёРіР°С†РёСЏ</h4>
            <ul className="space-y-3.5">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary transition-colors text-[13px] font-medium">
                  Р“Р»Р°РІРЅР°СЏ СЃС‚СЂР°РЅРёС†Р°
                </Link>
              </li>
              <li>
                <Link to="/#about" className="text-muted-foreground hover:text-primary transition-colors text-[13px] font-medium">
                  Рћ РЅР°С€РµР№ С€РєРѕР»Рµ
                </Link>
              </li>
              <li>
                <Link to="/#programs" className="text-muted-foreground hover:text-primary transition-colors text-[13px] font-medium">
                  РџСЂРѕРіСЂР°РјРјС‹ РѕР±СѓС‡РµРЅРёСЏ
                </Link>
              </li>
              <li>
                <Link to="/#clubs" className="text-muted-foreground hover:text-primary transition-colors text-[13px] font-medium">
                  РљСЂСѓР¶РєРё Рё СЃРµРєС†РёРё
                </Link>
              </li>
              <li>
                <Link to="/news" className="text-muted-foreground hover:text-primary transition-colors text-[13px] font-medium">
                  РќРѕРІРѕСЃС‚Рё С€РєРѕР»С‹
                </Link>
              </li>
              <li>
                <Link to="/#gallery" className="text-muted-foreground hover:text-primary transition-colors text-[13px] font-medium">
                  Р¤РѕС‚РѕРіР°Р»РµСЂРµСЏ
                </Link>
              </li>
            </ul>
          </nav>

          <nav role="navigation" aria-label="РРЅС„РѕСЂРјР°С†РёРѕРЅРЅРѕРµ РјРµРЅСЋ РїРѕРґРІР°Р»Р°">
            <h4 className="text-foreground font-bold mb-6 uppercase tracking-wider text-[10px]">РРЅС„РѕСЂРјР°С†РёСЏ</h4>
            <ul className="space-y-3.5">
              <li>
                <Link to="/svedeniya" className="text-muted-foreground hover:text-primary transition-colors text-[13px] font-medium">
                  РЎРІРµРґРµРЅРёСЏ РѕР± РѕСЂРіР°РЅРёР·Р°С†РёРё
                </Link>
              </li>
              <li>
                <Link to="/svedeniya#documents" className="text-muted-foreground hover:text-primary transition-colors text-[13px] font-medium">
                  Р”РѕРєСѓРјРµРЅС‚С‹ Рё Р»РёС†РµРЅР·РёСЏ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors text-[13px] font-medium">
                  РљРѕРЅС‚Р°РєС‚С‹ Рё Р°РґСЂРµСЃ
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors text-[13px] font-medium">
                  РџРѕР»РёС‚РёРєР° РєРѕРЅС„РёРґРµРЅС†РёР°Р»СЊРЅРѕСЃС‚Рё
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h4 className="text-foreground font-bold mb-6 uppercase tracking-wider text-[10px]">РљРѕРЅС‚Р°РєС‚С‹</h4>
            <div className="space-y-4">
              <p className="text-muted-foreground text-[13px] font-medium leading-relaxed">
                РљСЂР°СЃРЅРѕРґР°СЂСЃРєРёР№ РєСЂР°Р№,<br />
                Рі. Р“РѕСЂСЏС‡РёР№ РљР»СЋС‡, РїРµСЂ. РЁРєРѕР»СЊРЅС‹Р№, 27
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
            В© 2026 Р§РћРЈ В«Р›РёС‡РЅРѕСЃС‚СЊ РџР›Р®РЎВ». Р’СЃРµ РїСЂР°РІР° Р·Р°С‰РёС‰РµРЅС‹.
          </p>
          
          <div className="flex items-center gap-6">
            {/* APK Download Icon - Small */}
            <a
              href="https://github.com/konkovev-cyber/slp23/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-9 h-9 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-all hover:scale-110 border-2 border-primary/20"
              title="РЎРєР°С‡Р°С‚СЊ РїСЂРёР»РѕР¶РµРЅРёРµ РґР»СЏ Android"
            >
              <Download className="w-4 h-4" />
            </a>
            
            <div className="flex gap-8">
              <Link to="/privacy" className="text-muted-foreground text-[10px] font-medium uppercase tracking-widest hover:text-foreground transition-colors">РљРѕРЅС„РёРґРµРЅС†РёР°Р»СЊРЅРѕСЃС‚СЊ</Link>
              <Link to="/terms" className="text-muted-foreground text-[10px] font-medium uppercase tracking-widest hover:text-foreground transition-colors">РЈСЃР»РѕРІРёСЏ</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
