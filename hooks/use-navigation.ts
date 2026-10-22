import { create } from 'zustand';

export type Page =
  | 'home'
  | 'player'
  | 'reader'
  | 'localizedPoster'
  | 'experimental'
  | 'teamPriority';

/** Sub-pages; everything else goes back to home. */
const parents: Partial<Record<Page, Page>> = { teamPriority: 'player' };

interface NavigationState {
  currentPage: Page;
  direction: 1 | -1;
  navigate: (page: Page) => void;
  goBack: () => void;
}

export const useNavigation = create<NavigationState>((set) => ({
  currentPage: 'home',
  direction: 1,
  navigate: (page) => set({ currentPage: page, direction: 1 }),
  goBack: () =>
    set(({ currentPage }) => ({
      currentPage: parents[currentPage] ?? 'home',
      direction: -1,
    })),
}));
