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

async function getTextWithEncoding(res: Response, _url: string): Promise<string> {
  const buffer = await res.arrayBuffer();
  // Используем fatal: false чтобы не падать на кривой кодировке, а заменять символы
  return new TextDecoder("utf-8", { fatal: false }).decode(buffer);
}

function extractMetadata(html: string, url: string) {
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

function extractTelegramContent(html: string) {
  // В эмбеде текст лежит в классе tgme_widget_message_text
  const textMatch = html.match(/<div[^>]*class="[^"]*tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  const content = textMatch ? stripHtml(decodeHtml(textMatch[1])) : "";

  const images: string[] = [];

  // 1. Ищем фоновые картинки (в альбомах Telegram они часто так)
  const bgMatches = html.matchAll(/background-image:url\(['"]?([^'"]+)['"]?\)/gi);
  for (const match of bgMatches) {
    if (match[1] && !images.includes(match[1])) images.push(match[1]);
  }

  // 2. Ищем обычные теги img
  const imgTags = html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
  for (const match of imgTags) {
    if (match[1].startsWith("http") && !images.includes(match[1])) images.push(match[1]);
  }

  // 3. Ищем атрибуты data-src (ленивая загрузка)
  const dataSrc = html.matchAll(/data-src=["']([^"']+)["']/gi);
  for (const match of dataSrc) {
    if (match[1] && !images.includes(match[1])) images.push(match[1]);
  }

  return { content, images };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { url } = await req.json();
    let normalizedUrl = url.trim();

    // КЛЮЧЕВОЕ: Превращаем ссылку TG в Embed, чтобы получить весь альбом и текст
    let fetchUrl = normalizedUrl;
    if (normalizedUrl.includes("t.me/")) {
      fetchUrl = normalizedUrl.replace("?single", "");
      fetchUrl += (fetchUrl.includes("?") ? "&" : "?") + "embed=1";
    }

    const res = await fetch(fetchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await getTextWithEncoding(res, fetchUrl);
    const metadata = extractMetadata(html, fetchUrl);
    let content = "";
    let mediaList: string[] = [];

    if (normalizedUrl.includes("t.me")) {
      const telegram = extractTelegramContent(html);
      content = telegram.content;
      mediaList = telegram.images;
    } else if (normalizedUrl.includes("vk.com")) {
      const textMatch = html.match(/<div[^>]*class="[^"]*wall_post_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      content = textMatch ? stripHtml(decodeHtml(textMatch[1])) : "";
      const vkImgs = html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*class="[^"]*wall_photo[^"]*"/gi);
      for (const m of vkImgs) if (m[1]) mediaList.push(m[1]);
    }

    if (mediaList.length === 0) {
      if (metadata.image) mediaList.push(metadata.image);
    }

    return new Response(
      JSON.stringify({
        title: metadata.title || "Новости",
        description: metadata.description,
        content: content || metadata.description,
        image: mediaList[0] || "",
        mediaList: mediaList.slice(0, 15),
        source: normalizedUrl.includes("t.me") ? "telegram" : "web",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
