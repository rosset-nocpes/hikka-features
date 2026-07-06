import { useMemo } from 'react';
import MaterialSymbolsArrowDownwardRounded from '~icons/material-symbols/arrow-downward-rounded';
import MaterialSymbolsMoreHoriz from '~icons/material-symbols/more-horiz';

import { Button } from '@/components/ui/button';
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from '@/components/ui/button-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import useReadData from '../../hooks/use-read-data';
import { useReader } from '../../hooks/use-reader';
import {
  ReaderContentMode,
  ReaderOrderBy,
  ReaderSortBy,
} from '../../reader.enums';

const SortOptions = () => {
  const { data } = useReadData();
  const { container, settings, setSettings } = useReader();

  const translators = useMemo(() => {
    const chapters =
      data?.displayMode === ReaderContentMode.Chapters
        ? data.chapters
        : data?.displayMode === ReaderContentMode.Volumes
          ? data.volumes.flatMap((volume) => volume.chapters)
          : [];

    return [
      ...new Set(
        chapters.flatMap((chapter) =>
          chapter.translator
            .split(',')
            .map((translator) => translator.trim())
            .filter(Boolean),
        ),
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [data]);

  const handleOrderChange = () => {
    setSettings({
      sortBy: {
        ...settings.sortBy,
        order:
          settings.sortBy.order === ReaderOrderBy.Ascending
            ? ReaderOrderBy.Descending
            : ReaderOrderBy.Ascending,
      },
    });
  };

  return (
    <ButtonGroup className="w-full">
      <Button
        size="sm"
        variant="secondary"
        className="flex-1 gap-2"
        onClick={handleOrderChange}
      >
        <MaterialSymbolsArrowDownwardRounded
          className={cn(
            'duration-150',
            settings.sortBy.order === 'asc' && 'scale-y-[-1]',
          )}
        />
        {settings.sortBy.field === 'chapter' ? 'За частиною' : 'За датою'}
      </Button>
      <ButtonGroupSeparator />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          render={
            <Button size="sm" variant="secondary">
              <MaterialSymbolsMoreHoriz />
            </Button>
          }
        />
        <DropdownMenuContent
          className="min-w-60"
          align="end"
          side="bottom"
          container={container}
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel>Сортування</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={settings.sortBy?.field || ReaderSortBy.Chapter}
              onValueChange={(field) =>
                setSettings({
                  sortBy: { ...settings.sortBy, field },
                })
              }
            >
              <DropdownMenuRadioItem value={ReaderSortBy.Chapter}>
                За частиною
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value={ReaderSortBy.DateUpload}>
                За датою
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
          {translators.length > 0 && (
            <DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Перекладач</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={settings.translator || 'all'}
                onValueChange={(translator) =>
                  setSettings({
                    translator: translator === 'all' ? '' : translator,
                  })
                }
              >
                <DropdownMenuRadioItem value="all">Усі</DropdownMenuRadioItem>
                {translators.map((translator) => (
                  <DropdownMenuRadioItem key={translator} value={translator}>
                    {translator}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
};

export default SortOptions;
