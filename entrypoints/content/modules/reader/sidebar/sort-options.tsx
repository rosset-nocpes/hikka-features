import { Button } from '@/components/ui/button';
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from '@/components/ui/button-group';
import MaterialSymbolsArrowDownwardRounded from '~icons/material-symbols/arrow-downward-rounded';
import MaterialSymbolsMoreHoriz from '~icons/material-symbols/more-horiz';
import { useReaderContext } from '../context/reader-context';

const SortOptions = () => {
  const { sortBy, setSortBy } = useReaderContext();

  const handleSort = () => {
    setSortBy(sortBy === 'asc' ? 'desc' : 'asc');
  };

  return (
    <ButtonGroup className="w-full">
      <Button
        size="sm"
        variant="secondary"
        className="flex-1"
        onClick={handleSort}
      >
        <MaterialSymbolsArrowDownwardRounded
          className={cn('duration-150', sortBy === 'asc' && 'scale-y-[-1]')}
        />
        За частиною
      </Button>
      <ButtonGroupSeparator />
      <Button size="sm" variant="secondary">
        <MaterialSymbolsMoreHoriz />
      </Button>
    </ButtonGroup>
  );
};

export default SortOptions;
