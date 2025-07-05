import { create } from 'zustand';
import { ContentScriptContext } from '#imports';

type ContentType =
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

export const usePageStore = create<PageState & PageActions>((set) => ({
  ctx: {} as ContentScriptContext,
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
}));
