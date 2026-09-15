import { useEffect, useState } from 'react';

/** メディアクエリの一致状態を購読する（画面回転・リサイズにも追従） */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** スマートフォン幅（iPhone想定）かどうか。CSSの640pxブレークポイントと合わせる */
export function useIsPhone(): boolean {
  return useMediaQuery('(max-width: 640px)');
}
