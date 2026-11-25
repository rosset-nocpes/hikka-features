import { useEffect } from 'react';

/**
 * Names the tab while one of the extension's pages is shown, as hikka.io
 * names its own pages. Leaving for the route the page is shown over, the
 * site doesn't rename the tab, so its own name goes back.
 */
const useDocumentTitle = (title: string | undefined) => {
  useEffect(() => {
    if (!title) return;
    const wanted = `${title} / Hikka`;
    const path = location.pathname;
    let siteTitle: string | undefined;
    const apply = () => {
      // Leaving the page, the site names the next one before this unmounts.
      if (location.pathname !== path || document.title === wanted) return;
      siteTitle = document.title;
      document.title = wanted;
    };
    apply();
    // The site names the tab after the route it shows underneath, later.
    const observer = new MutationObserver(apply);
    observer.observe(document.head, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    return () => {
      observer.disconnect();
      if (siteTitle !== undefined && document.title === wanted) {
        document.title = siteTitle;
      }
    };
  }, [title]);
};

export default useDocumentTitle;
