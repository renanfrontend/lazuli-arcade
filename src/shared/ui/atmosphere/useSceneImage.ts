import { useEffect, useRef } from 'react';
export function useSceneImage(source: string) {
  const image = useRef<HTMLImageElement | null>(null);
  useEffect(() => { const asset = new Image(); asset.src = source; image.current = asset; return () => { image.current = null; }; }, [source]);
  return image;
}
