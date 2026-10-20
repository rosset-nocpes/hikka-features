import MaterialSymbolsMenuBookOutlineRounded from '~icons/material-symbols/menu-book-outline-rounded';

import NavbarAction from '@/components/navbar-action';

import { BaseFeature, createFeatureUi } from '../../core/base-feature';
import { HikkaPages } from '../../core/core.enums';
import useReadData from './hooks/use-read-data';
import { openReader } from './reader';

export default class ReadButtonFeature extends BaseFeature {
  readonly id = 'read-button';
  readonly pages = [HikkaPages.MangaContent, HikkaPages.NovelContent];

  async init() {
    this.ui = await createFeatureUi({
      name: this.id,
      position: 'inline',
      append: 'first',
      anchor: '#navbar-card',
      hostCss: 'margin-right: -0.5rem !important;',
      render: () => <ReadButton />,
    });
  }
}

const ReadButton = () => {
  const { enabled } = useSettings().features.reader;
  const { data, isLoading, isError } = useReadData();

  return (
    <NavbarAction
      enabled={enabled}
      status={{ isLoading, isError, found: !!data }}
      label="Читати"
      icon={<MaterialSymbolsMenuBookOutlineRounded className="size-full" />}
      onClick={openReader}
    />
  );
};
