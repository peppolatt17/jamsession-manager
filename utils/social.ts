// Utility to normalize social handles and build URLs consistently across the app

export type SocialPlatform = 'instagram' | 'facebook' | 'x';

// Strips leading '@', whitespace, and protocol/domains where possible
export const normalizeHandle = (value: string): string => {
  if (!value) return '';
  let v = value.trim();
  // Remove leading @
  if (v.startsWith('@')) v = v.slice(1);
  // If it's a full URL, try to extract the last path segment for instagram/x
  try {
    if (v.startsWith('http://') || v.startsWith('https://')) {
      const url = new URL(v);
      // For facebook, a page/user can be a full URL; keep it as-is
      const path = url.pathname.replace(/\/$/, '');
      const lastSeg = path.split('/').filter(Boolean).pop() || '';
      // Prefer the handle-like segment if present
      v = lastSeg || v;
    }
  } catch {
    // ignore URL parse errors
  }
  return v;
};

// Builds a URL; if the input looks like a full URL, returns it as-is
export const toSocialUrl = (platform: SocialPlatform, value: string): string => {
  if (!value) return '';
  const raw = value.trim();
  // If already a URL, return as-is
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw;
  }
  const handle = normalizeHandle(raw);
  switch (platform) {
    case 'instagram':
      return `https://instagram.com/${handle}`;
    case 'facebook':
      // Facebook supports both numeric IDs and page names; if user typed a name, build URL
      return `https://facebook.com/${handle}`;
    case 'x':
      return `https://x.com/${handle}`;
    default:
      return raw;
  }
};

