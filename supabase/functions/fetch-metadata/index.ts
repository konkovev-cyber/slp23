import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
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

        const res = await fetch(url, {
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

        const html = await res.text();

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

        const decodeHtmlCharCodes = (str: string) => {
            return str.replace(/(&#(\d+);)/g, (match, capture, charCode) =>
                String.fromCharCode(charCode));
        }

        let title = getMeta("og:title") || getMeta("twitter:title") || "";
        let description = getMeta("og:description") || getMeta("description") || getMeta("twitter:description") || "";
        let image = getMeta("og:image") || getMeta("twitter:image") || "";

        // Clean up
        if (title) title = decodeHtmlCharCodes(title);
        if (description) description = decodeHtmlCharCodes(description);

        console.log({ title, description, image });

        return new Response(JSON.stringify({ title, description, image }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (err) {
        console.error("Error in fetch-metadata:", err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
