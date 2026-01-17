import { Button } from '@/components/ui/button';
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from '@/components/ui/button-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSidebar } from '@/components/ui/sidebar';
import MaterialSymbolsArrowDownwardRounded from '~icons/material-symbols/arrow-downward-rounded';
import MaterialSymbolsMoreHoriz from '~icons/material-symbols/more-horiz';
import { useReader } from '../../hooks/use-reader';
import { ReaderOrderBy, ReaderSortBy } from '../../reader.enums';

const SortOptions = () => {
  const { container, settings, setSettings } = useReader();
  const { open } = useSidebar();

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
        className="flex-1"
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
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="secondary">
            <MaterialSymbolsMoreHoriz />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="min-w-60"
          align={open ? 'end' : 'start'}
          side={open ? 'bottom' : 'left'}
          sideOffset={open ? 4 : 12}
          container={container}
        >
          <DropdownMenuLabel>Сортування</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() =>
              setSettings({
                ...settings,
                sortBy: { ...settings.sortBy, field: ReaderSortBy.Chapter },
              })
            }
          >
            За частиною
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() =>
              setSettings({
                ...settings,
                sortBy: { ...settings.sortBy, field: ReaderSortBy.DateUpload },
              })
            }
          >
            За датою
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
};

export default SortOptions;
