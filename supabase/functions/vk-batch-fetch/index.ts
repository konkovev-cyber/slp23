import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    try {
        const { url, count = 10, offset = 0 } = await req.json();
        if (!url) throw new Error("URL is required");

        console.log(`[VK Import] Processing URL: ${url}`);

        let normalizedUrl = url.trim();
        let queryParam = "";

        const wallMatch = normalizedUrl.match(/vk\.com\/wall(-?\d+)/);
        const domainMatch = normalizedUrl.match(/vk\.com\/([a-zA-Z0-9_\.]+)/);

        if (wallMatch) {
            queryParam = `owner_id=${wallMatch[1]}`;
        } else if (domainMatch) {
            const domain = domainMatch[1];
            if (domain.startsWith("public")) {
                queryParam = `owner_id=-${domain.replace("public", "")}`;
            } else if (domain.startsWith("club")) {
                queryParam = `owner_id=-${domain.replace("club", "")}`;
            } else {
                queryParam = `domain=${domain}`;
            }
        } else {
            queryParam = `domain=slp23`;
        }

        // Используем api.vk.ru согласно новой документации
        const apiUrl = `https://api.vk.ru/method/wall.get?${queryParam}&count=${count}&offset=${offset}&extended=1&v=${VK_VERSION}&access_token=${VK_SERVICE_KEY}`;

        console.log(`[VK Import] Fetching from VK API: wall.get for ${queryParam}`);
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`VK API request failed with status ${response.status}`);
        }

        const data = await response.json();
        if (data.error) {
            console.error(`[VK Import] VK API Error:`, data.error);
            throw new Error(`VK API Error: ${data.error.error_msg} (code: ${data.error.error_code})`);
        }

        const posts = data.response?.items || [];
        console.log(`[VK Import] Found ${posts.length} posts`);

        const parsedPosts = posts.map((post: any) => {
            const contentText = post.text ? stripHtml(decodeHtml(post.text)) : "";
            const sourceUrl = `https://vk.com/wall${post.owner_id}_${post.id}`;

            // Добавляем ссылку на источник в текст
            const content = contentText + `\n\nИсточник: ${sourceUrl}`;

            let title = "Новости VK";
            if (contentText) {
                const lines = contentText.split('\n').filter((l: string) => l.trim().length > 0);
                if (lines.length > 0) {
                    title = lines[0].slice(0, 100).trim();
                }
            }

            const mediaList: Array<{ url: string; type: "image" | "video" }> = [];
            let coverImage = "";

            if (post.attachments) {
                for (const attachment of post.attachments) {
                    // Обработка ФОТО
                    if (attachment.type === "photo" && attachment.photo) {
                        const imageUrl = attachment.photo.sizes?.find((s: any) => s.type === "w" || s.type === "z" || s.type === "y")?.url
                            || attachment.photo.sizes?.[attachment.photo.sizes.length - 1]?.url
                            || attachment.photo.photo_1280
                            || attachment.photo.photo_807;
                        if (imageUrl) {
                            mediaList.push({ url: imageUrl, type: "image" });
                            if (!coverImage) coverImage = imageUrl;
                        }
                    }

                    // Обработка ВИДЕО
                    if (attachment.type === "video" && attachment.video) {
                        const videoLink = `https://vk.com/video${attachment.video.owner_id}_${attachment.video.id}`;
                        const videoThumb = attachment.video.image?.find((s: any) => s.width >= 1280 || s.width >= 800)?.url
                            || attachment.video.image?.[attachment.video.image.length - 1]?.url;

                        mediaList.push({ url: videoLink, type: "video" });
                        // Если нет обложки от фото, используем обложку видео
                        if (!coverImage && videoThumb) coverImage = videoThumb;
                    }
                }
            }

            return {
                source_id: String(post.id),
                published_at: post.date ? new Date(post.date * 1000).toISOString() : new Date().toISOString(),
                title,
                excerpt: contentText.slice(0, 160) + (contentText.length > 160 ? "..." : ""),
                content,
                image_url: coverImage || null,
                mediaList: mediaList.slice(0, 20),
                source: "vk",
                source_url: sourceUrl
            };
        });

        return new Response(
            JSON.stringify({ totalCount: data.response?.count || 0, items: parsedPosts }),
            { headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } }
        );
    } catch (e) {
        console.error(`[VK Import] Runtime Error:`, e.message);
        return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: corsHeaders });
    }
});
