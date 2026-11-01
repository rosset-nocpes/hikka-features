import type { FC } from 'react';

import { BaseFeature, createFeatureUi } from '../../core/base-feature';
import { HikkaPages } from '../../core/core.enums';
import ChecksPopover from './checks-popover';
import { EDIT_FORM } from './edit-fields';
import { NameFillButton, QueueButtons, SourceMenu } from './toolbar-tools';
import { useEditFields, useEditPage } from './use-edit-page';

/**
 * Tools for editors in a bar floating at the bottom of an edit's page, as
 * hikka.io's own bar does on a title's.
 */
const EditToolbar: FC<
  { container: HTMLElement } & NonNullable<ReturnType<typeof useEditPage>>
> = ({ container, mode, editId }) => {
  const fields = useEditFields();

  return (
    <div
      role="toolbar"
      aria-label="Інструменти редактора"
      className="surface-glass border-border animate-in fade-in-0 slide-in-from-bottom-2 mt-5 flex items-center gap-2 rounded-lg border px-3 py-2 duration-200 motion-reduce:animate-none"
    >
      <ChecksPopover fields={fields} container={container} />
      {mode !== 'view' && <SourceMenu container={container} />}
      {mode === 'new' && (
        <NameFillButton fields={fields} container={container} />
      )}
      {mode === 'view' && editId && (
        <>
          <div className="bg-border h-6 w-px" />
          <QueueButtons editId={editId} container={container} />
        </>
      )}
    </div>
  );
};

const EditToolbarRoot: FC<{ container: HTMLElement }> = ({ container }) => {
  const { enabled } = useSettings().features.editorToolbar;
  const page = useEditPage();
  if (!enabled || !page) return null;
  return <EditToolbar container={container} {...page} />;
};

export default class EditToolbarFeature extends BaseFeature {
  readonly id = 'edit-toolbar';
  readonly pages = [HikkaPages.EditForm];

  async init() {
    this.ui = await createFeatureUi({
      name: this.id,
      position: 'inline',
      // The page's main column, which the bar floats over to its end.
      anchor: () => document.querySelector(EDIT_FORM)?.closest('section'),
      append: 'last',
      // The column's gap goes to the bar, so nothing's left when it's off.
      hostCss: `
        display: block;
        position: sticky;
        bottom: calc(var(--tab-bar-height, 0px) + 1rem);
        z-index: 10;
        align-self: center;
        max-width: 100%;
        margin-top: -1.25rem !important;
      `,
      render: (container) => <EditToolbarRoot container={container} />,
    });
  }
}
