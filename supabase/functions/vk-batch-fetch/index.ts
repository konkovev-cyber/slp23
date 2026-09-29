import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// VK Service Key
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

type MediaEntry = { url: string; type: "image" | "video" | "document" };

function parseAttachments(
    attachments: any[],
    mediaList: MediaEntry[],
    linkLines: string[]
): string | null {
    const forceHttps = (u: string) => u ? u.replace(/^http:\/\//i, 'https://') : "";
    let firstVideoThumb: string | null = null;

    for (const attachment of attachments) {
        if (attachment.type === "photo" && attachment.photo) {
            const imageUrl = attachment.photo.sizes?.find((s: any) => s.type === "w" || s.type === "z" || s.type === "y" || s.type === "x")?.url
                || attachment.photo.sizes?.[attachment.photo.sizes.length - 1]?.url
                || attachment.photo.photo_1280;
            if (imageUrl) {
                const httpsUrl = forceHttps(imageUrl);
                if (!mediaList.some(m => m.url === httpsUrl)) {
                    mediaList.push({ url: httpsUrl, type: "image" });
                }
            }
        }

        if (attachment.type === "video" && attachment.video) {
            const videoLink = `https://vk.com/video${attachment.video.owner_id}_${attachment.video.id}`;
            const videoThumb = attachment.video.image?.find((s: any) => s.width >= 1280 || s.width >= 800)?.url
                || attachment.video.image?.[attachment.video.image.length - 1]?.url
                || "";
            if (!mediaList.some(m => m.url === videoLink)) {
                mediaList.push({ url: videoLink, type: "video" });
            }
            if (!firstVideoThumb && videoThumb) firstVideoThumb = forceHttps(videoThumb);
        }

        if (attachment.type === "doc" && attachment.doc) {
            const docUrl = forceHttps(attachment.doc.url || "");
            if (docUrl && !mediaList.some(m => m.url === docUrl)) {
                mediaList.push({ url: docUrl, type: "document" });
                linkLines.push(`📄 Файл: ${attachment.doc.title || "документ"} — ${docUrl}`);
            }
        }

        if (attachment.type === "audio" && attachment.audio) {
            const audioUrl = forceHttps(attachment.audio.url || "");
            if (audioUrl && !mediaList.some(m => m.url === audioUrl)) {
                mediaList.push({ url: audioUrl, type: "document" });
                linkLines.push(`🎵 Аудио: ${attachment.audio.artist || ""} — ${attachment.audio.title || ""} — ${audioUrl}`);
            }
        }

        if (attachment.type === "link" && attachment.link) {
            const linkUrl = forceHttps(attachment.link.url || "");
            if (linkUrl) {
                linkLines.push(`🔗 ${attachment.link.title || linkUrl} — ${linkUrl}`);
            }
        }
    }

    return firstVideoThumb;
}

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    try {
        const body = await req.json();
        const { url, count = 10, offset = 0 } = body;

        if (!url) throw new Error("URL is required");

        console.log(`[VK Import] Processing URL: ${url}`);

        let normalizedUrl = url.trim();
        let queryParams = new URLSearchParams();
        queryParams.set("count", String(count));
        queryParams.set("offset", String(offset));
        queryParams.set("extended", "1");
        queryParams.set("v", VK_VERSION);
        queryParams.set("access_token", VK_SERVICE_KEY);

        const wallMatch = normalizedUrl.match(/vk\.(?:com|ru)\/wall(-?\d+)/i);
        const domainMatch = normalizedUrl.match(/vk\.(?:com|ru)\/([a-zA-Z0-9_.]+)/i);

        if (wallMatch) {
            queryParams.set("owner_id", wallMatch[1]);
        } else if (domainMatch) {
            const domain = domainMatch[1];
            if (domain.startsWith("public")) {
                queryParams.set("owner_id", "-" + domain.replace("public", ""));
            } else if (domain.startsWith("club")) {
                queryParams.set("owner_id", "-" + domain.replace("club", ""));
            } else {
                queryParams.set("domain", domain);
            }
        } else {
            queryParams.set("domain", "lichnostplus");
        }

        // Вернулся на api.vk.com для надежности
        const apiUrl = `https://api.vk.com/method/wall.get?${queryParams.toString()}`;

        console.log(`[VK Import] Fetching from VK API: ${apiUrl.replace(VK_SERVICE_KEY, "HIDDEN")}`);
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
            let content = contentText + `\n\nИсточник: ${sourceUrl}`;

            let title = "Новости VK";
            if (contentText) {
                const lines = contentText.split('\n').filter((l: string) => l.trim().length > 0);
                if (lines.length > 0) {
                    title = lines[0].slice(0, 100).trim();
                }
            }

            const mediaList: MediaEntry[] = [];
            const linkLines: string[] = [];
            let coverImage = "";

            if (post.attachments) {
                const thumb = parseAttachments(post.attachments, mediaList, linkLines);
                if (thumb) coverImage = coverImage || thumb;
            }

            if (post.copy_history && Array.isArray(post.copy_history)) {
                for (const rep of post.copy_history) {
                    if (rep.attachments) {
                        const thumb = parseAttachments(rep.attachments, mediaList, linkLines);
                        if (thumb) coverImage = coverImage || thumb;
                    }
                    if (rep.text) {
                        linkLines.push(stripHtml(decodeHtml(rep.text)));
                    }
                }
            }

            if (linkLines.length > 0) {
                content = (content + "\n\n" + linkLines.join("\n")).trim();
            }

            const cover = mediaList.find(m => m.type === "image")?.url || coverImage || "";

            return {
                source_id: String(post.id),
                published_at: post.date ? new Date(post.date * 1000).toISOString() : new Date().toISOString(),
                title,
                excerpt: contentText.slice(0, 160) + (contentText.length > 160 ? "..." : ""),
                content,
                image_url: cover || null,
                mediaList: mediaList.slice(0, 30),
                source: "vk",
                source_url: sourceUrl
            };
        });

        return new Response(
            JSON.stringify({ totalCount: data.response?.count || 0, items: parsedPosts }),
            { headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } }
        );
    } catch (e: any) {
        console.error(`[VK Import] Runtime Error:`, e.message);
        return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: corsHeaders });
    }
});
