import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Простая декодер для Windows-1251 → UTF-8
const WINDOWS1251_TO_UTF8: Record<number, string> = {
  0x80: 'Ђ', 0x81: 'Ѓ', 0x82: '‚', 0x83: 'ѓ', 0x84: '„', 0x85: '…', 0x86: '†', 0x87: '‡',
  0x88: '€', 0x89: '‰', 0x8A: 'Љ', 0x8B: '‹', 0x8C: 'Њ', 0x8D: 'Ќ', 0x8E: 'Ћ', 0x8F: 'Џ',
  0x90: 'ђ', 0x91: ''', 0x92: ''', 0x93: '"', 0x94: '"', 0x95: '•', 0x96: '–', 0x97: '—',
  0x98: '™', 0x99: 'š', 0x9A: 'љ', 0x9B: '›', 0x9C: 'њ', 0x9D: 'ќ', 0x9E: 'ћ', 0x9F: 'џ',
  0xA0: ' ', 0xA1: 'Ў', 0xA2: 'ў', 0xA3: 'Ј', 0xA4: '¤', 0xA5: 'Ґ', 0xA6: '¦', 0xA7: '§',
  0xA8: 'Ё', 0xA9: '©', 0xAA: 'Є', 0xAB: '«', 0xAC: '¬', 0xAD: '', 0xAE: '®', 0xAF: 'Ї',
  0xB0: '°', 0xB1: '±', 0xB2: 'І', 0xB3: 'і', 0xB4: 'ґ', 0xB5: 'µ', 0xB6: '¶', 0xB7: '·',
  0xB8: 'ё', 0xB9: '№', 0xBA: 'є', 0xBB: '»', 0xBC: 'ј', 0xBD: 'Ѕ', 0xBE: 'ѕ', 0xBF: 'ї',
  0xC0: 'А', 0xC1: 'Б', 0xC2: 'В', 0xC3: 'Г', 0xC4: 'Д', 0xC5: 'Е', 0xC6: 'Ж', 0xC7: 'З',
  0xC8: 'И', 0xC9: 'Й', 0xCA: 'К', 0xCB: 'Л', 0xCC: 'М', 0xCD: 'Н', 0xCE: 'О', 0xCF: 'П',
  0xD0: 'Р', 0xD1: 'С', 0xD2: 'Т', 0xD3: 'У', 0xD4: 'Ф', 0xD5: 'Х', 0xD6: 'Ц', 0xD7: 'Ч',
  0xD8: 'Ш', 0xD9: 'Щ', 0xDA: 'Ъ', 0xDB: 'Ы', 0xDC: 'Ь', 0xDD: 'Э', 0xDE: 'Ю', 0xDF: 'Я',
  0xE0: 'а', 0xE1: 'б', 0xE2: 'в', 0xE3: 'г', 0xE4: 'д', 0xE5: 'е', 0xE6: 'ж', 0xE7: 'з',
  0xE8: 'и', 0xE9: 'й', 0xEA: 'к', 0xEB: 'л', 0xEC: 'м', 0xED: 'н', 0xEE: 'о', 0xEF: 'п',
  0xF0: 'р', 0xF1: 'с', 0xF2: 'т', 0xF3: 'у', 0xF4: 'ф', 0xF5: 'х', 0xF6: 'ц', 0xF7: 'ч',
  0xF8: 'ш', 0xF9: 'щ', 0xFA: 'ъ', 0xFB: 'ы', 0xFC: 'ь', 0xFD: 'э', 0xFE: 'ю', 0xFF: 'я',
};

function decodeWindows1251(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    if (byte >= 0x80 && byte <= 0xFF) {
      result += WINDOWS1251_TO_UTF8[byte] || String.fromCharCode(byte);
    } else {
      result += String.fromCharCode(byte);
    }
  }
  return result;
}

function decodeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, c) => String.fromCharCode(parseInt(c, 16)));
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]*>/g, "")
    .trim();
}

/**
 * Парсинг VK с автоопределением кодировки
 */
async function fetchVKPost(url: string): Promise<{
  title: string;
  description: string;
  content: string;
  image: string;
  mediaList: Array<{ url: string; type: "image" | "video" }>;
} | null> {
  try {
    console.log("DEBUG: Parsing VK:", url);
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "ru-RU,ru;q=0.9",
      },
    });

    if (!response.ok) {
      console.log("DEBUG: Failed, status:", response.status);
      return null;
    }

    // Получаем ArrayBuffer
    const arrayBuffer = await response.arrayBuffer();
    
    // Пробуем определить кодировку по Content-Type
    const contentType = response.headers.get('content-type') || '';
    let html = "";
    
    if (contentType.includes('windows-1251') || contentType.includes('cp1251')) {
      console.log("DEBUG: Detected Windows-1251 from Content-Type");
      html = decodeWindows1251(arrayBuffer);
    } else {
      // Пробуем UTF-8 сначала
      try {
        html = new TextDecoder('utf-8').decode(arrayBuffer);
        // Проверяем, нет ли кракозябр (простая эвристика)
        if (html.includes('') || /[\u0000-\u001F]/.test(html)) {
          console.log("DEBUG: UTF-8 has invalid chars, trying Windows-1251");
          html = decodeWindows1251(arrayBuffer);
        }
      } catch (e) {
        console.log("DEBUG: UTF-8 decode failed, using Windows-1251");
        html = decodeWindows1251(arrayBuffer);
      }
    }
    
    console.log("DEBUG: HTML length:", html.length);
    console.log("DEBUG: First 100 chars:", html.substring(0, 100));

    // Open Graph метаданные
    const getOg = (property: string): string => {
      const match = html.match(
        new RegExp(`<meta[^>]+property=["']og:${property}["'][^>]*content=["']([^"']+)["']`, "i")
      );
      if (match) {
        const value = decodeHtml(match[1]);
        console.log("DEBUG: OG", property, "=", value.substring(0, 50));
        return value;
      }
      return "";
    };

    const ogTitle = getOg("title");
    const ogDescription = getOg("description");
    const ogImage = getOg("image");

    console.log("DEBUG: OG title:", ogTitle);
    console.log("DEBUG: OG description:", ogDescription);

    // Ищем текст в meta name="description"
    const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const metaDescription = metaDesc ? decodeHtml(metaDesc[1]) : "";
    
    const content = ogDescription || metaDescription || ogTitle;

    // Изображения
    const mediaList: Array<{ url: string; type: "image" | "video" }> = [];
    
    if (ogImage) {
      mediaList.push({ url: ogImage, type: "image" });
    }
    
    // Ищем все изображения userapi.com
    const imgRegex = /https?:\/\/sun\d+-\d+\.userapi\.com\/[^"'\s<>]+/gi;
    const imgMatches = html.matchAll(imgRegex);
    for (const match of imgMatches) {
      const imgUrl = match[0].replace(/[)"']/g, '');
      if (!mediaList.find(m => m.url === imgUrl)) {
        mediaList.push({ url: imgUrl, type: "image" });
        console.log("DEBUG: Found image:", imgUrl.substring(0, 50));
      }
    }

    console.log("DEBUG: Total images:", mediaList.length);

    return {
      title: ogTitle || "Новости",
      description: content,
      content: content,
      image: mediaList[0]?.url || "",
      mediaList: mediaList.slice(0, 15),
    };
  } catch (error) {
    console.error("DEBUG: Error:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url) throw new Error("URL is required");

    let normalizedUrl = url.trim();

    // VK
    if (normalizedUrl.includes("vk.com/wall-")) {
      console.log("DEBUG: VK detected");
      const vkData = await fetchVKPost(normalizedUrl);

      if (vkData) {
        console.log("DEBUG: VK success - title:", vkData.title);
        return new Response(
          JSON.stringify({ ...vkData, source: "vk" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } }
        );
      }
    }

    // Telegram
    let fetchUrl = normalizedUrl;
    if (normalizedUrl.includes("t.me/")) {
      fetchUrl = normalizedUrl.replace("?single", "");
      const parts = fetchUrl.split("/");
      const channelOrPost = parts[parts.length - 1];
      if (/^\d+$/.test(channelOrPost)) {
        const channel = parts[parts.length - 2];
        fetchUrl = `https://t.me/${channel}/${channelOrPost}?embed=1`;
      }
    }

    const res = await fetch(fetchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "ru-RU,ru;q=0.9",
      },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const arrayBuffer = await res.arrayBuffer();
    const html = new TextDecoder('utf-8').decode(arrayBuffer);
    
    const getOg = (property: string): string => {
      const match = html.match(
        new RegExp(`<meta[^>]+property=["']og:${property}["'][^>]*content=["']([^"']+)["']`, "i")
      );
      return match ? decodeHtml(match[1]) : "";
    };

    const title = getOg("title") || "Новости";
    const description = getOg("description");
    const ogImage = getOg("image");
    
    const mediaList: Array<{ url: string; type: "image" | "video" }> = [];
    if (ogImage) mediaList.push({ url: ogImage, type: "image" });

    return new Response(
      JSON.stringify({
        title,
        description: description || title,
        content: description || title,
        image: mediaList[0]?.url || "",
        mediaList,
        source: normalizedUrl.includes("t.me") ? "telegram" : "web",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } }
    );
  } catch (e) {
    console.error("ERROR:", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
