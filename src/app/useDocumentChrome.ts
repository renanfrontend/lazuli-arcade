import { useEffect } from 'react';
import type { ThemeColor } from '@shared/ui/arcade';

/** Keeps the tab title and the mobile status-bar color in step with the open screen. */
export const useDocumentChrome = (title: string, color: ThemeColor): void => {
  useEffect(() => {
    document.title = title;
  }, [title]);

  useEffect(() => {
    for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
      meta.content = (meta.getAttribute('media') ?? '').includes('dark') ? color.dark : color.light;
    }
  }, [color.light, color.dark]);
};
