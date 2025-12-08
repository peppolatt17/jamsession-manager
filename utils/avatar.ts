// Helper to resolve avatar image URLs from a seed
// Supports local images via special seeds: 'local:custom1', 'local:custom2'
// Falls back to Dicebear Adventurer set for all other seeds.

export const getAvatarUrl = (seed?: string, fallback?: string) => {
  const s = seed || fallback || 'Default';
  if (s.startsWith('local:')) {
    const key = s.split(':')[1];
    if (/^custom\d{1,2}$/.test(key)) {
      return `/avatars/${key}.png`;
    }
    return '/avatars/custom1.png';
  }
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(s)}`;
};
