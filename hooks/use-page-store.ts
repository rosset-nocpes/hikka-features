import { create } from 'zustand';

import type { ContentScriptContext } from '#imports';

export type ContentType =
  | 'anime'
  | 'manga'
  | 'novel'
  | 'characters'
  | 'person'
  | 'edit';

interface PageState {
  ctx: ContentScriptContext;
  path?: string[];
  contentType?: ContentType;
  slug?: string;
}

interface PageActions {
  updateFromUrl: (url: URL) => void;
  setCTX: (ctx: ContentScriptContext) => void;
}

export const usePageStore = create<PageState & PageActions>((set, get) => ({
  ctx: {} as ContentScriptContext,
  updateFromUrl: (url: URL) => {
    const path = url.pathname.split('/').filter(Boolean);
    // Called on every DOM change; only a new route may notify subscribers.
    if (path.join('/') === get().path?.join('/')) return;

    set({
      path,
      contentType: path[0] as ContentType,
      slug: path[1],
    });
  },
  setCTX: (ctx) => set({ ctx }),
}));
