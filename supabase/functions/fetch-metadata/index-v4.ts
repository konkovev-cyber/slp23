import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// VK API credentials
const VK_SERVICE_KEY = "bc15f23abc15f23abc15f23a7dbf2b05adbbc15bc15f23ad58326cf040249df893a4523";
const VK_VERSION = "2024.01.01";

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
 * Извлечение данных из поста VK через API
 */
async function fetchVKPost(url: string): Promise<{
  title: string;
  description: string;
  content: string;
  image: string;
  mediaList: Array<{ url: string; type: "image" | "video" }>;
} | null> {
  try {
    const wallMatch = url.match(/vk\.com\/wall(-?\d+)_(\d+)/);
    if (!wallMatch) {
      console.log("DEBUG: Not a VK wall URL");
      return null;
    }

    const ownerId = wallMatch[1];
    const postId = wallMatch[2];

    console.log("DEBUG: VK URL - owner:", ownerId, "post:", postId);

    const apiUrl = `https://api.vk.com/method/wall.getById?posts=${ownerId}_${postId}&extended=1&v=${VK_VERSION}`;
    
    console.log("DEBUG: Calling VK API");
    
    // Запрос к VK API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        "Authorization": `ServiceKey ${VK_SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
    });

    console.log("DEBUG: Response status:", response.status);

    if (!response.ok) {
      console.error("DEBUG: VK API error - HTTP", response.status);
      return null;
    }

    // Используем .json() напрямую — Deno сам декодирует UTF-8
    const data = await response.json();
    
    console.log("DEBUG: Has error?", !!data.error);

    if (data.error) {
      console.error("DEBUG: VK API error:", data.error);
      return null;
    }

    const post = data.response?.items?.[0];
    if (!post) {
      console.error("DEBUG: Post not found");
      return null;
    }

    // Извлекаем текст — response.json() уже декодировал UTF-8
    const content = post.text || "";
    console.log("DEBUG: Content length:", content.length);
    console.log("DEBUG: First 50 chars:", content.substring(0, 50));

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

    if (post.attachments) {
      console.log("DEBUG: Attachments:", post.attachments.length);
      for (const attachment of post.attachments) {
        if (attachment.type === "photo" && attachment.photo) {
          const photo = attachment.photo;
          let imageUrl = photo.photo_1280 || photo.photo_807 || photo.photo_604;
          
          if (photo.sizes && Array.isArray(photo.sizes)) {
            const sorted = photo.sizes.sort((a: any, b: any) => (b.height || 0) - (a.height || 0));
            if (sorted.length > 0) imageUrl = sorted[0].url || imageUrl;
          }
          
          if (imageUrl) {
            mediaList.push({ url: imageUrl, type: "image" });
            console.log("DEBUG: Added photo:", imageUrl);
          }
        }

        if (attachment.type === "video" && attachment.video) {
          const video = attachment.video;
          const videoUrl = video.player || video.src || `https://vk.com/video${video.owner_id}_${video.id}`;
          if (videoUrl) {
            mediaList.push({ url: videoUrl, type: "video" });
          }
        }
      }
    }

    const image = mediaList.find(m => m.type === "image")?.url || "";

    return {
      title,
      description: content.substring(0, 255) + (content.length > 255 ? "..." : ""),
      content,
      image,
      mediaList: mediaList.slice(0, 15),
    };
  } catch (error) {
    console.error("DEBUG: VK fetch error:", error);
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
      console.log("DEBUG: VK URL detected");
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
