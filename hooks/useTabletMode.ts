import { useEffect, useState } from 'react';

// Detects tablet usage to enable tablet-only UI adjustments.
// Heuristics: touch-capable device with viewport width between 768px and 1366px.
// This focuses on landscape tablets (e.g., 1024x768, 1280x800) and avoids phones/desktops.
export const useTabletMode = () => {
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // Dev/QA overrides: allow forcing tablet mode via query param or localStorage
      const usp = new URLSearchParams(window.location.search);
      const forceParam = usp.get('tablet') === '1';
      const forceStorage = typeof localStorage !== 'undefined' && localStorage.getItem('forceTabletMode') === '1';
      const force = forceParam || forceStorage;

      // Width range commonly covering tablets
      const inRange = w >= 768 && w <= 1366;
      // Exclude very small heights typical of mobile portrait
      const okHeight = h >= 600;

      // Simplified heuristic: base only on viewport size (or force override)
      setIsTablet(force || (inRange && okHeight));
    };

    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return isTablet;
};
