import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// VK API credentials
const VK_SERVICE_KEY = "bc15f23abc15f23abc15f23a7dbf2b05adbbc15bc15f23ad58326cf040249df893a4523";
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

function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]*>/g, "")
    .trim();
}

/**
 * Robustly get text from response with encoding detection
 */
async function getTextWithEncoding(res: Response): Promise<string> {
  const buffer = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") || "";

  // 1. Try to get charset from header
  let charset = "utf-8";
  const charsetMatch = contentType.match(/charset=([^;]+)/i);
  if (charsetMatch) {
    charset = charsetMatch[1].toLowerCase().trim();
  }

  try {
    const decoder = new TextDecoder(charset);
    const text = decoder.decode(buffer);

    // 2. If we see replacement characters, try fallback
    if (text.includes("") || text.includes("\uFFFD")) {
      // Common Russian encodings if UTF-8 fails
      const fallbacks = ["windows-1251", "koi8-r"];
      for (const fb of fallbacks) {
        if (fb === charset) continue;
        try {
          const fbDecoder = new TextDecoder(fb);
          const fbText = fbDecoder.decode(buffer);
          if (!fbText.includes("") && !fbText.includes("\uFFFD")) {
            return fbText;
          }
        } catch { /* ignore */ }
      }
    }
    return text;
  } catch {
    // Last resort
    return new TextDecoder("utf-8").decode(buffer);
  }
}

function extractMetadata(html: string) {
  const getMeta = (property: string): string => {
    const patterns = [
      new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]*content=["']([^"']+)["']`, "i"),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${property}["']`, "i"),
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) return decodeHtml(match[1]);
    }
    return "";
  };

  const title = decodeHtml(getMeta("og:title") || (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "").trim());
  return {
    title,
    description: decodeHtml(getMeta("og:description") || getMeta("description") || ""),
    image: getMeta("og:image") || getMeta("twitter:image") || "",
  };
}

async function fetchVKPost(url: string): Promise<{
  title: string;
  description: string;
  content: string;
  image: string;
  mediaList: Array<{ url: string; type: "image" | "video" }>;
  published_at?: string;
} | null> {
  try {
    // Loosen regex to match wall-ID_POSTID anywhere in URL
    const wallMatch = url.match(/wall(-?\d+)_(\d+)/);
    if (!wallMatch) return null;

    const posts = `${wallMatch[1]}_${wallMatch[2]}`;
    const apiUrl = `https://api.vk.com/method/wall.getById?posts=${posts}&extended=1&v=${VK_VERSION}&access_token=${VK_SERVICE_KEY}`;

    console.log(`[fetch-metadata] Fetching VK API: ${posts}`);
    const response = await fetch(apiUrl);
    if (!response.ok) return null;

    const data = await response.json();
    if (data.error || !data.response?.items?.[0]) return null;

    const post = data.response.items[0];
    const contentText = post.text ? stripHtml(decodeHtml(post.text)) : "";
    const sourceUrl = `https://vk.com/wall${post.owner_id}_${post.id}`;
    const content = contentText + `\n\nИсточник: ${sourceUrl}`;

    let title = "Новости VK";
    if (contentText) {
      const firstLine = contentText.split('\n').filter(l => l.trim().length > 0)[0];
      if (firstLine) {
        title = firstLine.slice(0, 100).trim();
      }
    }

    const forceHttps = (u: string) => u ? u.replace(/^http:\/\//i, 'https://') : "";
    const mediaList: Array<{ url: string; type: "image" | "video" }> = [];
    let coverImage = "";

    if (post.attachments) {
      for (const attachment of post.attachments) {
        if (attachment.type === "photo" && attachment.photo) {
          const imageUrl = attachment.photo.sizes?.find((s: any) => s.type === "w" || s.type === "z" || s.type === "y" || s.type === "x")?.url
            || attachment.photo.sizes?.[attachment.photo.sizes.length - 1]?.url
            || attachment.photo.photo_1280;
          if (imageUrl) {
            const httpsUrl = forceHttps(imageUrl);
            mediaList.push({ url: httpsUrl, type: "image" });
            if (!coverImage) coverImage = httpsUrl;
          }
        }

        if (attachment.type === "video" && attachment.video) {
          const videoLink = `https://vk.com/video${attachment.video.owner_id}_${attachment.video.id}`;
          const videoThumb = attachment.video.image?.find((s: any) => s.width >= 1280 || s.width >= 800)?.url
            || attachment.video.image?.[attachment.video.image.length - 1]?.url;

          mediaList.push({ url: videoLink, type: "video" });
          if (!coverImage && videoThumb) coverImage = forceHttps(videoThumb);
        }
      }
    }

    return {
      title,
      description: contentText.slice(0, 255) + (contentText.length > 255 ? "..." : ""),
      content,
      image: coverImage || (mediaList.find(m => m.type === "image")?.url || ""),
      mediaList: mediaList.slice(0, 15),
      published_at: post.date ? new Date(post.date * 1000).toISOString() : new Date().toISOString(),
    };
  } catch (error) {
    console.error("[fetch-metadata] VK fetch error:", error);
    return null;
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { url } = body;
    if (!url) throw new Error("URL is required");

    let normalizedUrl = url.trim();

    // Try VK API first if it looks like a VK URL
    if (normalizedUrl.includes("vk.com")) {
      const vkData = await fetchVKPost(normalizedUrl);
      if (vkData) {
        return new Response(
          JSON.stringify({ ...vkData, source: "vk" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } }
        );
      }
    }

    // Fallback to HTML scraping with encoding detection
    const res = await fetch(normalizedUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await getTextWithEncoding(res);
    const metadata = extractMetadata(html);

    return new Response(
      JSON.stringify({
        title: metadata.title || "Новости",
        description: metadata.description,
        content: metadata.description,
        image: metadata.image ? metadata.image.replace(/^http:\/\//i, 'https://') : "",
        mediaList: [],
        source: normalizedUrl.includes("t.me") ? "telegram" : "web",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});
