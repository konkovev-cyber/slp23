import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Парсинг VK через HTML с упрощённым декодированием
 */
async function fetchVKPost(url: string): Promise<{
  title: string;
  description: string;
  content: string;
  image: string;
  mediaList: Array<{ url: string; type: "image" | "video" }>;
} | null> {
  try {
    console.log("DEBUG: Parsing VK via HTML:", url);
    
    // Извлекаем owner_id и post_id
    const wallMatch = url.match(/wall(-?\d+)_(\d+)/);
    if (!wallMatch) {
      console.log("DEBUG: Not a VK wall URL");
      return null;
    }

    const ownerId = wallMatch[1];
    const postId = wallMatch[2];
    console.log("DEBUG: VK post - owner:", ownerId, "post:", postId);

    // Загружаем страницу поста
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "ru-RU,ru;q=0.9",
      },
    });

    console.log("DEBUG: Response status:", response.status);

    if (!response.ok) {
      console.log("DEBUG: Failed to fetch VK page");
      return null;
    }

    // Получаем HTML как текст (Deno сам декодирует)
    const html = await response.text();
    
    console.log("DEBUG: HTML length:", html.length);
    console.log("DEBUG: First 300 chars:", html.substring(0, 300));

    // Open Graph метаданные (всегда в UTF-8!)
    const getOg = (property: string): string => {
      const match = html.match(
        new RegExp(`<meta[^>]+property=["']og:${property}["'][^>]*content=["']([^"']+)["']`, "i")
      );
      if (match) {
        return match[1]
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&nbsp;/g, " ")
          .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c)));
      }
      return "";
    };

    const ogTitle = getOg("title");
    const ogDescription = getOg("description");
    let ogImage = getOg("image");

    console.log("DEBUG: OG title:", ogTitle);
    console.log("DEBUG: OG description:", ogDescription);

    // Ищем текст в data-attributes (VK хранит текст там)
    let content = ogDescription || ogTitle;
    
    // Пробуем найти в data-template (VK хранит шаблон поста)
    const dataTemplateMatch = html.match(/data-template=["']([^"']+)["']/i);
    if (dataTemplateMatch) {
      try {
        const template = JSON.parse(decodeURIComponent(dataTemplateMatch[1]));
        if (template.text) {
          content = template.text
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">");
          console.log("DEBUG: Found text in data-template");
        }
      } catch (e) {
        console.log("DEBUG: data-template parse failed");
      }
    }
    
    // Ищем в meta name="description"
    const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']+)["']/i);
    if (metaDesc) {
      const metaContent = metaDesc[1]
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
      if (metaContent.length > content.length) {
        content = metaContent;
        console.log("DEBUG: Using meta description");
      }
    }

    // Изображения
    const mediaList: Array<{ url: string; type: "image" | "video" }> = [];
    
    if (ogImage) {
      ogImage = ogImage.replace('http://', 'https://');
      mediaList.push({ url: ogImage, type: "image" });
    }
    
    // Ищем все изображения VK
    const imgRegex = /https?:\/\/sun\d+-\d+\.userapi\.com\/[^"'\s<>]+/gi;
    const imgMatches = html.matchAll(imgRegex);
    for (const match of imgMatches) {
      let imgUrl = match[0].replace(/[)"']/g, '');
      imgUrl = imgUrl.replace('http://', 'https://');
      if (!mediaList.find(m => m.url === imgUrl)) {
        mediaList.push({ url: imgUrl, type: "image" });
        console.log("DEBUG: Found image:", imgUrl.substring(0, 50));
      }
    }

    console.log("DEBUG: Total images:", mediaList.length);
    console.log("DEBUG: Final content:", content.substring(0, 100));

    return {
      title: ogTitle || "Новости",
      description: content.substring(0, 255) + (content.length > 255 ? "..." : ""),
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
    if (normalizedUrl.includes("vk.com")) {
      console.log("DEBUG: VK detected");
      const vkData = await fetchVKPost(normalizedUrl);

      if (vkData) {
        console.log("DEBUG: VK success - title:", vkData.title);
        return new Response(
          JSON.stringify({ ...vkData, source: "vk" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } }
        );
      }
      
      console.log("DEBUG: VK failed");
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
      return match ? match[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&") : "";
    };

    const title = getOg("title") || "Новости";
    const description = getOg("description");
    const ogImage = getOg("image");
    
    const mediaList: Array<{ url: string; type: "image" | "video" }> = [];
    if (ogImage) mediaList.push({ url: ogImage.replace('http://', 'https://'), type: "image" });

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
