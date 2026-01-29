import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function safeTextFromHtml(html: string) {
  if (!html) return "";

  // First, normalize encoded line breaks that might turn into literal <br> after decoding
  let processed = html
    .replace(/&lt;br\s*\/?\s*&gt;/gi, "\n")
    .replace(/<br\s*\/?\s*>/gi, "\n");

  // Strip all other tags
  processed = processed.replace(/<[^>]*>/g, " ");

  // Decode entities
  processed = decodeHtmlEntities(processed);

  // Collapse whitespace but keep single newlines
  return processed
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join("\n")
    .trim();
}

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
  if ((text.match(/\uFFFD|/g)?.length ?? 0) > 5) {
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

    // Use a more modern user agent to avoid "outdated browser" blocks
    const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

    // VK: try oEmbed first (no auth required)
    if (host === "vk.com" || host === "m.vk.com") {
      try {
        // Try both standard and php endpoints
        const oembedUrls = [
          `https://vk.com/oembed?url=${encodeURIComponent(normalized)}&format=json`,
          `https://vk.com/js/api/oembed.php?url=${encodeURIComponent(normalized)}`
        ];

        for (const oembedUrl of oembedUrls) {
          console.log(`Trying VK oEmbed: ${oembedUrl}`);
          const o = await fetch(oembedUrl, {
            headers: {
              "User-Agent": userAgent,
              "Accept": "application/json",
            },
          });

          if (o.ok) {
            const buf = await o.arrayBuffer();
            const tryDecode = (enc: string) => new TextDecoder(enc).decode(buf);
            let raw = tryDecode("utf-8");
            if ((raw.match(/\uFFFD|/g)?.length ?? 0) > 5) {
              raw = tryDecode("windows-1251");
            }
            const j = JSON.parse(raw);

            const title = decodeHtmlEntities(String(j?.title ?? ""));
            let image = String(j?.thumbnail_url || j?.photo_url || "");
            let description = String(j?.description || "");

            // If oEmbed returns a specific snippet for video, try to find a link
            if (j?.type === "video" || normalized.includes("video")) {
              const videoId = normalized.match(/video(-?\d+)_(\d+)/);
              if (videoId && !description.includes("vk.com/video")) {
                description += `\n\nВидео: https://vk.com/video${videoId[1]}_${videoId[2]}`;
              }
            }

            if (title || image || description) {
              const wallMatch = normalized.match(/wall(-?\d+)_([0-9]+)/);
              const source_id = wallMatch ? `wall${wallMatch[1]}_${wallMatch[2]}` : null;

              return new Response(
                JSON.stringify({
                  title: title || "Пост ВКонтакте",
                  description: description,
                  content: "",
                  image,
                  source: "vk",
                  source_id,
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } },
              );
            }
          }
        }
      } catch (e) {
        console.warn("VK oEmbed failed", e);
      }
    }

    const res = await fetch(normalized, {
      headers: {
        "User-Agent": userAgent,
      },
    });

    if (!res.ok) {
      // Second try with bot user agent if blocked
      const botRes = await fetch(normalized, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        },
      });

      if (!botRes.ok) {
        return new Response(JSON.stringify({ error: `Fetch failed: ${res.status}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Use botRes instead
      const html = await readResponseText(botRes);
      return processHtml(html, normalized, botRes.url);
    }

    const html = await readResponseText(res);
    return processHtml(html, normalized, res.url);

  } catch (err) {
    console.error("Error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  function processHtml(html: string, normalized: string, finalUrl: string) {
    // Helper to absolute-ify URLs
    const resolveUrl = (rel: string, base: string) => {
      try {
        return new URL(rel, base).toString();
      } catch {
        return rel;
      }
    };

    // More robust regex helper
    const getMeta = (prop: string) => {
      // Try property="..." then content="..."
      const re = new RegExp(`<meta[^>]+(?:name|property)=["']${prop}["'][^>]*content=["']([^"']+)["']`, "i");
      let match = html.match(re);
      if (match) return match[1];

      // Try content="..." then property="..."
      const reRev = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*?(?:name|property)=["']${prop}["']`, "i");
      const matchRev = html.match(reRev);
      if (matchRev) return matchRev[1];

      return null;
    };

    let title = getMeta("og:title") || getMeta("twitter:title") || "";
    let description = getMeta("og:description") || getMeta("description") || getMeta("twitter:description") || "";
    let image = getMeta("og:image") || getMeta("twitter:image") || "";
    const video = getMeta("og:video") || getMeta("og:video:url") || "";

    // Resolve image URL
    if (image) {
      image = resolveUrl(image, finalUrl);
    }

    const parsed = new URL(normalized);
    const host = parsed.hostname.replace(/^www\./, "");

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

    // Add video link if found
    if (video && !description.includes(video)) {
      description += `\n\nВидео: ${video}`;
    }

    // Clean up
    title = decodeHtmlEntities(title);
    description = safeTextFromHtml(description); // Final cleaning

    return new Response(JSON.stringify({ title, description, content: "", image }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
