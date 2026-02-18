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

async function getTextWithEncoding(res: Response): Promise<string> {
  const contentEncoding = res.headers.get("content-encoding") || "";
  const contentType = res.headers.get("content-type") || "";
  
  const text = await res.text();
  
  console.log("DEBUG: Content-Type:", contentType);
  console.log("DEBUG: Content-Encoding:", contentEncoding);
  console.log("DEBUG: Text length:", text.length);
  
  return text;
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
  const isGeneric = GENERIC_TITLES.some(p => p.test(title));

  return {
    title: isGeneric ? "" : title,
    description: decodeHtml(getMeta("og:description") || getMeta("description") || ""),
    image: getMeta("og:image") || getMeta("twitter:image") || "",
  };
}

function extractMedia(html: string) {
  const urls: string[] = [];

  const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1];
  if (ogImage) urls.push(ogImage);

  const bgMatches = html.matchAll(/background-image:url\(['"]?([^'"]+)['"]?\)/gi);
  for (const match of bgMatches) {
    if (match[1] && !urls.includes(match[1])) urls.push(match[1]);
  }

  const imgTags = html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
  for (const match of imgTags) {
    if (match[1].startsWith("http") && !urls.includes(match[1])) urls.push(match[1]);
  }

  const videoLinks = html.matchAll(/href=["'](https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|vimeo\.com|vk\.com\/video)[^"']+)["']/gi);
  for (const match of videoLinks) {
    if (match[1] && !urls.includes(match[1])) urls.push(match[1]);
  }

  const dataSrcMatches = html.matchAll(/data-src=["']([^"']+)["']/gi);
  for (const match of dataSrcMatches) {
    if (match[1] && match[1].startsWith("http") && !urls.includes(match[1])) urls.push(match[1]);
  }

  const srcsetMatches = html.matchAll(/srcset=["']([^"']+)["']/gi);
  for (const match of srcsetMatches) {
    const urlsFromSrcset = match[1].split(",").map(u => u.trim().split(/\s+/)[0]);
    for (const u of urlsFromSrcset) {
      if (u && u.startsWith("http") && !urls.includes(u)) urls.push(u);
    }
  }

  const dataWebpMatches = html.matchAll(/data-webp=["']([^"']+)["']/gi);
  for (const match of dataWebpMatches) {
    if (match[1] && match[1].startsWith("http") && !urls.includes(match[1])) urls.push(match[1]);
  }

  const dataSrcsetMatches = html.matchAll(/data-srcset=["']([^"']+)["']/gi);
  for (const match of dataSrcsetMatches) {
    const urlsFromSrcset = match[1].split(",").map(u => u.trim().split(/\s+/)[0]);
    for (const u of urlsFromSrcset) {
      if (u && u.startsWith("http") && !urls.includes(u)) urls.push(u);
    }
  }

  const telegraMatches = html.matchAll(/https:\/\/telegra\.ph\/file\/[^\s"'<>]+/gi);
  for (const match of telegraMatches) {
    const url = match[0].replace(/["')]$/, "");
    if (url && !urls.includes(url)) urls.push(url);
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

    // Telegram
    let fetchUrl = normalizedUrl;
    if (normalizedUrl.includes("t.me/")) {
      fetchUrl = normalizedUrl.replace("?single", "");
      if (!fetchUrl.includes("/s/") && !fetchUrl.includes("/embed/")) {
        const parts = fetchUrl.split("/");
        const channelOrPost = parts[parts.length - 1];
        if (/^\d+$/.test(channelOrPost)) {
          const channel = parts[parts.length - 2];
          fetchUrl = `https://t.me/${channel}/${channelOrPost}?embed=1`;
        } else {
          fetchUrl = `${fetchUrl}?embed=1`;
        }
      }
    }

    const res = await fetch(fetchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Cache-Control": "no-cache",
      },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await getTextWithEncoding(res);
    const metadata = extractMetadata(html);

    let content = "";
    if (normalizedUrl.includes("t.me")) {
      const telegramSelectors = [
        /<div[^>]*class="[^"]*tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class="[^"]*tgme_widget_message_bubble[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class="[^"]*message-text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      ];
      for (const selector of telegramSelectors) {
        const match = html.match(selector);
        if (match && match[1].trim().length > 20) {
          content = stripHtml(decodeHtml(match[1]));
          break;
        }
      }
    } else {
      content = metadata.description || "";
    }

    const mediaList = extractMedia(html);

    let finalTitle = metadata.title;
    if (!finalTitle && content) {
      const lines = content.split('\n').filter(l => l.trim().length > 0);
      if (lines.length > 0) {
        finalTitle = lines[0].slice(0, 100).trim();
      }
    }

    const mainImage = metadata.image;
    if (mainImage && !isGarbageImage(mainImage) && !mediaList.find(m => m.url === mainImage)) {
      mediaList.unshift({ url: mainImage, type: "image" });
    }

    return new Response(
      JSON.stringify({
        title: finalTitle || "Новости",
        description: metadata.description,
        content: content || metadata.description,
        image: mediaList.find(m => m.type === "image")?.url || "",
        mediaList: mediaList.slice(0, 15),
        source: normalizedUrl.includes("t.me") ? "telegram"
                : normalizedUrl.includes("youtube.com") || normalizedUrl.includes("youtu.be") ? "youtube"
                : normalizedUrl.includes("zen.yandex.ru") || normalizedUrl.includes("dzen.ru") ? "zen"
                : "web",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
