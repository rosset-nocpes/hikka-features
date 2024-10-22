import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import {
  Combobox,
  ComboboxContent,
  ComboboxControl,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxItemLabel,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NumberField, NumberFieldInput } from "@/components/ui/number-field";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import { createEffect, createResource, createSignal, Show } from "solid-js";
import { For, render } from "solid-js/web";
import { TransitionGroup } from "solid-transition-group";

export async function getReaderData(slug: string) {
  const response = await (
    await fetch(
      `${BACKEND_BRANCHES[await backendBranch.getValue()]}/read/${slug}`
    )
  ).json();

  return response;
}

export async function getReaderImages(slug: string, chapter_id: string) {
  const response = await (
    await fetch(
      `${
        BACKEND_BRANCHES[await backendBranch.getValue()]
      }/read/${slug}/${chapter_id}`
    )
  ).json();

  return response["images"];
}

// Function to load image
const loadImage = (src: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = reject;
    img.src = src;
  });
};

export default async function Reader(data: any) {
  const reader_button = document.getElementById(
    "reader-button"
  ) as HTMLButtonElement;

  const [getChapterData, setChapterData] = createSignal<ChapterDataEntry>(
    data[0]
  );
  const [getChapterPages, setChapterPages] = createSignal(
    await getReaderImages("mon", getChapterData()["id"])
  );

  const start_node = document.querySelector(".order-2")!;
  start_node.insertAdjacentHTML("afterbegin", '<div id="reader"></div>');
  const reader = document.querySelector("#reader")!;

  // disabling reader-button
  reader_button.disabled = true;

  const [api, setApi] = createSignal<ReturnType<CarouselApi>>();
  const [current, setCurrent] = createSignal(1);
  const [count, setCount] = createSignal(1);

  const onSelect = () => {
    setCurrent(api()!.selectedScrollSnap() + 1);
  };

  // const handleScrollToPage = (event: any) => {
  //   const value = event.target.value;
  //   const digitsOnlyRegex = /^(?!0)\d+$/;

  //   if (!digitsOnlyRegex.test(value)) return setPageToMove("");

  //   if (parseInt(value) > count()) return;

  //   setPageToMove(value);
  // };

  createEffect(() => {
    if (!api()) {
      return;
    }

    setCount(api()!.scrollSnapList().length);
    setCurrent(api()!.selectedScrollSnap() + 1);

    api()!.on("select", onSelect);
  });

  createEffect(async () => {
    if (getChapterData()) {
      api()?.scrollTo(0);
      setChapterPages(await getReaderImages("mon", getChapterData()["id"]));
    }
  });

  render(
    () => (
      <TransitionGroup name="vertical-slide-fade" appear={true}>
        <Carousel
          opts={{
            dragFree: false,
          }}
          plugins={[WheelGesturesPlugin()]}
          orientation="vertical"
          setApi={setApi}
        >
          <CarouselContent class="reader-carousel-content">
            <For each={getChapterPages()}>
              {(img_url) => {
                const [image] = createResource<string>(() =>
                  loadImage(img_url)
                );
                return (
                  <CarouselItem>
                    <div class="reader-item">
                      <Show
                        when={image()}
                        fallback={
                          <div class="reader-image-skeleton animate-pulse bg-white rounded-md" />
                        }
                      >
                        <img
                          src={image()}
                          alt="Chapter page"
                          class="w-full h-auto"
                        />
                      </Show>
                    </div>
                  </CarouselItem>
                );
              }}
            </For>
          </CarouselContent>
          <div class="reader-bar">
            <div class="flex items-center gap-2">
              <a class="flex text-xs font-semibold">Розділ</a>
              <Combobox
                class="text-xs font-semibold"
                style={{ width: "100px" }}
                value={getChapterData()}
                options={data}
                optionValue="id"
                optionLabel="chapter"
                optionTextValue="chapter"
                placeholder="Оберіть розділ…"
                onChange={(e) => setChapterData(e!)}
                itemComponent={(props) => (
                  <ComboboxItem item={props.item}>
                    <ComboboxItemLabel>
                      {props.item.rawValue.chapter}
                    </ComboboxItemLabel>
                    <ComboboxItemIndicator />
                  </ComboboxItem>
                )}
              >
                <ComboboxControl aria-label="Chapter">
                  <ComboboxInput />
                  <ComboboxTrigger />
                </ComboboxControl>
                <ComboboxContent class="overflow-y-auto max-h-96 mb-2" />
              </Combobox>
              <DropdownMenu placement="top">
                <DropdownMenuTrigger
                  class="flex size-4 p-4 text-xs font-semibold text-muted-foreground"
                  as={Button<"button">}
                  variant="outline"
                >
                  F
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>
                    <span>Commit</span>
                    <DropdownMenuShortcut>⌘+K</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div class="flex items-center">
              <NumberField
                value={current()}
                onRawValueChange={(e) => {
                  if (e && api()) {
                    api()!.scrollTo(e - 1);
                  }
                }}
                // onKeyDown={(e: KeyboardEvent) => {
                //   if (e.key === "Enter") {
                //     e.preventDefault();
                //     api()!.scrollTo(e - 1);
                //   }
                // }}
                minValue={1}
                maxValue={count()}
                class="number-field"
              >
                <NumberFieldInput class="number-field-input text-xs font-semibold" />
              </NumberField>
              {/* <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                onInput={(e) => api()!.scrollTo(Number(e.target.value - 1))}
                min="1"
                max={count()}
                value={current()}
              /> */}
              <a class="text-xs font-semibold"> / {count()}</a>
            </div>
            <button class="next-button flex p-4 text-xs font-semibold text-muted-foreground">
              Наcтупний
            </button>
          </div>
        </Carousel>
      </TransitionGroup>
    ),
    reader
  );
}
