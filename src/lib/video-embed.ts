export type VideoProvider = "youtube" | "rutube" | "vk" | "telegram";

function safeUrl(raw: string): URL | null {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

export function detectVideoProvider(url: string): VideoProvider | null {
  const u = safeUrl(url);
  if (!u) return null;
  const host = u.hostname.replace(/^www\./, "").toLowerCase();

  if (host === "youtu.be" || host.endsWith("youtube.com")) return "youtube";
  if (host.endsWith("rutube.ru")) return "rutube";
  if (host === "vk.com" || host.endsWith("vkvideo.ru")) return "vk";
  if (host === "t.me" || host.endsWith("telegram.me")) return "telegram";
  return null;
}

export function isDirectVideoFile(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

export function toEmbedUrl(url: string): string | null {
  const provider = detectVideoProvider(url);
  const u = safeUrl(url);
  if (!provider || !u) return null;

  if (provider === "youtube") {
    // youtube.com/watch?v=ID, /shorts/ID, youtu.be/ID
    if (u.hostname.replace(/^www\./, "") === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    const v = u.searchParams.get("v");
    if (v) return `https://www.youtube.com/embed/${v}`;

    const shorts = u.pathname.match(/\/shorts\/([^/?#]+)/i)?.[1];
    if (shorts) return `https://www.youtube.com/embed/${shorts}`;

    const embed = u.pathname.match(/\/embed\/([^/?#]+)/i)?.[1];
    if (embed) return `https://www.youtube.com/embed/${embed}`;

    return null;
  }

  if (provider === "rutube") {
    // rutube.ru/video/<id>/
    const id = u.pathname.match(/\/video\/([^/?#]+)/i)?.[1];
    return id ? `https://rutube.ru/play/embed/${id}` : null;
  }

  if (provider === "vk") {
    // vk.com/video-<oid>_<id>  OR vk.com/video<oid>_<id>
    const m = u.pathname.match(/\/video(-?\d+)_([0-9]+)/i) ?? u.pathname.match(/\/video(-?\d+)_([0-9]+)/i);
    const alt = u.pathname.match(/\/video(-?\d+)_([0-9]+)/i);
    const mm = m ?? alt ?? u.pathname.match(/\/video(-?\d+)_([0-9]+)/i);
    const m2 = mm ?? u.pathname.match(/\/video(-?\d+)_([0-9]+)/i);
    const m3 = m2 ?? u.pathname.match(/\/video(-?\d+)_([0-9]+)/i);

    const match = m3 ?? u.pathname.match(/\/video(-?\d+)_([0-9]+)/i) ?? u.pathname.match(/\/video(-?\d+)_([0-9]+)/i);
    if (match) {
      const oid = match[1];
      const id = match[2];
      return `https://vk.com/video_ext.php?oid=${encodeURIComponent(oid)}&id=${encodeURIComponent(id)}&hd=2`;
    }

    // sometimes URL is /video123_456 (no slash match above)
    const m4 = (u.pathname + u.search).match(/video(-?\d+)_([0-9]+)/i);
    if (m4) {
      const oid = m4[1];
      const id = m4[2];
      return `https://vk.com/video_ext.php?oid=${encodeURIComponent(oid)}&id=${encodeURIComponent(id)}&hd=2`;
    }

    return null;
  }

  if (provider === "telegram") {
    // Telegram embed works via ?embed=1 on the message URL
    // Remove ?single and add embed=1
    const normalized = new URL(u.toString());
    normalized.searchParams.delete("single");
    normalized.searchParams.set("embed", "1");
    return normalized.toString();
  }

  return null;
}
