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

const GENERIC_TITLES = [
  /telegram\s*widget/i, /telegram\s*:\s*contact/i, /vkontakte/i, /вконтакте/i, /wall\s*post/i, /запись\s*на\s*стене/i
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
 * Парсинг поста VK через HTML (вместо API)
 */
async function fetchVKPost(url: string): Promise<{
  title: string;
  description: string;
  content: string;
  image: string;
  mediaList: Array<{ url: string; type: "image" | "video" }>;
} | null> {
  try {
    console.log("DEBUG: Parsing VK post via HTML:", url);
    
    // Загружаем страницу поста
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
      },
    });

    console.log("DEBUG: Response status:", response.status);

    if (!response.ok) {
      console.error("DEBUG: Failed to fetch VK post");
      return null;
    }

    const html = await response.text();
    console.log("DEBUG: HTML length:", html.length);

    // Извлекаем текст поста
    let content = "";
    
    // Пробуем разные селекторы для текста
    const textSelectors = [
      /<div[^>]*class="[^"]*wall_post_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*WallPostText[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*post__text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*data-field="post"[^>]*>([\s\S]*?)<\/div>/i,
    ];
    
    for (const selector of textSelectors) {
      const match = html.match(selector);
      if (match && match[1].trim().length > 20) {
        content = stripHtml(decodeHtml(match[1]));
        console.log("DEBUG: Found content with selector");
        break;
      }
    }
    
    console.log("DEBUG: Content length:", content.length);
    console.log("DEBUG: First 100 chars:", content.substring(0, 100));

    // Заголовок
    let title = "Новости";
    if (content) {
      const firstLine = content.split('\n').filter(l => l.trim().length > 0)[0];
      if (firstLine) {
        title = firstLine.substring(0, 100).trim();
      }
    }
    console.log("DEBUG: Title:", title);

    // Изображения
    const mediaList: Array<{ url: string; type: "image" | "video" }> = [];
    
    // Ищем изображения в HTML
    const imgMatches = html.matchAll(/src=["'](https?:\/\/sun\d+-\d+\.userapi\.com\/[^"']+)["']/gi);
    for (const match of imgMatches) {
      const imgUrl = match[1];
      if (!isGarbageImage(imgUrl) && !mediaList.find(m => m.url === imgUrl)) {
        mediaList.push({ url: imgUrl, type: "image" });
        console.log("DEBUG: Found image:", imgUrl);
      }
    }
    
    // Ищем по data-src
    const dataSrcMatches = html.matchAll(/data-src=["'](https?:\/\/[^"']+)["']/gi);
    for (const match of dataSrcMatches) {
      const imgUrl = match[1];
      if (imgUrl.includes('userapi.com') && !isGarbageImage(imgUrl) && !mediaList.find(m => m.url === imgUrl)) {
        mediaList.push({ url: imgUrl, type: "image" });
      }
    }

    const image = mediaList.find(m => m.type === "image")?.url || "";

    console.log("DEBUG: Images found:", mediaList.length);

    return {
      title,
      description: content.substring(0, 255) + (content.length > 255 ? "..." : ""),
      content,
      image,
      mediaList: mediaList.slice(0, 15),
    };
  } catch (error) {
    console.error("DEBUG: VK HTML parse error:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url) throw new Error("URL is required");

    let normalizedUrl = url.trim();

    // VK - парсим HTML
    if (normalizedUrl.includes("vk.com/wall-")) {
      console.log("DEBUG: VK URL detected");
      const vkData = await fetchVKPost(normalizedUrl);

      if (vkData) {
        console.log("DEBUG: VK HTML parse success");
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
      } else {
        fetchUrl = `${fetchUrl}?embed=1`;
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
    if (ogImage && ogImage[1]) {
      mediaList.push({ url: ogImage[1], type: "image" });
    }

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
