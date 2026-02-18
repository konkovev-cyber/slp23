# 🚀 Инструкция по обновлению fetch-metadata с VK API

## Шаг 1: Добавьте секрет в Supabase

1. Откройте: https://supabase.com/dashboard/project/qwuicyhadpesklhkjxpn/settings/functions
2. Раздел **"Secrets"**
3. Нажмите **"Add new secret"**
4. **Name:** `VK_ACCESS_TOKEN`
5. **Value:** `91d8f93791d8f93791d8f937de92e60fb2991d891d8f937f84ec2edfc5a35e50a11b1ce`
6. Нажмите **Save**

## Шаг 2: Обновите код функции

1. Откройте файл: `d:\1_sites\slp23\supabase\functions\fetch-metadata\index.ts`
2. **Полностью замените** содержимое на код ниже
3. Сохраните
4. В Supabase Dashboard → Edge Functions → `fetch-metadata` вставьте новый код
5. Нажмите **Deploy**

## Шаг 3: Тестирование

```bash
# VK пост
curl -X POST https://qwuicyhadpesklhkjxpn.supabase.co/functions/v1/fetch-metadata \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"https://vk.com/wall-226860244_205\"}"

# Telegram
curl -X POST https://qwuicyhadpesklhkjxpn.supabase.co/functions/v1/fetch-metadata \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"https://t.me/slp23/1619\"}"

# YouTube
curl -X POST https://qwuicyhadpesklhkjxpn.supabase.co/functions/v1/fetch-metadata \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"https://www.youtube.com/watch?v=dQw4w9WgXcQ\"}"
```

---

## 📄 Полный код функции (скопируйте и вставьте)

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GARBAGE_PATTERNS = [
  /emoji/i, /icon/i, /favicon/i, /avatar/i, /logo/i, /pixel/i, /ads/i, /banner/i,
  /loading/i, /spinner/i, /marker/i, /sprite/i, /placeholder/i
];

const GENERIC_TITLES = [
  /telegram\s*widget/i, /telegram\s*:\s*contact/i, /vkontakte/i, /вконтакте/i, /wall\s*post/i, /запись\s*на\s*стене/i
];

const VIDEO_PATTERNS = [
  /youtube\.com\/watch/i, /youtu\.be\//i, /vimeo\.com\//i,
  /vk\.com\/video/i, /vk\.com\/clip/i,
  /t\.me\/[^\/]+\/\d+\?video=1/i, /mp4$/i, /webm$/i
];

function isGarbageImage(url: string): boolean {
  return GARBAGE_PATTERNS.some(pattern => pattern.test(url));
}

function detectType(url: string): "image" | "video" {
  if (VIDEO_PATTERNS.some(pattern => pattern.test(url))) return "video";
  return "image";
}

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

async function getTextWithEncoding(res: Response): Promise<string> {
  const contentEncoding = res.headers.get("content-encoding") || "";
  const contentType = res.headers.get("content-type") || "";
  
  const text = await res.text();
  
  console.log("DEBUG: Content-Type:", contentType);
  console.log("DEBUG: Content-Encoding:", contentEncoding);
  console.log("DEBUG: Text length:", text.length);
  
  return text;
}

function extractMetadata(html: string) {
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

  const title = decodeHtml(getMeta("og:title") || (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "").trim());
  const isGeneric = GENERIC_TITLES.some(p => p.test(title));

  return {
    title: isGeneric ? "" : title,
    description: decodeHtml(getMeta("og:description") || getMeta("description") || ""),
    image: getMeta("og:image") || getMeta("twitter:image") || "",
  };
}

function extractMedia(html: string) {
  const urls: string[] = [];

  const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1];
  if (ogImage) urls.push(ogImage);

  const bgMatches = html.matchAll(/background-image:url\(['"]?([^'"]+)['"]?\)/gi);
  for (const match of bgMatches) {
    if (match[1] && !urls.includes(match[1])) urls.push(match[1]);
  }

  const imgTags = html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
  for (const match of imgTags) {
    if (match[1].startsWith("http") && !urls.includes(match[1])) urls.push(match[1]);
  }

  const videoLinks = html.matchAll(/href=["'](https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|vimeo\.com|vk\.com\/video)[^"']+)["']/gi);
  for (const match of videoLinks) {
    if (match[1] && !urls.includes(match[1])) urls.push(match[1]);
  }

  const dataSrcMatches = html.matchAll(/data-src=["']([^"']+)["']/gi);
  for (const match of dataSrcMatches) {
    if (match[1] && match[1].startsWith("http") && !urls.includes(match[1])) urls.push(match[1]);
  }

  const srcsetMatches = html.matchAll(/srcset=["']([^"']+)["']/gi);
  for (const match of srcsetMatches) {
    const urlsFromSrcset = match[1].split(",").map(u => u.trim().split(/\s+/)[0]);
    for (const u of urlsFromSrcset) {
      if (u && u.startsWith("http") && !urls.includes(u)) urls.push(u);
    }
  }

  const dataWebpMatches = html.matchAll(/data-webp=["']([^"']+)["']/gi);
  for (const match of dataWebpMatches) {
    if (match[1] && match[1].startsWith("http") && !urls.includes(match[1])) urls.push(match[1]);
  }

  const dataSrcsetMatches = html.matchAll(/data-srcset=["']([^"']+)["']/gi);
  for (const match of dataSrcsetMatches) {
    const urlsFromSrcset = match[1].split(",").map(u => u.trim().split(/\s+/)[0]);
    for (const u of urlsFromSrcset) {
      if (u && u.startsWith("http") && !urls.includes(u)) urls.push(u);
    }
  }

  const telegraMatches = html.matchAll(/https:\/\/telegra\.ph\/file\/[^\s"'<>]+/gi);
  for (const match of telegraMatches) {
    const url = match[0].replace(/["')]$/, "");
    if (url && !urls.includes(url)) urls.push(url);
  }

  return urls
    .filter(url => !isGarbageImage(url))
    .map(url => ({
      url,
      type: detectType(url)
    }));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url) throw new Error("URL is required");

    let normalizedUrl = url.trim();

    // ============================================================
    // VK API - используем официальный API для надёжности
    // ============================================================
    if (normalizedUrl.includes("vk.com")) {
      const vkToken = Deno.env.get("VK_ACCESS_TOKEN");
      
      if (vkToken) {
        try {
          let wallRequest = "";
          
          const wallMatch = normalizedUrl.match(/wall(-?\d+)_(\d+)/);
          const videoMatch = normalizedUrl.match(/video(-?\d+)_(\d+)/);
          const clipMatch = normalizedUrl.match(/clip(-?\d+)_(\d+)/);
          
          if (wallMatch) {
            wallRequest = `${wallMatch[1]}_${wallMatch[2]}`;
          } else if (videoMatch) {
            wallRequest = `${videoMatch[1]}_${videoMatch[2]}`;
          } else if (clipMatch) {
            wallRequest = `${clipMatch[1]}_${clipMatch[2]}`;
          }
          
          if (wallRequest) {
            const apiUrl = `https://api.vk.com/method/wall.getById?posts=${wallRequest}&extended=1&v=5.131&access_token=${vkToken}`;
            console.log("DEBUG: VK API call");
            
            const apiRes = await fetch(apiUrl);
            const apiData = await apiRes.json();
            
            if (apiData.response && apiData.response.items && apiData.response.items.length > 0) {
              const item = apiData.response.items[0];
              const content = item.text || "";
              let title = content.split("\n")[0]?.slice(0, 100) || "Новости";
              
              const mediaList: Array<{ url: string; type: "image" | "video" }> = [];
              
              if (item.attachments) {
                for (const att of item.attachments) {
                  if (att.type === "photo" && att.photo) {
                    const photoUrl = att.photo.sizes?.find((s: any) => s.type === "z")?.url || 
                                    att.photo.sizes?.find((s: any) => s.type === "max")?.url ||
                                    att.photo.sizes?.[0]?.url;
                    if (photoUrl) mediaList.push({ url: photoUrl, type: "image" });
                  }
                  if (att.type === "video" && att.video) {
                    const videoUrl = att.video.player || `https://vk.com/video${att.video.owner_id}_${att.video.id}`;
                    mediaList.push({ url: videoUrl, type: "video" });
                  }
                }
              }
              
              // Get cover image from OG
              const ogRes = await fetch(normalizedUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
              const ogHtml = await ogRes.text();
              const ogImageMatch = ogHtml.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
              const ogImage = ogImageMatch?.[1];
              
              if (ogImage && !mediaList.find(m => m.url === ogImage)) {
                mediaList.unshift({ url: ogImage, type: "image" });
              }
              
              return new Response(
                JSON.stringify({
                  title: title,
                  description: content.slice(0, 200) + (content.length > 200 ? "..." : ""),
                  content: content,
                  image: mediaList.find(m => m.type === "image")?.url || "",
                  mediaList: mediaList.slice(0, 15),
                  source: "vk",
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } }
              );
            }
          }
        } catch (e) {
          console.log("DEBUG: VK API error:", e);
        }
      }
    }

    // Telegram
    let fetchUrl = normalizedUrl;
    if (normalizedUrl.includes("t.me/")) {
      fetchUrl = normalizedUrl.replace("?single", "");
      if (!fetchUrl.includes("/s/") && !fetchUrl.includes("/embed/")) {
        const parts = fetchUrl.split("/");
        const channelOrPost = parts[parts.length - 1];
        if (/^\d+$/.test(channelOrPost)) {
          const channel = parts[parts.length - 2];
          fetchUrl = `https://t.me/${channel}/${channelOrPost}?embed=1`;
        } else {
          fetchUrl = `${fetchUrl}?embed=1`;
        }
      }
    }

    const res = await fetch(fetchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Cache-Control": "no-cache",
      },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await getTextWithEncoding(res);
    const metadata = extractMetadata(html);

    let content = "";
    if (normalizedUrl.includes("t.me")) {
      const telegramSelectors = [
        /<div[^>]*class="[^"]*tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class="[^"]*tgme_widget_message_bubble[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class="[^"]*message-text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      ];
      for (const selector of telegramSelectors) {
        const match = html.match(selector);
        if (match && match[1].trim().length > 20) {
          content = stripHtml(decodeHtml(match[1]));
          break;
        }
      }
    } else {
      content = metadata.description || "";
    }

    const mediaList = extractMedia(html);

    let finalTitle = metadata.title;
    if (!finalTitle && content) {
      const lines = content.split('\n').filter(l => l.trim().length > 0);
      if (lines.length > 0) {
        finalTitle = lines[0].slice(0, 100).trim();
      }
    }

    const mainImage = metadata.image;
    if (mainImage && !isGarbageImage(mainImage) && !mediaList.find(m => m.url === mainImage)) {
      mediaList.unshift({ url: mainImage, type: "image" });
    }

    return new Response(
      JSON.stringify({
        title: finalTitle || "Новости",
        description: metadata.description,
        content: content || metadata.description,
        image: mediaList.find(m => m.type === "image")?.url || "",
        mediaList: mediaList.slice(0, 15),
        source: normalizedUrl.includes("t.me") ? "telegram"
                : normalizedUrl.includes("vk.com") ? "vk"
                : normalizedUrl.includes("youtube.com") || normalizedUrl.includes("youtu.be") ? "youtube"
                : normalizedUrl.includes("zen.yandex.ru") || normalizedUrl.includes("dzen.ru") ? "zen"
                : "web",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
```
