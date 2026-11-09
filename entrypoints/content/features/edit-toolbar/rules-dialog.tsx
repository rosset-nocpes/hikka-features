import { queryOptions, useQuery } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import { Marked } from 'marked';
import { type FC, useEffect } from 'react';

import { useIsMobile } from '@/components/hooks/use-mobile';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Spinner } from '@/components/ui/spinner';

import { queryClient } from '../../core/query-client';

/** hikka.io's editing rules, which its own new edit page opens the same way. */
const RULES_URL = 'https://github.com/hikka-io/rules/blob/main/RULES.md';
const RULES_SOURCE =
  'https://raw.githubusercontent.com/hikka-io/rules/main/RULES.md';

const markdown = new Marked({
  gfm: true,
  renderer: {
    link({ href, tokens }) {
      const text = this.parser.parseInline(tokens);
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    },
  },
});

const rulesQuery = queryOptions({
  queryKey: ['hikka-edit-rules'],
  queryFn: async ({ signal }) => {
    const response = await fetch(RULES_SOURCE, { signal });
    if (!response.ok) throw new Error(`Rules: ${response.status}`);
    const html = await markdown.parse(await response.text());
    return DOMPurify.sanitize(html, { ADD_ATTR: ['target'] });
  },
  // The rules don't change while one edits.
  staleTime: Infinity,
});

/** Loads the rules ahead, as the pointer heads for what opens them. */
export const prefetchRules = () => void queryClient.prefetchQuery(rulesQuery);

/** hikka.io's `.prose`, which the shadow root doesn't get. */
const PROSE =
  'leading-relaxed [&_:is(p,ul,ol,pre,h3,h4)]:mb-4 [&>:last-child]:mb-0 [&_h3]:text-lg [&_h3]:font-semibold [&_h4]:text-base [&_h4]:font-semibold [&_ul]:ml-6 [&_ul]:list-disc [&_ol]:ml-6 [&_ol]:list-decimal [&_li]:mt-2 [&_li]:ps-2 [&_li>p]:mb-0 [&_a]:text-primary [&_a]:wrap-break-word [&_a:hover]:underline [&_pre]:bg-muted [&_pre]:rounded-md [&_pre]:px-3 [&_pre]:py-2 [&_pre]:whitespace-pre-wrap [&_code]:font-mono [&_code]:text-[0.9em]';

const Rules: FC = () => {
  const { data, isError } = useQuery(rulesQuery);

  if (isError) {
    return (
      <p className="text-muted-foreground">
        Не вдалося завантажити правила.{' '}
        <a
          href={RULES_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Відкрити на GitHub
        </a>
      </p>
    );
  }
  if (data === undefined) {
    return (
      <div className="flex justify-center py-8">
        <Spinner aria-label="Завантажуємо правила" />
      </div>
    );
  }
  return <div className={PROSE} dangerouslySetInnerHTML={{ __html: data }} />;
};

const TITLE = 'Правила редагування';

/**
 * Lifts the bar's layer over the page's while the rules are open: their
 * backdrop is inside it, and a phone's header and tab bar would show over it.
 */
const useRaisedHost = (container: HTMLElement, raised: boolean) => {
  useEffect(() => {
    const root = container.getRootNode();
    if (!raised || !(root instanceof ShadowRoot)) return;
    const host = root.host as HTMLElement;
    const { zIndex } = host.style;
    host.style.zIndex = '100';
    return () => {
      host.style.zIndex = zIndex;
    };
  }, [container, raised]);
};

/**
 * The editing rules in a dialog, or a drawer on a phone, as hikka.io shows
 * them on its new edit page.
 */
const RulesDialog: FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  container: HTMLElement;
}> = ({ open, onOpenChange, container }) => {
  const isMobile = useIsMobile();
  useRaisedHost(container, open);

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent container={container} className="max-h-[90dvh]">
          <DrawerHeader>
            <DrawerTitle className="text-base font-semibold">
              {TITLE}
            </DrawerTitle>
          </DrawerHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-sm">
            <Rules />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent container={container} className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{TITLE}</DialogTitle>
        </DialogHeader>
        <div className="-mx-4 -mb-4 min-h-0 overflow-y-auto p-4">
          <Rules />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RulesDialog;
