import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Type, Palette, Image as ImageIcon, X, EyeOff } from "lucide-react";

export default function VisionPanel() {
    const [isActive, setIsActive] = useState(() => localStorage.getItem("vision-mode") === "true");
    const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem("vision-font-size")) || 100);
    const [colorTheme, setColorTheme] = useState(() => localStorage.getItem("vision-theme") || "none");
    const [hideImages, setHideImages] = useState(() => localStorage.getItem("vision-hide-images") === "true");

    useEffect(() => {
        const handleToggle = (e: any) => setIsActive(e.detail);
        window.addEventListener("toggle-vision", handleToggle);
        return () => window.removeEventListener("toggle-vision", handleToggle);
    }, []);

    useEffect(() => {
        const root = document.documentElement;
        if (isActive) {
            root.classList.add("vision-active");
            root.style.fontSize = `${fontSize}%`;

            root.classList.remove("vision-theme-bw", "vision-theme-wb", "vision-theme-blue");
            if (colorTheme !== "none") {
                root.classList.add(`vision-theme-${colorTheme}`);
            }

            if (hideImages) root.classList.add("vision-no-images");
            else root.classList.remove("vision-no-images");

            localStorage.setItem("vision-mode", "true");
            localStorage.setItem("vision-font-size", fontSize.toString());
            localStorage.setItem("vision-theme", colorTheme);
            localStorage.setItem("vision-hide-images", hideImages.toString());
        } else {
            root.classList.remove("vision-active", "vision-theme-bw", "vision-theme-wb", "vision-theme-blue", "vision-no-images");
            root.style.fontSize = "";
            localStorage.setItem("vision-mode", "false");
        }
    }, [isActive, fontSize, colorTheme, hideImages]);

    if (!isActive) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[110] bg-white text-black border-b-4 border-black p-2 shadow-2xl print-hidden">
            <style dangerouslySetInnerHTML={{
                __html: `
                .vision-active img { filter: grayscale(100%) contrast(120%); }
                .vision-no-images img, .vision-no-images [style*="background-image"], .vision-no-images iframe { display: none !important; }
                .vision-active * { box-shadow: none !important; text-shadow: none !important; transition: none !important; }
                .vision-theme-bw, .vision-theme-bw * { background-color: white !important; color: black !important; border-color: black !important; }
                .vision-theme-wb, .vision-theme-wb * { background-color: black !important; color: white !important; border-color: white !important; }
                .vision-theme-blue, .vision-theme-blue * { background-color: #99ffff !important; color: #000066 !important; border-color: #000066 !important; }
                .vision-active a { text-decoration: underline !important; font-weight: bold !important; color: currentColor !important; }
                .vision-active svg, .vision-active svg * { fill: currentColor !important; stroke: currentColor !important; }
                .vision-active button { border: 2px solid currentColor !important; }
                .vision-active .glass-card { background: transparent !important; border: 2px solid currentColor !important; backdrop-filter: none !important; }
            ` }} />

            <div className="container mx-auto flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-6 flex-wrap">
                    <div className="flex items-center gap-2">
                        <Type className="w-5 h-5" />
                        <span className="text-xs font-black uppercase">Шрифт:</span>
                        <div className="flex border-2 border-black rounded overflow-hidden">
                            {[100, 125, 150].map(size => (
                                <button
                                    key={size}
                                    onClick={() => setFontSize(size)}
                                    className={`px-4 py-1 font-bold transition-colors ${fontSize === size ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}
                                >
                                    {size === 100 ? 'A' : size === 125 ? 'A+' : 'A++'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Palette className="w-5 h-5" />
                        <span className="text-xs font-black uppercase">Цвет:</span>
                        <div className="flex border-2 border-black rounded overflow-hidden">
                            <button onClick={() => setColorTheme("none")} className={`px-4 py-1 font-bold ${colorTheme === "none" ? 'bg-black text-white' : 'bg-white text-black'}`}>Ц</button>
                            <button onClick={() => setColorTheme("bw")} className={`px-4 py-1 font-bold border-l-2 border-black ${colorTheme === "bw" ? 'bg-black text-white' : 'bg-white text-black'}`}>ЧБ</button>
                            <button onClick={() => setColorTheme("wb")} className={`px-4 py-1 font-bold border-l-2 border-black ${colorTheme === "wb" ? 'bg-white text-black' : 'bg-black text-white'}`}>БЧ</button>
                            <button onClick={() => setColorTheme("blue")} className={`px-4 py-1 font-bold border-l-2 border-black ${colorTheme === "blue" ? 'bg-[#000066] text-[#99ffff]' : 'bg-[#99ffff] text-[#000066]'}`}>С</button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" />
                        <span className="text-xs font-black uppercase">Картинки:</span>
                        <button
                            onClick={() => setHideImages(!hideImages)}
                            className={`px-4 py-1 border-2 border-black rounded font-bold transition-colors ${hideImages ? 'bg-black text-white' : 'bg-white text-black'}`}
                        >
                            {hideImages ? 'Выкл' : 'Вкл'}
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsActive(false)}
                        className="font-bold border-2 border-black hover:bg-black hover:text-white uppercase text-[10px]"
                    >
                        <EyeOff className="w-3.5 h-3.5 mr-2" /> Обычная версия
                    </Button>
                    <button onClick={() => setIsActive(false)} className="p-1"><X className="w-6 h-6" /></button>
                </div>
            </div>
        </div>
    );
}