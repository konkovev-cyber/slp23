import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Patterns for non-content images
const GARBAGE_PATTERNS = [
  /emoji/i, /icon/i, /favicon/i, /avatar/i, /logo/i, /pixel/i, /ads/i, /banner/i,
  /loading/i, /spinner/i, /marker/i, /sprite/i, /placeholder/i
];

// Patterns for video detection
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

async function getTextWithEncoding(res: Response): Promise<string> {
  const buffer = await res.arrayBuffer();
  return new TextDecoder("utf-8", { fatal: false }).decode(buffer);
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

  return {
    title: decodeHtml(getMeta("og:title") || (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "").trim()),
    description: decodeHtml(getMeta("og:description") || getMeta("description") || ""),
    image: getMeta("og:image") || getMeta("twitter:image") || "",
  };
}

function extractMedia(html: string) {
  const urls: string[] = [];

  // 1. OG Image
  const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1];
  if (ogImage) urls.push(ogImage);

  // 2. Background images (often used in Telegram/VK)
  const bgMatches = html.matchAll(/background-image:url\(['"]?([^'"]+)['"]?\)/gi);
  for (const match of bgMatches) {
    if (match[1] && !urls.includes(match[1])) urls.push(match[1]);
  }

  // 3. Regular img tags
  const imgTags = html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
  for (const match of imgTags) {
    if (match[1].startsWith("http") && !urls.includes(match[1])) urls.push(match[1]);
  }

  // 4. Video links (YouTube, etc)
  const videoLinks = html.matchAll(/href=["'](https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|vimeo\.com|vk\.com\/video)[^"']+)["']/gi);
  for (const match of videoLinks) {
    if (match[1] && !urls.includes(match[1])) urls.push(match[1]);
  }

  return urls
    .filter(url => !isGarbageImage(url))
    .map(url => ({
      url,
      type: detectType(url)
    }));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url) throw new Error("URL is required");

    let normalizedUrl = url.trim();
    let fetchUrl = normalizedUrl;

    // Telegram specific handling
    if (normalizedUrl.includes("t.me/")) {
      fetchUrl = normalizedUrl.replace("?single", "");
      if (!fetchUrl.includes("embed=1")) {
        fetchUrl += (fetchUrl.includes("?") ? "&" : "?") + "embed=1";
      }
    }

    const res = await fetch(fetchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await getTextWithEncoding(res);
    const metadata = extractMetadata(html);

    let content = "";
    if (normalizedUrl.includes("t.me")) {
      const textMatch = html.match(/<div[^>]*class="[^"]*tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      content = textMatch ? stripHtml(decodeHtml(textMatch[1])) : "";
    } else if (normalizedUrl.includes("vk.com")) {
      const textMatch = html.match(/<div[^>]*class="[^"]*wall_post_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      content = textMatch ? stripHtml(decodeHtml(textMatch[1])) : "";
    } else {
      content = metadata.description;
    }

    const mediaList = extractMedia(html);

    // Ensure main image is included if not garbage
    const mainImage = metadata.image;
    if (mainImage && !isGarbageImage(mainImage) && !mediaList.find(m => m.url === mainImage)) {
      mediaList.unshift({ url: mainImage, type: "image" });
    }

    return new Response(
      JSON.stringify({
        title: metadata.title || "Новости",
        description: metadata.description,
        content: content || metadata.description,
        image: mediaList.find(m => m.type === "image")?.url || "",
        mediaList: mediaList.slice(0, 15),
        source: normalizedUrl.includes("t.me") ? "telegram" : normalizedUrl.includes("vk.com") ? "vk" : "web",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
