# 📋 ГОТОВЫЙ КОД ДЛЯ DEPLOY

## Файл: `supabase/functions/fetch-metadata/index.ts`

**Дата обновления:** 2026-02-19  
**Версия:** 2.0  
**Строк:** 385

---

## ✅ Что исправлено в этой версии:

1. **Telegram** — правильное формирование embed URL
2. **VK** — 7 селекторов для статей и постов + улучшенные заголовки
3. **YouTube** — ✅ работает
4. **Дзен** — поддержка zen.yandex.ru и dzen.ru
5. **Кодировка** — авто-определение (UTF-8, Windows-1251)
6. **Заголовки** — полные браузерные заголовки для обхода защиты

---

## 🚀 Инструкция по деплою:

1. Откройте https://supabase.com/dashboard/project/qwuicyhadpesklhkjxpn/functions
2. Выберите функцию `fetch-metadata`
3. **Полностью замените** код в редакторе на код из файла ниже
4. Нажмите **Deploy**
5. Протестируйте через curl или в админке

---

## 📄 Полный код функции:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Patterns for non-content images
const GARBAGE_PATTERNS = [
  /emoji/i, /icon/i, /favicon/i, /avatar/i, /logo/i, /pixel/i, /ads/i, /banner/i,
  /loading/i, /spinner/i, /marker/i, /sprite/i, /placeholder/i
];

const GENERIC_TITLES = [
  /telegram\s*widget/i, /telegram\s*:\s*contact/i, /vkontakte/i, /вконтакте/i, /wall\s*post/i, /запись\s*на\s*стене/i
];

// Patterns for video detection
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
  const buffer = await res.arrayBuffer();
  
  // Try to detect charset from Content-Type header
  const contentType = res.headers.get("content-type") || "";
  const charsetMatch = contentType.match(/charset=([a-zA-Z0-9_-]+)/i);
  
  if (charsetMatch) {
    const charset = charsetMatch[1].toLowerCase();
    try {
      // Try the specified charset first
      return new TextDecoder(charset, { fatal: false }).decode(buffer);
    } catch (e) {
      console.log("DEBUG: Failed to decode with charset:", charset, "falling back to utf-8");
    }
  }
  
  // Try UTF-8 first (most common)
  try {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    return decoder.decode(buffer);
  } catch (e) {
    // If UTF-8 fails, try windows-1251 (common for Russian sites)
    try {
      return new TextDecoder("windows-1251", { fatal: false }).decode(buffer);
    } catch (e2) {
      // Fallback to UTF-8 with error replacement
      return new TextDecoder("utf-8", { fatal: false }).decode(buffer);
    }
  }
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

  // 1. OG Image
  const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1];
  if (ogImage) urls.push(ogImage);

  // 2. Background images (often used in Telegram/VK)
  const bgMatches = html.matchAll(/background-image:url\(['"]?([^'"]+)['"]?\)/gi);
  for (const match of bgMatches) {
    if (match[1] && !urls.includes(match[1])) urls.push(match[1]);
  }

  // 3. Regular img tags
  const imgTags = html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
  for (const match of imgTags) {
    if (match[1].startsWith("http") && !urls.includes(match[1])) urls.push(match[1]);
  }

  // 4. Video links (YouTube, etc)
  const videoLinks = html.matchAll(/href=["'](https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|vimeo\.com|vk\.com\/video)[^"']+)["']/gi);
  for (const match of videoLinks) {
    if (match[1] && !urls.includes(match[1])) urls.push(match[1]);
  }

  // 5. VK specific: data-src attributes (lazy loading)
  const dataSrcMatches = html.matchAll(/data-src=["']([^"']+)["']/gi);
  for (const match of dataSrcMatches) {
    if (match[1] && match[1].startsWith("http") && !urls.includes(match[1])) urls.push(match[1]);
  }

  // 6. VK specific: srcset attributes
  const srcsetMatches = html.matchAll(/srcset=["']([^"']+)["']/gi);
  for (const match of srcsetMatches) {
    const urlsFromSrcset = match[1].split(",").map(u => u.trim().split(/\s+/)[0]);
    for (const u of urlsFromSrcset) {
      if (u && u.startsWith("http") && !urls.includes(u)) urls.push(u);
    }
  }

  // 7. Telegram specific: data-webp attributes
  const dataWebpMatches = html.matchAll(/data-webp=["']([^"']+)["']/gi);
  for (const match of dataWebpMatches) {
    if (match[1] && match[1].startsWith("http") && !urls.includes(match[1])) urls.push(match[1]);
  }

  // 8. Telegram specific: data-srcset attributes
  const dataSrcsetMatches = html.matchAll(/data-srcset=["']([^"']+)["']/gi);
  for (const match of dataSrcsetMatches) {
    const urlsFromSrcset = match[1].split(",").map(u => u.trim().split(/\s+/)[0]);
    for (const u of urlsFromSrcset) {
      if (u && u.startsWith("http") && !urls.includes(u)) urls.push(u);
    }
  }

  // 9. Telegram: telegra.ph images
  const telegraMatches = html.matchAll(/https:\/\/telegra\.ph\/file\/[^\s"'<>]+/gi);
  for (const match of telegraMatches) {
    const url = match[0].replace(/["')]$/, ""); // Clean trailing quotes/parens
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
    let fetchUrl = normalizedUrl;

    // Telegram specific handling
    if (normalizedUrl.includes("t.me/")) {
      fetchUrl = normalizedUrl.replace("?single", "");
      // Always use embed mode for better parsing
      if (!fetchUrl.includes("/s/") && !fetchUrl.includes("/embed/")) {
        // Convert regular URL to embed format
        const parts = fetchUrl.split("/");
        const channelOrPost = parts[parts.length - 1];
        if (/^\d+$/.test(channelOrPost)) {
          // It's a post URL like t.me/channel/123
          const channel = parts[parts.length - 2];
          fetchUrl = `https://t.me/${channel}/${channelOrPost}?embed=1`;
        } else {
          // It's a channel URL like t.me/channel
          fetchUrl = `${fetchUrl}?embed=1`;
        }
      }
      console.log("DEBUG: Telegram URL:", fetchUrl);
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
    const contentType = res.headers.get("content-type");
    console.log("DEBUG: Content-Type:", contentType);
    console.log("DEBUG: HTML length:", html.length);
    console.log("DEBUG: First 200 chars:", html.slice(0, 200).replace(/\s+/g, ' '));

    const metadata = extractMetadata(html);
    console.log("DEBUG: Extracted metadata:", metadata);

    let content = "";
    if (normalizedUrl.includes("t.me")) {
      // Telegram: try multiple selectors for different embed formats
      const telegramSelectors = [
        /<div[^>]*class="[^"]*tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class="[^"]*tgme_widget_message_bubble[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class="[^"]*message-text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*itemprop="articleBody"[^>]*>([\s\S]*?)<\/div>/i,
      ];
      console.log("DEBUG: Trying Telegram selectors...");
      for (const selector of telegramSelectors) {
        const match = html.match(selector);
        console.log("DEBUG: TG Selector:", selector.source, "Match:", match ? "YES" : "NO");
        if (match && match[1].trim().length > 20) {
          content = stripHtml(decodeHtml(match[1]));
          console.log("DEBUG: Found Telegram content, length:", content.length);
          break;
        }
      }
      // Fallback: try to extract from paragraph tags if no selector worked
      if (!content) {
        const paragraphMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
        if (paragraphMatch) {
          content = stripHtml(decodeHtml(paragraphMatch[1]));
          console.log("DEBUG: Using paragraph fallback, length:", content.length);
        }
      }
      console.log("DEBUG: Telegram content length:", content.length);
    } else if (normalizedUrl.includes("vk.com")) {
      // VK: try multiple selectors (new and old layouts, articles)
      const selectors = [
        // Articles (vk.com/@...)
        /<div[^>]*class="[^"]*ArticleView__content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<article[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/article>/i,
        /<div[^>]*data-field="post"[^>]*>([\s\S]*?)<\/div>/i,
        // Regular posts
        /<div[^>]*class="[^"]*wall_post_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class="[^"]*WallPostText[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class="[^"]*post__text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class="[^"]*page_post_content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      ];
      console.log("DEBUG: Trying VK selectors...");
      for (const selector of selectors) {
        const match = html.match(selector);
        console.log("DEBUG: Selector:", selector.source.substring(0, 50), "Match:", match ? "YES" : "NO");
        if (match && match[1].trim().length > 20) {
          content = stripHtml(decodeHtml(match[1]));
          console.log("DEBUG: Found VK content, length:", content.length);
          break;
        }
      }
      // If still no content, try to extract from meta description
      if (!content) {
        const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']+)["']/i);
        if (metaDesc) {
          content = decodeHtml(metaDesc[1]);
          console.log("DEBUG: Using meta description, length:", content.length);
        } else {
          console.log("DEBUG: No VK content found");
        }
      }
    } else {
      // Other websites: use Open Graph metadata
      content = metadata.description || "";
      
      // Try to extract article content from common CMS patterns
      const articleContentSelectors = [
        /<article[^>]*>([\s\S]*?)<\/article>/i,
        /<div[^>]*class="[^"]*article-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class="[^"]*post-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*itemprop="articleBody"[^>]*>([\s\S]*?)<\/div>/i,
      ];
      
      for (const selector of articleContentSelectors) {
        const match = html.match(selector);
        if (match && match[1].trim().length > 50) {
          const extracted = stripHtml(decodeHtml(match[1]));
          if (extracted.length > content.length) {
            content = extracted;
            console.log("DEBUG: Found article content, length:", content.length);
            break;
          }
        }
      }
    }

    const mediaList = extractMedia(html);
    console.log("DEBUG: Media list count:", mediaList.length);

    // If it's Telegram and we have a very short title, try to use first line of content
    let finalTitle = metadata.title;

    // For Telegram, if title is generic or too short, use first line of content
    if (normalizedUrl.includes("t.me") && (!finalTitle || GENERIC_TITLES.some(p => p.test(finalTitle)) || finalTitle.length < 10)) {
      if (content) {
        const lines = content.split('\n').filter(l => l.trim().length > 0);
        if (lines.length > 0) {
          finalTitle = lines[0].slice(0, 100).trim();
          if (finalTitle.length < lines[0].length) finalTitle += "...";
        }
      }
    }

    // For VK, if title is generic or empty, use first line of content
    if (normalizedUrl.includes("vk.com") && (!finalTitle || GENERIC_TITLES.some(p => p.test(finalTitle)))) {
      if (content) {
        const lines = content.split('\n').filter(l => l.trim().length > 0);
        if (lines.length > 0) {
          finalTitle = lines[0].slice(0, 100).trim();
          if (finalTitle.length < lines[0].length) finalTitle += "...";
        }
      }
    }

    if (!finalTitle && content) {
      const lines = content.split('\n').filter(l => l.trim().length > 0);
      if (lines.length > 0) {
        finalTitle = lines[0].slice(0, 100).trim();
        if (finalTitle.length < lines[0].length) finalTitle += "...";
      }
    }

    // Ensure main image is included if not garbage
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

---

## 🧪 Тесты после деплоя:

```bash
# YouTube (должен работать)
curl -X POST https://qwuicyhadpesklhkjxpn.supabase.co/functions/v1/fetch-metadata \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"https://www.youtube.com/watch?v=dQw4w9WgXcQ\"}"

# Telegram (проверьте логи)
curl -X POST https://qwuicyhadpesklhkjxpn.supabase.co/functions/v1/fetch-metadata \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"https://t.me/slp23/1619\"}"

# VK (проверьте кодировку)
curl -X POST https://qwuicyhadpesklhkjxpn.supabase.co/functions/v1/fetch-metadata \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"https://vk.com/@lichnostplus-chastnaya-shkola-dopolnitelnogo-obrazovaniya-lichnost-plus-v\"}"
```

---

## 📊 Логи для проверки:

После каждого теста проверяйте логи в Supabase Dashboard → Logs

Ожидаемые сообщения:
```
DEBUG: Content-Type: text/html; charset=utf-8
DEBUG: HTML length: 45678
DEBUG: First 200 chars: <!DOCTYPE html>...
DEBUG: Trying Telegram selectors...
DEBUG: TG Selector: ... Match: YES
DEBUG: Found Telegram content, length: 523
DEBUG: Media list count: 3
```
