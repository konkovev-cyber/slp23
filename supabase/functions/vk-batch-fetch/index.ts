import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const VK_SERVICE_KEY = Deno.env.get("VK_ACCESS_TOKEN") || "bc15f23abc15f23abc15f23a7dbf2b05adbbc15bc15f23ad58326cf040249df893a4523";
const VK_VERSION = "5.199"; // Updated to recent version, or "5.131"
// Actually, using 5.131 as it's safe

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

        let normalizedUrl = url.trim();
        let queryParam = "";

        // Try to parse domain or owner_id
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
            if (!normalizedUrl.includes("/") && !normalizedUrl.includes(".")) {
                queryParam = `domain=${normalizedUrl}`;
            } else {
                throw new Error("Неверная ссылка на сообщество VK");
            }
        }

        const apiUrl = `https://api.vk.com/method/wall.get?${queryParam}&count=${count}&offset=${offset}&extended=1&v=${VK_VERSION}`;

        const response = await fetch(apiUrl, {
            headers: {
                "Authorization": `ServiceKey ${VK_SERVICE_KEY}`,
            },
        });

        if (!response.ok) {
            throw new Error(`VK API error: ${response.status}`);
        }

        const data = await response.json();
        if (data.error) {
            throw new Error(`VK API error: ${data.error.error_msg}`);
        }

        const posts = data.response?.items || [];

        const parsedPosts = posts.map((post: any) => {
            const content = post.text ? stripHtml(decodeHtml(post.text)) : "";

            let title = "Новости VK";
            if (content) {
                const lines = content.split('\n').filter((l: string) => l.trim().length > 0);
                if (lines && lines.length > 0) {
                    title = lines[0].slice(0, 100).trim();
                }
            }

            const mediaList: Array<{ url: string; type: "image" | "video" }> = [];
            let coverImage = "";

            if (post.attachments) {
                for (const attachment of post.attachments) {
                    if (attachment.type === "photo" && attachment.photo) {
                        const imageUrl = attachment.photo.sizes?.find((s: any) => s.type === "z" || s.type === "y" || s.type === "x")?.url
                            || attachment.photo.sizes?.[attachment.photo.sizes.length - 1]?.url
                            || attachment.photo.photo_604
                            || attachment.photo.photo_807
                            || attachment.photo.photo_1280;
                        if (imageUrl && !mediaList.find(m => m.url === imageUrl)) {
                            mediaList.push({ url: imageUrl, type: "image" });
                            if (!coverImage) coverImage = imageUrl;
                        }
                    }

                    if (attachment.type === "video" && attachment.video) {
                        const videoUrl = attachment.video.player
                            || attachment.video.src
                            || `https://vk.com/video${attachment.video.owner_id}_${attachment.video.id}`;
                        if (videoUrl && !mediaList.find(m => m.url === videoUrl)) {
                            mediaList.push({ url: videoUrl, type: "video" });
                        }
                    }
                }
            }

            // published_at date from vk timestamp (unix format)
            const published_at = post.date ? new Date(post.date * 1000).toISOString() : new Date().toISOString();

            return {
                source_id: String(post.id),
                published_at,
                title,
                excerpt: content.slice(0, 160) + (content.length > 160 ? "..." : ""),
                content,
                image_url: coverImage || null,
                mediaList: mediaList.slice(0, 20),
                source: "vk"
            };
        });

        return new Response(
            JSON.stringify({
                totalCount: data.response?.count || 0,
                items: parsedPosts
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } }
        );
    } catch (e) {
        console.error("ERROR:", e);
        return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
    }
});
