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
import { useNovelReader } from '../context/novel-reader-context';

const SortOptions = () => {
  const { container, sortBy, setSortBy } = useNovelReader();
  const { open } = useSidebar();

  const handleOrderChange = () => {
    setSortBy({ ...sortBy, order: sortBy.order === 'asc' ? 'desc' : 'asc' });
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
            sortBy.order === 'asc' && 'scale-y-[-1]',
          )}
        />
        {sortBy.field === 'chapter' ? 'За частиною' : 'За датою'}
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
            onSelect={() => setSortBy({ ...sortBy, field: 'chapter' })}
          >
            За частиною
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setSortBy({ ...sortBy, field: 'date_upload' })}
          >
            За датою
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
};

export default SortOptions;
