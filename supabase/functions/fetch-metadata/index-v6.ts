import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GARBAGE_PATTERNS = [
  /emoji/i, /icon/i, /favicon/i, /avatar/i, /logo/i, /pixel/i, /ads/i, /banner/i,
  /loading/i, /spinner/i, /marker/i, /sprite/i, /placeholder/i
];

const VIDEO_PATTERNS = [
  /youtube\.com\/watch/i, /youtu\.be\//i, /vimeo\.com\//i,
  /vk\.com\/video/i, /vk\.com\/clip/i,
  /t\.me\/[^\/]+\/\d+\?video=1/i, /mp4$/i, /webm$/i
];

function isGarbageImage(url: string): boolean {
  return GARBAGE_PATTERNS.some(pattern => pattern.test(url));
}

function detectType(url: string): "image" | "video" {
  if (VIDEO_PATTERNS.some(pattern => pattern.test(url))) return "video";
  return "image";
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
 * Парсинг поста VK через HTML
 */
async function fetchVKPost(url: string): Promise<{
  title: string;
  description: string;
  content: string;
  image: string;
  mediaList: Array<{ url: string; type: "image" | "video" }>;
} | null> {
  try {
    console.log("DEBUG: Parsing VK post:", url);
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "ru-RU,ru;q=0.9",
      },
    });

    console.log("DEBUG: Status:", response.status);

    if (!response.ok) return null;

    const html = await response.text();
    console.log("DEBUG: HTML length:", html.length);

    // Извлекаем текст - пробуем много селекторов
    let content = "";
    
    const selectors = [
      // Новые селекторы VK
      /<div[^>]*class="[^"]*Post__text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*post__text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*wall_post_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*WallPostText[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*data-field="post"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*id="post_text_[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<span[^>]*class="[^"]*post__text[^"]*"[^>]*>([\s\S]*?)<\/span>/i,
      /<div[^>]*class="[^"]*PagePost__text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    ];
    
    for (const selector of selectors) {
      const match = html.match(selector);
      if (match) {
        console.log("DEBUG: Matched selector:", selector.source);
        const raw = match[1];
        content = stripHtml(decodeHtml(raw));
        if (content.length > 20) break;
      }
    }
    
    console.log("DEBUG: Content length:", content.length);
    console.log("DEBUG: Content:", content.substring(0, 200));

    // Заголовок
    let title = "Новости";
    if (content) {
      const firstLine = content.split('\n').filter(l => l.trim().length > 0)[0];
      if (firstLine) title = firstLine.substring(0, 100).trim();
    }

    // Изображения
    const mediaList: Array<{ url: string; type: "image" | "video" }> = [];
    
    // Ищем все изображения userapi.com
    const imgRegex = /https?:\/\/sun\d+-\d+\.userapi\.com\/[^"'\s<>]+/gi;
    const imgMatches = html.matchAll(imgRegex);
    for (const match of imgMatches) {
      const imgUrl = match[0].replace(/[)"']/g, '');
      if (!isGarbageImage(imgUrl) && !mediaList.find(m => m.url === imgUrl)) {
        mediaList.push({ url: imgUrl, type: "image" });
      }
    }

    const image = mediaList[0]?.url || "";
    console.log("DEBUG: Images:", mediaList.length);

    return {
      title,
      description: content.substring(0, 255) + (content.length > 255 ? "..." : ""),
      content,
      image,
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

    const html = await res.text();
    
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? decodeHtml(titleMatch[1].trim()) : "Новости";
    
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const description = descMatch ? decodeHtml(descMatch[1]) : "";
    
    const mediaList: Array<{ url: string; type: "image" | "video" }> = [];
    const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    if (ogImage && ogImage[1]) mediaList.push({ url: ogImage[1], type: "image" });

    return new Response(
      JSON.stringify({
        title,
        description,
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
