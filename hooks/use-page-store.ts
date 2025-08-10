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
  saved_mal_id?: number;
  path?: string[];
  contentType?: ContentType;
  slug?: string;
}

interface PageActions {
  updateFromUrl: (url: URL) => void;
  setCTX: (ctx: ContentScriptContext) => void;
  setMALId: (mal_id: number) => void;
  clearMALId: () => void;
}

export const usePageStore = create<PageState & PageActions>((set) => ({
  ctx: {} as ContentScriptContext,
  saved_mal_id: undefined,
  contentType: undefined,
  slug: undefined,
  updateFromUrl: (url: URL) => {
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const newContentType = pathSegments[0] as ContentType;
    const newSlug = pathSegments[1];

    set({
      path: pathSegments,
      contentType: newContentType,
      slug: newSlug,
    });
  },
  setCTX: (ctx) => set({ ctx }),
  setMALId: (mal_id) => set({ saved_mal_id: mal_id }),
  clearMALId: () => set({ saved_mal_id: undefined }),
}));
