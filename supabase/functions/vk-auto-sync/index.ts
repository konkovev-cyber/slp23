import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// VK Service Key
const VK_SERVICE_KEY = "bc15f23abc15f23abc15f23a7dbf2b05adbbc15bc15f23ad58326cf040249df893a4523";
const VK_VERSION = "5.199";

// Секрет триггера автосинхронизации. Можно переопределить через
// `supabase secrets set VK_SYNC_SECRET=...` (тогда обновить и cron-задачу).
const SYNC_SECRET = Deno.env.get("VK_SYNC_SECRET") ?? "36486c9354bf74d4561f743f301af82809b1c8750d25e";

// Сообщество по умолчанию — та же стена, что импортируется вручную
const DEFAULT_URL = "https://vk.ru/lichnostplus";
const DEFAULT_DOMAIN = "lichnostplus";

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
  const forceHttps = (u: string) => u ? u.replace(/^http:\/\//i, "https://") : "";
  let firstVideoThumb: string | null = null;

  for (const att of attachments) {
    if (att.type === "photo" && att.photo) {
      const imageUrl = att.photo.sizes?.find((s: any) =>
        s.type === "w" || s.type === "z" || s.type === "y" || s.type === "x"
      )?.url
        || att.photo.sizes?.[att.photo.sizes.length - 1]?.url
        || att.photo.photo_1280;
      if (imageUrl) {
        const httpsUrl = forceHttps(imageUrl);
        if (!mediaList.some((m) => m.url === httpsUrl)) {
          mediaList.push({ url: httpsUrl, type: "image" });
        }
      }
    }

    if (att.type === "video" && att.video) {
      const videoLink = `https://vk.com/video${att.video.owner_id}_${att.video.id}`;
      const videoThumb = att.video.image?.find((s: any) => s.width >= 1280 || s.width >= 800)?.url
        || att.video.image?.[att.video.image.length - 1]?.url
        || "";
      if (!mediaList.some((m) => m.url === videoLink)) {
        mediaList.push({ url: videoLink, type: "video" });
      }
      if (!firstVideoThumb && videoThumb) firstVideoThumb = forceHttps(videoThumb);
    }

    if (att.type === "doc" && att.doc) {
      const docUrl = forceHttps(att.doc.url || "");
      if (docUrl && !mediaList.some((m) => m.url === docUrl)) {
        mediaList.push({ url: docUrl, type: "document" });
        linkLines.push(`📄 Файл: ${att.doc.title || "документ"} — ${docUrl}`);
      }
    }

    if (att.type === "audio" && att.audio) {
      const audioUrl = forceHttps(att.audio.url || "");
      if (audioUrl && !mediaList.some((m) => m.url === audioUrl)) {
        mediaList.push({ url: audioUrl, type: "document" });
        linkLines.push(`🎵 Аудио: ${att.audio.artist || ""} — ${att.audio.title || ""} — ${audioUrl}`);
      }
    }

    if (att.type === "link" && att.link) {
      const linkUrl = forceHttps(att.link.url || "");
      if (linkUrl) {
        linkLines.push(`🔗 ${att.link.title || linkUrl} — ${linkUrl}`);
      }
    }
  }

  return firstVideoThumb;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Защита: триггер доступен только с правильным секретом
  // (cron-задача шлёт `Authorization: Bearer <VK_SYNC_SECRET>`).
  const auth = req.headers.get("Authorization") ?? "";
  if (auth !== `Bearer ${SYNC_SECRET}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const db = createClient(supabaseUrl, serviceRoleKey);

  try {
    let body: { url?: string; count?: number } = {};
    try {
      body = await req.json();
    } catch {
      // пустое тело — используем значения по умолчанию
    }
    const url = (body.url || DEFAULT_URL).trim();
    const count = Math.min(Math.max(body.count ?? 20, 1), 100);

    console.log(`[VK AutoSync] URL: ${url}, count: ${count}`);

    // Определяем стену VK: vk.com, vk.ru, /wall-123, /public123, /club123 или shortname
    const wallMatch = url.match(/vk\.(?:com|ru)\/wall(-?\d+)/i);
    const domainMatch = url.match(/vk\.(?:com|ru)\/([a-zA-Z0-9_.]+)/i);

    const params = new URLSearchParams({
      count: String(count),
      extended: "1",
      v: VK_VERSION,
      access_token: VK_SERVICE_KEY,
    });

    if (wallMatch) {
      params.set("owner_id", wallMatch[1]);
    } else if (domainMatch) {
      const domain = domainMatch[1];
      if (domain.startsWith("public")) {
        params.set("owner_id", "-" + domain.replace("public", ""));
      } else if (domain.startsWith("club")) {
        params.set("owner_id", "-" + domain.replace("club", ""));
      } else {
        params.set("domain", domain);
      }
    } else {
      params.set("domain", DEFAULT_DOMAIN);
    }

    const apiUrl = `https://api.vk.com/method/wall.get?${params.toString()}`;
    console.log(`[VK AutoSync] VK API: ${apiUrl.replace(VK_SERVICE_KEY, "HIDDEN")}`);

    const res = await fetch(apiUrl);
    if (!res.ok) {
      throw new Error(`VK API request failed with status ${res.status}`);
    }
    const data = await res.json();
    if (data.error) {
      throw new Error(`VK API Error: ${data.error.error_msg} (code: ${data.error.error_code})`);
    }

    const items: any[] = data.response?.items || [];
    console.log(`[VK AutoSync] Found ${items.length} posts`);

    if (items.length === 0) {
      return new Response(JSON.stringify({ ok: true, imported: 0, total: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Разбор постов (как в vk-batch-fetch)
    const parsed = items
      .filter((post: any) => !post.is_pinned)
      .map((post: any) => {
        const contentText = post.text ? stripHtml(decodeHtml(post.text)) : "";
        const sourceUrl = `https://vk.com/wall${post.owner_id}_${post.id}`;

        let title = "Новости VK";
        if (contentText) {
          const lines = contentText.split("\n").filter((l: string) => l.trim().length > 0);
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

        let content = contentText + `\n\nИсточник: ${sourceUrl}`;
        if (linkLines.length > 0) {
          content = (content + "\n\n" + linkLines.join("\n")).trim();
        }

        const cover = mediaList.find((m) => m.type === "image")?.url || coverImage || "";

        return {
          source_id: String(post.id),
          published_at: post.date ? new Date(post.date * 1000).toISOString() : new Date().toISOString(),
          title,
          excerpt: contentText.slice(0, 160) + (contentText.length > 160 ? "..." : ""),
          content,
          image_url: cover || null,
          mediaList: mediaList.slice(0, 30),
          source: "vk" as const,
          source_url: sourceUrl,
        };
      });

    // Дедупликация: один батч-SELECT существующих постов по source+source_id.
    // Часть новостей уже импортирована — берём только новые.
    const allIds = parsed.map((p) => p.source_id);
    const { data: existingRows, error: exErr } = await db
      .from("posts")
      .select("id,source_id")
      .eq("source", "vk")
      .in("source_id", allIds);
    if (exErr) {
      throw new Error(`DB error (existing lookup): ${exErr.message}`);
    }
    const existingMap = new Map<string, string>(
      (existingRows ?? []).map((r: any) => [String(r.source_id), String(r.id)])
    );

    // Старые посты импортированы без source_id (только source='vk') —
    // дедуп по source_id их не находит. Сопоставляем по нормализованному
    // заголовку и дозаписываем source_id (бэкфилл), чтобы дубли не появлялись.
    const normalizeTitle = (t: string) =>
      (t ?? "").toLowerCase().replace(/\s+/g, " ").trim();
    const { data: legacyRows } = await db
      .from("posts")
      .select("id,title")
      .eq("source", "vk")
      .is("source_id", null)
      .limit(200);
    const legacyByTitle = new Map<string, string>(
      (legacyRows ?? []).map((r: any) => [normalizeTitle(String(r.title)), String(r.id)])
    );
    if (legacyByTitle.size > 0) {
      for (const p of parsed) {
        if (existingMap.has(p.source_id)) continue;
        const legacyId = legacyByTitle.get(normalizeTitle(p.title));
        if (legacyId) {
          existingMap.set(p.source_id, legacyId);
          await db.from("posts").update({ source_id: p.source_id }).eq("id", legacyId);
          console.log(`[VK AutoSync] Backfilled source_id ${p.source_id} -> post ${legacyId}`);
        }
      }
    }

    const toInsert = parsed.filter((p) => !existingMap.has(p.source_id));
    console.log(`[VK AutoSync] New posts: ${toInsert.length} of ${parsed.length}`);

    if (toInsert.length > 0) {
      const { data: insertedRows, error: insErr } = await db
        .from("posts")
        .insert(
          toInsert.map((p) => ({
            title: p.title,
            slug: `vk-${p.source_id}`,
            category: "Новости",
            content: p.content,
            excerpt: p.excerpt,
            published_at: p.published_at,
            image_url: p.image_url,
            source: p.source,
            source_id: p.source_id,
          }))
        )
        .select("id,source_id");
      if (insErr) {
        // 23505 = slug уже занят (импортирован ранее без source или вручную) —
        // пропускаем такие посты, остальное вставляем
        if (insErr.code !== "23505") {
          throw new Error(`DB error (insert): ${insErr.message}`);
        }
        console.warn(`[VK AutoSync] Some slugs already exist, skipping duplicates`);
      } else {
        for (const row of insertedRows ?? []) {
          existingMap.set(String((row as any).source_id), String((row as any).id));
        }
      }

      // Дозапись недостающих медиа в post_media (галерея на странице новости).
      // Существующие строки не трогаем — старые ссылки остаются в базе.
      const newsIds = [...existingMap.values()];
      if (newsIds.length > 0) {
        try {
          const { data: mediaRows } = await db
            .from("post_media")
            .select("post_id,media_url")
            .in("post_id", newsIds);
          const existingMedia = new Set(
            (mediaRows ?? []).map((r: any) => `${r.post_id}:${r.media_url}`)
          );
          const missing: Array<{
            post_id: string;
            media_url: string;
            media_type: string;
            display_order: number;
          }> = [];
          for (const p of toInsert) {
            const id = existingMap.get(p.source_id);
            if (!id) continue;
            p.mediaList.forEach((m, idx) => {
              const key = `${id}:${m.url}`;
              if (existingMedia.has(key)) return;
              existingMedia.add(key);
              missing.push({
                post_id: id,
                media_url: m.url,
                media_type: m.type,
                display_order: idx,
              });
            });
          }
          if (missing.length > 0) {
            const { error: mErr } = await db.from("post_media").insert(missing);
            if (mErr) {
              console.error("[VK AutoSync] post_media insert error:", mErr);
            }
          }
        } catch (e) {
          console.error("[VK AutoSync] post_media error:", e);
        }
      }
    }

    console.log(`[VK AutoSync] Done: imported ${toInsert.length}, total ${parsed.length}`);
    return new Response(
      JSON.stringify({
        ok: true,
        imported: toInsert.length,
        skipped: parsed.length - toInsert.length,
        total: parsed.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("[VK AutoSync] Runtime Error:", e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
