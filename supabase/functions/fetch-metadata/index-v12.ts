import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

/**
 * Парсинг VK через HTML с правильным декодированием Windows-1251
 */
async function fetchVKPost(url: string): Promise<{
  title: string;
  description: string;
  content: string;
  image: string;
  mediaList: Array<{ url: string; type: "image" | "video" }>;
} | null> {
  try {
    console.log("DEBUG: Parsing VK:", url);
    
    // Извлекаем owner_id и post_id из URL
    const wallMatch = url.match(/vk\.com\/wall(-?\d+)_(\d+)/);
    if (!wallMatch) {
      console.log("DEBUG: Not a VK wall URL");
      return null;
    }

    const ownerId = wallMatch[1];
    const postId = wallMatch[2];
    console.log("DEBUG: VK post - owner:", ownerId, "post:", postId);

    // Пробуем получить через VK API с правильным кодированием
    const apiUrl = `https://api.vk.com/method/wall.getById?posts=${encodeURIComponent(ownerId + '_' + postId)}&extended=1&v=5.199`;
    console.log("DEBUG: Calling VK API:", apiUrl);
    
    try {
      const apiResponse = await fetch(apiUrl, {
        headers: {
          "Authorization": "ServiceKey bc15f23abc15f23abc15f23a7dbf2b05adbbc15bc15f23ad58326cf040249df893a4523",
        },
      });

      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        console.log("DEBUG: VK API response:", apiData.error ? "ERROR" : "OK");
        
        if (!apiData.error && apiData.response?.items?.[0]) {
          const post = apiData.response.items[0];
          const content = post.text || "";
          
          // Извлекаем изображения
          const mediaList: Array<{ url: string; type: "image" | "video" }> = [];
          
          if (post.attachments) {
            for (const attachment of post.attachments) {
              if (attachment.type === "photo" && attachment.photo) {
                const photo = attachment.photo;
                let imageUrl = photo.photo_1280 || photo.photo_807 || photo.photo_604;
                // Заменяем http на https
                imageUrl = imageUrl?.replace('http://', 'https://');
                if (imageUrl) {
                  mediaList.push({ url: imageUrl, type: "image" });
                }
              }
            }
          }
          
          // Заголовок - первая строка
          let title = "Новости";
          if (content) {
            const firstLine = content.split('\n').filter(l => l.trim().length > 0)[0];
            if (firstLine) title = firstLine.substring(0, 100).trim();
          }
          
          console.log("DEBUG: VK API success - title:", title);
          console.log("DEBUG: Images:", mediaList.length);
          
          return {
            title,
            description: content.substring(0, 255) + (content.length > 255 ? "..." : ""),
            content,
            image: mediaList[0]?.url || "",
            mediaList: mediaList.slice(0, 15),
          };
        }
      }
    } catch (apiError) {
      console.log("DEBUG: VK API failed, falling back to HTML");
    }

    // Fallback: парсим HTML страницы
    console.log("DEBUG: Using HTML fallback");
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "ru-RU,ru;q=0.9",
      },
    });

    if (!response.ok) return null;

    const arrayBuffer = await response.arrayBuffer();
    
    // Определяем кодировку и декодируем
    let html = "";
    try {
      html = new TextDecoder('utf-8').decode(arrayBuffer);
      if (html.includes('\uFFFD')) {
        // UTF-8 не подошёл, пробуем Windows-1251
        html = decodeWindows1251(arrayBuffer);
      }
    } catch (e) {
      html = decodeWindows1251(arrayBuffer);
    }
    
    // Open Graph
    const getOg = (property: string): string => {
      const match = html.match(
        new RegExp(`<meta[^>]+property=["']og:${property}["'][^>]*content=["']([^"']+)["']`, "i")
      );
      return match ? decodeHtml(match[1]) : "";
    };

    const ogTitle = getOg("title");
    const ogDescription = getOg("description");
    const ogImage = getOg("image")?.replace('http://', 'https://');

    const content = ogDescription || ogTitle;
    
    const mediaList: Array<{ url: string; type: "image" | "video" }> = [];
    if (ogImage) mediaList.push({ url: ogImage, type: "image" });

    return {
      title: ogTitle || "Новости",
      description: content,
      content: content,
      image: mediaList[0]?.url || "",
      mediaList: mediaList.slice(0, 15),
    };
  } catch (error) {
    console.error("DEBUG: Error:", error);
    return null;
  }
}

// Декодер Windows-1251 → UTF-8
function decodeWindows1251(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const result: number[] = [];
  
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    if (byte < 128) {
      result.push(byte);
    } else {
      const map: Record<number, number> = {
        0x80: 0x0401, 0x81: 0x0402, 0x82: 0x201A, 0x83: 0x0453, 0x84: 0x201E, 0x85: 0x2026, 0x86: 0x2020, 0x87: 0x2021,
        0x88: 0x20AC, 0x89: 0x2030, 0x8A: 0x0409, 0x8B: 0x2039, 0x8C: 0x040A, 0x8D: 0x040C, 0x8E: 0x040B, 0x8F: 0x040F,
        0x90: 0x0451, 0x91: 0x2018, 0x92: 0x2019, 0x93: 0x201C, 0x94: 0x201D, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
        0x98: 0x2122, 0x99: 0x0459, 0x9A: 0x045A, 0x9B: 0x203A, 0x9C: 0x045C, 0x9D: 0x045C, 0x9E: 0x045B, 0x9F: 0x045F,
        0xA0: 0x00A0, 0xA1: 0x040E, 0xA2: 0x045E, 0xA3: 0x0408, 0xA4: 0x00A4, 0xA5: 0x0490, 0xA6: 0x00A6, 0xA7: 0x00A7,
        0xA8: 0x0401, 0xA9: 0x00A9, 0xAA: 0x0404, 0xAB: 0x00AB, 0xAC: 0x00AC, 0xAD: 0x00AD, 0xAE: 0x00AE, 0xAF: 0x0407,
        0xB0: 0x00B0, 0xB1: 0x00B1, 0xB2: 0x0406, 0xB3: 0x0456, 0xB4: 0x0491, 0xB5: 0x00B5, 0xB6: 0x00B6, 0xB7: 0x00B7,
        0xB8: 0x0451, 0xB9: 0x2116, 0xBA: 0x0454, 0xBB: 0x00BB, 0xBC: 0x0458, 0xBD: 0x0405, 0xBE: 0x0455, 0xBF: 0x0457,
        0xC0: 0x0410, 0xC1: 0x0411, 0xC2: 0x0412, 0xC3: 0x0413, 0xC4: 0x0414, 0xC5: 0x0415, 0xC6: 0x0416, 0xC7: 0x0417,
        0xC8: 0x0418, 0xC9: 0x0419, 0xCA: 0x041A, 0xCB: 0x041B, 0xCC: 0x041C, 0xCD: 0x041D, 0xCE: 0x041E, 0xCF: 0x041F,
        0xD0: 0x0420, 0xD1: 0x0421, 0xD2: 0x0422, 0xD3: 0x0423, 0xD4: 0x0424, 0xD5: 0x0425, 0xD6: 0x0426, 0xD7: 0x0427,
        0xD8: 0x0428, 0xD9: 0x0429, 0xDA: 0x042A, 0xDB: 0x042B, 0xDC: 0x042C, 0xDD: 0x042D, 0xDE: 0x042E, 0xDF: 0x042F,
        0xE0: 0x0430, 0xE1: 0x0431, 0xE2: 0x0432, 0xE3: 0x0433, 0xE4: 0x0434, 0xE5: 0x0435, 0xE6: 0x0436, 0xE7: 0x0437,
        0xE8: 0x0438, 0xE9: 0x0439, 0xEA: 0x043A, 0xEB: 0x043B, 0xEC: 0x043C, 0xED: 0x043D, 0xEE: 0x043E, 0xEF: 0x043F,
        0xF0: 0x0440, 0xF1: 0x0441, 0xF2: 0x0442, 0xF3: 0x0443, 0xF4: 0x0444, 0xF5: 0x0445, 0xF6: 0x0446, 0xF7: 0x0447,
        0xF8: 0x0448, 0xF9: 0x0449, 0xFA: 0x044A, 0xFB: 0x044B, 0xFC: 0x044C, 0xFD: 0x044D, 0xFE: 0x044E, 0xFF: 0x044F,
      };
      result.push(map[byte] || byte);
    }
  }
  
  return new TextDecoder('utf-8').decode(new Uint8Array(result));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url) throw new Error("URL is required");

    let normalizedUrl = url.trim();

    // VK
    if (normalizedUrl.includes("vk.com/wall-")) {
      console.log("DEBUG: VK detected");
      const vkData = await fetchVKPost(normalizedUrl);

      if (vkData) {
        console.log("DEBUG: VK success - title:", vkData.title);
        return new Response(
          JSON.stringify({ ...vkData, source: "vk" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } }
        );
      }
    }

    // Telegram
    let fetchUrl = normalizedUrl;
    if (normalizedUrl.includes("t.me/")) {
      fetchUrl = normalizedUrl.replace("?single", "");
      const parts = fetchUrl.split("/");
      const channelOrPost = parts[parts.length - 1];
      if (/^\d+$/.test(channelOrPost)) {
        const channel = parts[parts.length - 2];
        fetchUrl = `https://t.me/${channel}/${channelOrPost}?embed=1`;
      }
    }

    const res = await fetch(fetchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "ru-RU,ru;q=0.9",
      },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const arrayBuffer = await res.arrayBuffer();
    const html = new TextDecoder('utf-8').decode(arrayBuffer);
    
    const getOg = (property: string): string => {
      const match = html.match(
        new RegExp(`<meta[^>]+property=["']og:${property}["'][^>]*content=["']([^"']+)["']`, "i")
      );
      return match ? decodeHtml(match[1]) : "";
    };

    const title = getOg("title") || "Новости";
    const description = getOg("description");
    const ogImage = getOg("image");
    
    const mediaList: Array<{ url: string; type: "image" | "video" }> = [];
    if (ogImage) mediaList.push({ url: ogImage.replace('http://', 'https://'), type: "image" });

    return new Response(
      JSON.stringify({
        title,
        description: description || title,
        content: description || title,
        image: mediaList[0]?.url || "",
        mediaList,
        source: normalizedUrl.includes("t.me") ? "telegram" : "web",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } }
    );
  } catch (e) {
    console.error("ERROR:", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
