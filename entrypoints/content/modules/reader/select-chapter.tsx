import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { FC, useState } from "react";

interface Props {
  readerState: ReaderState;
  setReaderState: React.Dispatch<React.SetStateAction<ReaderState>>;
  data: API.ChapterResponse;
  container: HTMLElement;
}

const SelectChapter: FC<Props> = ({
  readerState,
  setReaderState,
  data,
  container,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="line-clamp-1 flex h-10 w-48 justify-between"
        >
          {readerState.chapterData.title}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" container={container}>
        <Command>
          <CommandInput placeholder="Пошук розділу..." />
          <CommandList>
            <CommandEmpty>Розділ не знайдено.</CommandEmpty>
            <CommandGroup>
              {data.chapters.map((chapter) => (
                <CommandItem
                  key={chapter.id}
                  onSelect={() => {
                    setReaderState((prev) => ({
                      ...prev,
                      chapterData: chapter,
                    }));
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      readerState.chapterData.id === chapter.id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  Розділ {chapter.chapter}: {chapter.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SelectChapter;
