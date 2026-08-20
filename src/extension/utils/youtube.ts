/**
 * Extracts YouTube Video ID from standard watch URLs, short URLs, or embedded paths
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes("youtube.com")) {
      // Standard watch url: https://www.youtube.com/watch?v=VIDEO_ID
      const v = urlObj.searchParams.get("v");
      if (v) return v;

      // Embed url: https://www.youtube.com/embed/VIDEO_ID
      const matchEmbed = urlObj.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
      if (matchEmbed) return matchEmbed[1];
    } else if (urlObj.hostname.includes("youtu.be")) {
      // Short url: https://youtu.be/VIDEO_ID
      const matchShort = urlObj.pathname.match(/^\/([a-zA-Z0-9_-]{11})/);
      if (matchShort) return matchShort[1];
    }
  } catch (e) {
    // If relative or raw string
    const match = url.match(/(?:v=|\/embed\/|\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];
  }
  return null;
}

/**
 * Checks if current URL is a valid YouTube Watch page (excludes shorts, search, channels, live stream feeds)
 */
export function isYouTubeWatchUrl(url: string): boolean {
  if (!url) return false;
  return url.includes("youtube.com/watch") || url.includes("youtu.be/");
}

/**
 * Clean up scraped YouTube metadata titles
 */
export function sanitizeYouTubeTitle(rawTitle: string): string {
  if (!rawTitle) return "YouTube Educational Video";
  return rawTitle
    .replace(/\s*-\s*YouTube\s*$/i, "")
    .replace(/^\(\d+\)\s*/, "") // Remove notification count e.g. "(1) "
    .trim();
}
