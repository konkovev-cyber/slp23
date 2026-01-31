import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Decode HTML entities
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

// Strip HTML tags
function stripHtml(html: string): string {
    return html
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<[^>]*>/g, "")
        .trim();
}

// Decode response body strictly as UTF-8.
// Раньше здесь была эвристика с windows-1251, из-за которой UTF-8 текст
// из Telegram/VK иногда превращался в "кракозябры". По требованию теперь
// всегда жёстко используем UTF-8.
async function getTextWithEncoding(res: Response, _url: string): Promise<string> {
    const buffer = await res.arrayBuffer();
    const utf8Text = new TextDecoder("utf-8").decode(buffer);

    // If text contains replacement characters, it's likely not UTF-8
    if (utf8Text.includes("") || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(utf8Text)) {
        try {
            return new TextDecoder("windows-1251").decode(buffer);
        } catch {
            return utf8Text;
        }
    }
    return utf8Text;
}

// Extract metadata from HTML
function extractMetadata(html: string, url: string) {
    const getMeta = (property: string): string => {
        // Try og:property or name="property"
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

    const getTitle = (): string => {
        return getMeta("og:title") ||
            getMeta("twitter:title") ||
            (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "").trim();
    };

    const getDescription = (): string => {
        return getMeta("og:description") ||
            getMeta("twitter:description") ||
            getMeta("description") || "";
    };

    const getImage = (): string => {
        return getMeta("og:image") ||
            getMeta("twitter:image") || "";
    };

    return {
        title: decodeHtml(getTitle()),
        description: decodeHtml(getDescription()),
        image: getImage(),
    };
}

// Extract content from Telegram
function extractTelegramContent(html: string) {
    const textMatch = html.match(/<div[^>]*class="[^"]*tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    const content = textMatch ? stripHtml(decodeHtml(textMatch[1])) : "";

    // Extract all images from Telegram post
    const images: string[] = [];
    const imgMatches = html.matchAll(/<a[^>]+class="[^"]*tgme_widget_message_photo_wrap[^"]*"[^>]*style="[^"]*background-image:url\(['"]?([^'"]+)['"]?\)/gi);
    for (const match of imgMatches) {
        if (match[1]) images.push(match[1]);
    }

    // Also try regular img tags
    const imgTags = html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
    for (const match of imgTags) {
        if (match[1].startsWith("http") && !images.includes(match[1])) {
            images.push(match[1]);
        }
    }

    return { content, images };
}

// Extract content from VK
function extractVkContent(html: string) {
    const textMatch = html.match(/<div[^>]*class="[^"]*wall_post_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    const content = textMatch ? stripHtml(decodeHtml(textMatch[1])) : "";

    // Extract images from VK
    const images: string[] = [];
    const imgMatches = html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*class="[^"]*wall_photo[^"]*"/gi);
    for (const match of imgMatches) {
        if (match[1] && !images.includes(match[1])) {
            images.push(match[1]);
        }
    }

    return { content, images };
}

// Extract all images from HTML
function extractAllImages(html: string, baseUrl: string): string[] {
    const images = new Set<string>();
    const imgMatches = html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);

    for (const match of imgMatches) {
        let imgUrl = match[1];

        // Skip data URLs, icons, and tracking pixels
        if (imgUrl.startsWith("data:") ||
            imgUrl.includes("icon") ||
            imgUrl.includes("logo") ||
            imgUrl.includes("pixel") ||
            imgUrl.includes("1x1")) {
            continue;
        }

        // Convert relative URLs to absolute
        if (imgUrl.startsWith("/")) {
            try {
                imgUrl = new URL(imgUrl, baseUrl).toString();
            } catch {
                continue;
            }
        }

        if (imgUrl.startsWith("http")) {
            images.add(imgUrl);
        }
    }

    return Array.from(images);
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { url } = await req.json();
        const normalizedUrl = url.trim();

        // Fetch the page
        const res = await fetch(normalizedUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
            },
        });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const html = await getTextWithEncoding(res, normalizedUrl);

        // Extract basic metadata
        const metadata = extractMetadata(html, normalizedUrl);
        let content = metadata.description;
        let mediaList: string[] = [];

        // Platform-specific extraction
        if (normalizedUrl.includes("t.me")) {
            const telegram = extractTelegramContent(html);
            content = telegram.content || content;
            mediaList = telegram.images;
        } else if (normalizedUrl.includes("vk.com")) {
            const vk = extractVkContent(html);
            content = vk.content || content;
            mediaList = vk.images;
        }

        // If no platform-specific images found, extract all images
        if (mediaList.length === 0) {
            mediaList = extractAllImages(html, normalizedUrl);
        }

        // Add og:image to the list if not already there
        if (metadata.image && !mediaList.includes(metadata.image)) {
            mediaList.unshift(metadata.image);
        }

        // Limit to 20 images
        mediaList = mediaList.slice(0, 20);

        return new Response(
            JSON.stringify({
                title: metadata.title,
                description: metadata.description,
                content: content,
                image: mediaList[0] || "",
                mediaList: mediaList,
                source: normalizedUrl.includes("t.me") ? "telegram" :
                    normalizedUrl.includes("vk.com") ? "vk" : "web",
            }),
            {
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json; charset=utf-8",
                },
            }
        );
    } catch (e) {
        console.error("Fetch metadata error:", e);
        return new Response(
            JSON.stringify({
                error: e instanceof Error ? e.message : String(e),
                details: "Не удалось загрузить данные с указанного URL. Проверьте доступность ссылки.",
            }),
            {
                status: 500,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json; charset=utf-8",
                },
            }
        );
    }
});
