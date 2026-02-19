import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
 * Парсинг VK через RSS (альтернатива API)
 * VK предоставляет RSS для некоторых страниц
 */
async function fetchVKPost(url: string): Promise<{
  title: string;
  description: string;
  content: string;
  image: string;
  mediaList: Array<{ url: string; type: "image" | "video" }>;
} | null> {
  try {
    console.log("DEBUG: Parsing VK via RSS/HTML:", url);
    
    // Пробуем получить RSS версию (если доступна)
    const rssUrl = url.replace('vk.com/', 'vk.com/rss/');
    
    let html = "";
    let useRss = false;
    
    // Пробуем RSS сначала
    try {
      const rssResponse = await fetch(rssUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/rss+xml,text/html,application/xhtml+xml",
          "Accept-Language": "ru-RU,ru;q=0.9",
        },
      });
      
      if (rssResponse.ok && rssResponse.headers.get('content-type')?.includes('xml')) {
        html = await rssResponse.text();
        useRss = true;
        console.log("DEBUG: Using RSS feed");
      }
    } catch (e) {
      console.log("DEBUG: RSS failed, using HTML");
    }
    
    // Если RSS не сработал, используем обычную страницу
    if (!useRss) {
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

      const arrayBuffer = await response.arrayBuffer();
      html = new TextDecoder('utf-8').decode(arrayBuffer);
    }
    
    console.log("DEBUG: HTML length:", html.length);

    // Для RSS парсим XML
    if (useRss) {
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      const descMatch = html.match(/<description>([^<]+)<\/description>/i);
      const contentMatch = html.match(/<content[^>]*>([^<]+)<\/content>/i);
      
      const title = titleMatch ? decodeHtml(titleMatch[1]) : "Новости";
      const description = descMatch ? decodeHtml(descMatch[1]) : "";
      const content = contentMatch ? decodeHtml(contentMatch[1]) : description;
      
      // Изображения из RSS
      const mediaList: Array<{ url: string; type: "image" | "video" }> = [];
      const imgMatches = html.matchAll(/<enclosure[^>]+url=["']([^"']+)["']/gi);
      for (const match of imgMatches) {
        mediaList.push({ url: match[1], type: "image" });
      }
      
      return {
        title,
        description,
        content,
        image: mediaList[0]?.url || "",
        mediaList: mediaList.slice(0, 15),
      };
    }

    // Для HTML используем Open Graph
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
