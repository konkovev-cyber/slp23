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
 * Парсинг VK через Open Graph и JSON-LD
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

    const html = await response.text();
    console.log("DEBUG: HTML length:", html.length);

    // 1. Open Graph метаданные
    const getOg = (property: string): string => {
      const match = html.match(
        new RegExp(`<meta[^>]+property=["']og:${property}["'][^>]*content=["']([^"']+)["']`, "i")
      );
      return match ? decodeHtml(match[1]) : "";
    };

    const ogTitle = getOg("title");
    const ogDescription = getOg("description");
    const ogImage = getOg("image");

    console.log("DEBUG: OG title:", ogTitle);
    console.log("DEBUG: OG description:", ogDescription);
    console.log("DEBUG: OG image:", ogImage);

    // 2. JSON-LD (если есть)
    let jsonLdContent = "";
    const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch) {
      try {
        const jsonLd = JSON.parse(jsonLdMatch[1]);
        if (jsonLd.articleBody) {
          jsonLdContent = jsonLd.articleBody;
          console.log("DEBUG: JSON-LD content:", jsonLdContent.substring(0, 100));
        }
      } catch (e) {
        console.log("DEBUG: JSON-LD parse failed");
      }
    }

    // 3. Ищем текст в data-attributes
    let dataContent = "";
    const dataTextMatch = html.match(/data-text=["']([^"']+)["']/i);
    if (dataTextMatch) {
      dataContent = decodeHtml(dataTextMatch[1]);
      console.log("DEBUG: data-text:", dataContent.substring(0, 100));
    }

    // 4. Собираем контент
    let content = jsonLdContent || dataContent || ogDescription || ogTitle;
    
    // 5. Изображения
    const mediaList: Array<{ url: string; type: "image" | "video" }> = [];
    
    if (ogImage) {
      mediaList.push({ url: ogImage, type: "image" });
    }
    
    // Ищем все изображения VK
    const imgRegex = /https?:\/\/sun\d+-\d+\.userapi\.com\/[^"'\s<>]+/gi;
    const imgMatches = html.matchAll(imgRegex);
    for (const match of imgMatches) {
      const imgUrl = match[0].replace(/[)"']/g, '');
      if (!mediaList.find(m => m.url === imgUrl)) {
        mediaList.push({ url: imgUrl, type: "image" });
      }
    }

    console.log("DEBUG: Total images:", mediaList.length);

    return {
      title: ogTitle || "Новости",
      description: ogDescription || content.substring(0, 255),
      content: content || ogDescription || ogTitle,
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
        console.log("DEBUG: VK success");
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
    
    const getOg = (property: string): string => {
      const match = html.match(
        new RegExp(`<meta[^>]+property=["']og:${property}["'][^>]*content=["']([^"']+)["']`, "i")
      );
      return match ? decodeHtml(match[1]) : "";
    };

    const title = getOg("title") || getOg("site_name") || "Новости";
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
