import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// VK API credentials
// 🔴 ЗАМЕНИТЕ НА СВОЙ ТОКЕН (получите через OAuth)
const VK_ACCESS_TOKEN = "ВАШ_ACCESS_TOKEN";
const VK_VERSION = "5.199";

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

/**
 * Получение поста VK через wall.getById с авторизацией
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
    
    // Извлекаем owner_id и post_id из URL
    const wallMatch = url.match(/vk\.com\/wall(-?\d+)_(\d+)/);
    if (!wallMatch) {
      console.log("DEBUG: Not a VK wall URL");
      return null;
    }

    const ownerId = wallMatch[1];
    const postId = wallMatch[2];
    console.log("DEBUG: VK post - owner:", ownerId, "post:", postId);

    // Используем wall.getById с access_token
    const apiUrl = `https://api.vk.com/method/wall.getById?posts=${ownerId}_${postId}&extended=1&v=${VK_VERSION}&access_token=${VK_ACCESS_TOKEN}`;
    console.log("DEBUG: Calling VK API (wall.getById)");
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      console.log("DEBUG: VK API failed, status:", response.status);
      return null;
    }

    // Явное декодирование UTF-8
    const arrayBuffer = await response.arrayBuffer();
    const responseText = new TextDecoder('utf-8').decode(arrayBuffer);
    
    console.log("DEBUG: Raw response (first 200):", responseText.substring(0, 200));
    
    const data = JSON.parse(responseText);
    console.log("DEBUG: Parsed JSON - has error?", !!data.error);
    
    if (data.error) {
      console.error("DEBUG: VK API error:", data.error);
      return null;
    }

    const post = data.response?.items?.[0];
    if (!post) {
      console.log("DEBUG: Post not found");
      return null;
    }
    
    return parsePost(post);
  } catch (error) {
    console.error("DEBUG: Error:", error);
    return null;
  }
}

/**
 * Парсинг объекта поста VK
 */
function parsePost(post: any): {
  title: string;
  description: string;
  content: string;
  image: string;
  mediaList: Array<{ url: string; type: "image" | "video" }>;
} {
  const content = post.text || "";
  console.log("DEBUG: Content length:", content.length);
  console.log("DEBUG: First 100 chars:", content.substring(0, 100));
  
  // Заголовок - первая строка
  let title = "Новости";
  if (content) {
    const firstLine = content.split('\n').filter(l => l.trim().length > 0)[0];
    if (firstLine) title = firstLine.substring(0, 100).trim();
  }
  console.log("DEBUG: Title:", title);
  
  // Изображения
  const mediaList: Array<{ url: string; type: "image" | "video" }> = [];
  
  if (post.attachments) {
    console.log("DEBUG: Attachments:", post.attachments.length);
    for (const attachment of post.attachments) {
      if (attachment.type === "photo" && attachment.photo) {
        const photo = attachment.photo;
        let imageUrl = photo.photo_1280 || photo.photo_807 || photo.photo_604;
        // Заменяем http на https
        if (imageUrl) {
          imageUrl = imageUrl.replace('http://', 'https://');
          mediaList.push({ url: imageUrl, type: "image" });
          console.log("DEBUG: Added photo:", imageUrl.substring(0, 50));
        }
      }
      
      if (attachment.type === "video" && attachment.video) {
        const video = attachment.video;
        let videoUrl = video.player || video.src || `https://vk.com/video${video.owner_id}_${video.id}`;
        videoUrl = videoUrl.replace('http://', 'https://');
        mediaList.push({ url: videoUrl, type: "video" });
      }
    }
  }
  
  // Копии (репосты)
  if (post.copy_history && post.copy_history.length > 0) {
    const copiedPost = post.copy_history[0];
    if (copiedPost.attachments) {
      for (const attachment of copiedPost.attachments) {
        if (attachment.type === "photo" && attachment.photo) {
          const photo = attachment.photo;
          let imageUrl = photo.photo_1280 || photo.photo_807 || photo.photo_604;
          if (imageUrl) {
            imageUrl = imageUrl.replace('http://', 'https://');
            if (!mediaList.find(m => m.url === imageUrl)) {
              mediaList.push({ url: imageUrl, type: "image" });
            }
          }
        }
      }
    }
  }
  
  console.log("DEBUG: Total media:", mediaList.length);
  
  return {
    title,
    description: content.substring(0, 255) + (content.length > 255 ? "..." : ""),
    content,
    image: mediaList[0]?.url || "",
    mediaList: mediaList.slice(0, 15),
  };
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
