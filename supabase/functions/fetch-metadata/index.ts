import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function decodeHtml(str: string) {
    if (!str) return "";
    return str
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
        .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c)))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, c) => String.fromCharCode(parseInt(c, 16)));
}

async function getSafeText(res: Response, isSocial: boolean) {
    const buffer = await res.arrayBuffer();
    const decoderUTF8 = new TextDecoder("utf-8");
    const text = decoderUTF8.decode(buffer);

    if (isSocial) return text; // Telegram/VK always UTF-8

    // Fallback for old sites
    if (text.includes("") || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(text)) {
        try {
            return new TextDecoder("windows-1251").decode(buffer);
        } catch { return text; }
    }
    return text;
}

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    try {
        const { url } = await req.json();
        const normalized = url.trim();
        const isSocial = normalized.includes("t.me") || normalized.includes("vk.com");

        const res = await fetch(normalized, { headers: { "User-Agent": "Mozilla/5.0" } });
        const html = await getSafeText(res, isSocial);

        const getMeta = (p: string) => {
            const match = html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${p}["'][^>]*content=["']([^"']+)["']`, "i"))
                || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*?(?:name|property)=["']${p}["']`, "i"));
            return match ? decodeHtml(match[1]) : "";
        };

        let title = getMeta("og:title") || getMeta("twitter:title") || "";
        let description = getMeta("og:description") || getMeta("description") || "";
        let image = getMeta("og:image") || "";
        let content = "";

        // Telegram specific
        if (normalized.includes("t.me")) {
            const m = html.match(/<div[^>]*class="[^"]*tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
            if (m) content = decodeHtml(m[1].replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, ""));
            if (content) description = content;
        }

        // Media gathering
        const images = new Set([image].filter(Boolean));
        const imgMatches = html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
        for (const m of imgMatches) {
            if (m[1].startsWith("http")) images.add(m[1]);
            else if (m[1].startsWith("/")) images.add(new URL(m[1], normalized).toString());
        }

        return new Response(JSON.stringify({
            title: decodeHtml(title),
            description: decodeHtml(description),
            image: Array.from(images)[0] || "",
            mediaList: Array.from(images).slice(0, 10) // Список всех найденных фото
        }), { headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } });

    } catch (e) {
        return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
    }
});
