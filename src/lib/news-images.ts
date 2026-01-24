export function extractFirstImageUrl(content: string): string | null {
  const text = content ?? "";

  // 1) HTML img
  const htmlImg = text.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (htmlImg?.[1]) return htmlImg[1];

  // 2) Markdown image ![alt](url)
  const mdImg = text.match(/!\[[^\]]*\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)/);
  if (mdImg?.[1]) return mdImg[1];

  // 3) Raw URL fallback (images only)
  const url = text.match(
    /(https?:\/\/[^\s"')>]+\.(?:png|jpe?g|webp|gif))(?:[?#][^\s"')>]*)?/i
  );
  if (url?.[1]) return url[1];

  return null;
}
