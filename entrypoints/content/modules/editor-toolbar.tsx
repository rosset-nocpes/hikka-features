import { QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence } from 'motion/react';
import { createRoot } from 'react-dom/client';
import { Button } from '@/components/ui/button';
import MaterialSymbolsArrowRightAltRounded from '~icons/material-symbols/arrow-right-alt-rounded';
import { queryClient } from '..';

const editorToolbar = async () => {
  if (document.body.querySelectorAll('editor-toolbar').length !== 0) {
    return;
  }

  return createShadowRootUi(usePageStore.getState().ctx, {
    name: 'editor-toolbar',
    position: 'inline',
    append: 'last',
    anchor: 'main',
    css: ':host(editor-toolbar) { display: flex; position: sticky; bottom: 0.75rem; z-index: 10; margin-inline: auto; margin-top: 3rem; width: fit-content; @media (min-width: 768px) { bottom: 1rem; } }',
    inheritStyles: true,
    async onMount(container) {
      const wrapper = document.createElement('div');
      container.append(wrapper);

      container.classList.toggle('dark', await darkMode.getValue());

      const root = createRoot(wrapper);
      root.render(
        <QueryClientProvider client={queryClient}>
          <EditorToolbar />
        </QueryClientProvider>,
      );

      return { root, wrapper };
    },
  });
};

const EditorToolbar = () => {
  const { data: url } = useHikkaEdits();
  const { data: edit_info } = useHikkaEdit();

  const [getPreviousCreatingEdit, setPreviousCreatingEdit] = [
    () =>
      (
        document.head.querySelector(
          '[name=previous-creating-edit][content]',
        ) as HTMLMetaElement
      )?.content,
    (input: boolean) => {
      input && getPreviousCreatingEdit() === undefined
        ? document.head.insertAdjacentHTML(
            'beforeend',
            `<meta name="previous-creating-edit" content="true">`,
          )
        : input && getPreviousCreatingEdit() === 'false'
          ? // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            ((document.head.querySelector(
              '[name=previous-creating-edit][content]',
            ) as HTMLMetaElement)!.content = 'true')
          : null;
    },
  ];

  // Only for edit page!
  // const isModerator = () =>
  //   document.evaluate(
  //     '/html/body/main/div/div[1]/div/div[1]/div[2]',
  //     document,
  //     null,
  //     XPathResult.BOOLEAN_TYPE,
  //     null,
  //   ).booleanValue;
  const isModerator = true; // depend on hikka auth logic

  const split_path = document.location.pathname.split('/'); // still needed for edit logic
  const creatingEdit = Number.isNaN(parseInt(split_path[2], 10));

  const handleNextEdit = () => {
    window.open(url, '_self');
  };

  return (
    <AnimatePresence>
      {edit_info &&
        !creatingEdit &&
        edit_info.status === 'pending' &&
        (getPreviousCreatingEdit() === undefined ||
          getPreviousCreatingEdit() === 'false') &&
        isModerator && (
          <div className="relative flex flex-row gap-2 rounded-2xl border border-border border-none bg-secondary/60 p-2 backdrop-blur-xl">
            <Button variant="ghost" size="md">
              Попередня правка
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={handleNextEdit}
              disabled={!url}
            >
              Наступна правка
              <MaterialSymbolsArrowRightAltRounded className="h-5 w-5" />
            </Button>
          </div>
        )}
    </AnimatePresence>
  );
};

export default editorToolbar;
