import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function safeTextFromHtml(html: string) {
  // Strip tags + decode common entities (enough for Telegram/VK snippets)
  const noTags = html
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return decodeHtmlEntities(noTags);
}

function decodeHtmlEntities(str: string) {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/(&#(\d+);)/g, (_m, _c, code) => String.fromCharCode(Number(code)));
}

async function readResponseText(res: Response) {
  const buf = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") ?? "";
  const charsetMatch = contentType.match(/charset=([^;]+)/i);
  const charset = charsetMatch?.[1]?.trim().toLowerCase();

  const tryDecode = (enc: string) => new TextDecoder(enc).decode(buf);

  // Best-effort: honor declared charset, otherwise fall back and detect replacement chars.
  if (charset && charset !== "utf-8" && charset !== "utf8") {
    try {
      return tryDecode(charset);
    } catch {
      // fall through
    }
  }

  let text = tryDecode("utf-8");
  if ((text.match(/\uFFFD|�/g)?.length ?? 0) > 5) {
    try {
      text = tryDecode("windows-1251");
    } catch {
      // ignore
    }
  }
  return text;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { url } = await req.json();
        if (!url) {
            return new Response(JSON.stringify({ error: "URL is required" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        console.log(`Fetching metadata for: ${url}`);

        const normalized = url.trim();
        const parsed = new URL(normalized);
        const host = parsed.hostname.replace(/^www\./, "");

        // VK: try oEmbed first (no auth required)
        if (host === "vk.com" || host === "m.vk.com") {
          try {
            const oembedUrl = `https://vk.com/oembed?url=${encodeURIComponent(normalized)}`;
            const o = await fetch(oembedUrl, {
              headers: {
                "User-Agent": "Mozilla/5.0",
                "Accept": "application/json",
              },
            });
            if (o.ok) {
              // VK sometimes replies in cp1251; decode defensively.
              const buf = await o.arrayBuffer();
              const tryDecode = (enc: string) => new TextDecoder(enc).decode(buf);
              let raw = tryDecode("utf-8");
              if ((raw.match(/\uFFFD|�/g)?.length ?? 0) > 5) {
                raw = tryDecode("windows-1251");
              }
              const j = JSON.parse(raw);

              const title = decodeHtmlEntities(String(j?.title ?? ""));
              const image = String(j?.thumbnail_url ?? "");
              // Best-effort: derive post id from URL like wall-226860244_191
              const wallMatch = normalized.match(/wall(-?\d+)_([0-9]+)/);
              const source_id = wallMatch ? `wall${wallMatch[1]}_${wallMatch[2]}` : null;

              // If title looks garbled, fallback to HTML parsing below.
              if (title && (title.includes("�") || title.includes("\uFFFD"))) {
                throw new Error("VK oEmbed title encoding looks invalid");
              }

              return new Response(
                JSON.stringify({
                  title,
                  description: "",
                  content: "",
                  image,
                  source: "vk",
                  source_id,
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } },
              );
            }
          } catch (e) {
            console.warn("VK oEmbed failed, fallback to HTML parsing", e);
          }
        }

        const res = await fetch(normalized, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
          },
        });

        if (!res.ok) {
            return new Response(JSON.stringify({ error: `Failed to fetch URL: ${res.status} ${res.statusText}` }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const html = await readResponseText(res);

        // More robust regex helper
        const getMeta = (prop: string) => {
            // Try property="..." then content="..."
            let re = new RegExp(`<meta[^>]+(?:name|property)=["']${prop}["'][^>]*content=["']([^"']+)["']`, "i");
            let match = html.match(re);
            if (match) return match[1];

            // Try content="..." then property="..."
            re = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*?(?:name|property)=["']${prop}["']`, "i");
            match = html.match(re);
            if (match) return match[1];

            return null;
        };

        let title = getMeta("og:title") || getMeta("twitter:title") || "";
        let description = getMeta("og:description") || getMeta("description") || getMeta("twitter:description") || "";
        let image = getMeta("og:image") || getMeta("twitter:image") || "";

        // Telegram: try to extract full post text
        let content = "";
        if (host === "t.me" || host === "telegram.me") {
          // Telegram markup variants: tgme_widget_message_text, js-message_text
          const candidates = [
            /<div[^>]*class="[^"]*tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
            /<div[^>]*class="[^"]*js-message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
          ];
          for (const re of candidates) {
            const m = html.match(re);
            if (m?.[1]) {
              content = safeTextFromHtml(m[1]);
              break;
            }
          }
          // If og:description is short/truncated, replace with full content
          if (content && content.length > (description?.length ?? 0)) {
            description = content;
          }
        }

        // Clean up
        if (title) title = decodeHtmlEntities(title);
        if (description) description = decodeHtmlEntities(description);

        console.log({ title, description, image, content_len: content.length });

        return new Response(JSON.stringify({ title, description, content, image }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (err) {
        console.error("Error in fetch-metadata:", err);
        const message = err instanceof Error ? err.message : String(err);
        return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
