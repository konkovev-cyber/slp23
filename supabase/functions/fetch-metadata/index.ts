import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function decodeHtmlEntities(str: string) {
  if (!str) return "";
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function safeTextFromHtml(html: string) {
  if (!html) return "";
  let processed = html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, " ");
  processed = decodeHtmlEntities(processed);
  return processed.split("\n").map(l => l.trim()).filter(l => l.length > 0).join("\n").trim();
}

async function readResponseText(res: Response, forceUtf8 = false) {
  const buf = await res.arrayBuffer();
  const tryDecode = (enc: string) => new TextDecoder(enc).decode(buf);

  if (forceUtf8) return tryDecode("utf-8");

  const contentType = res.headers.get("content-type") ?? "";
  const charsetMatch = contentType.match(/charset=([^;]+)/i);
  const charset = charsetMatch?.[1]?.trim().toLowerCase();

  if (charset && (charset !== "utf-8" && charset !== "utf8")) {
    try { return tryDecode(charset); } catch { }
  }

  const utf8Text = tryDecode("utf-8");
  if (!utf8Text.includes("\uFFFD")) return utf8Text;

  try {
    const cp1251Text = tryDecode("windows-1251");
    const rUtf8 = (utf8Text.match(/\uFFFD/g) || []).length;
    const r1251 = (cp1251Text.match(/\uFFFD/g) || []).length;
    if (r1251 < rUtf8) return cp1251Text;
  } catch { }

  return utf8Text;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { url } = await req.json();
    if (!url) return new Response(JSON.stringify({ error: "URL required" }), { status: 400, headers: corsHeaders });

    const normalized = url.trim();
    const urlObj = new URL(normalized);
    const host = urlObj.hostname.replace(/^www\./, "");
    const isSocial = host.includes("vk.com") || host.includes("t.me") || host.includes("telegram.me");
    const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

    // 1. VK oEmbed specialized handling
    if (host.includes("vk.com")) {
      try {
        const oMatch = normalized.match(/wall(-?\d+)_(\d+)/) || normalized.match(/video(-?\d+)_(\d+)/);
        const oUrl = `https://vk.com/oembed?url=${encodeURIComponent(normalized)}&format=json`;
        const o = await fetch(oUrl, { headers: { "User-Agent": userAgent } });
        if (o.ok) {
          const raw = await readResponseText(o, true); // VK API is UTF-8
          const j = JSON.parse(raw);
          const image = j.thumbnail_url || j.photo_url || "";
          const videos = [];
          if (j.type === "video") {
            const vId = normalized.match(/video(-?\d+)_(\d+)/);
            if (vId) videos.push(`https://vk.com/video${vId[1]}_${vId[2]}`);
          }
          return new Response(JSON.stringify({
            title: decodeHtmlEntities(j.title || ""),
            description: safeTextFromHtml(j.description || ""),
            image, images: image ? [image] : [], videos, source: "vk"
          }), { headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } });
        }
      } catch (e) { console.error("VK Fail", e); }
    }

    // 2. Standard fetch
    const res = await fetch(normalized, { headers: { "User-Agent": userAgent } });
    const html = await readResponseText(res, isSocial);

    const getMeta = (p: string) => {
      const re = new RegExp(`<meta[^>]+(?:name|property)=["']${p}["'][^>]*content=["']([^"']+)["']`, "i");
      const match = html.match(re) || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*?(?:name|property)=["']${p}["']`, "i"));
      return match ? decodeHtmlEntities(match[1]) : "";
    };

    let title = getMeta("og:title") || getMeta("twitter:title") || "";
    let description = getMeta("og:description") || getMeta("description") || "";
    let image = getMeta("og:image") || getMeta("twitter:image") || "";
    let content = "";

    if (host.includes("t.me")) {
      const m = html.match(/<div[^>]*class="[^"]*tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      if (m) content = safeTextFromHtml(m[1]);
      if (content.length > description.length) description = content;
    }

    const imgs = new Set([image].filter(Boolean));
    const vids = new Set();
    const imgMatches = html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
    for (const m of imgMatches) {
      if (m[1] && /\.(jpg|jpeg|png|webp)/i.test(m[1])) {
        try { imgs.add(new URL(m[1], normalized).toString()); } catch { }
      }
    }

    return new Response(JSON.stringify({
      title, description: safeTextFromHtml(description), content,
      image: Array.from(imgs)[0] || "",
      images: Array.from(imgs),
      videos: Array.from(vids)
    }), { headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
