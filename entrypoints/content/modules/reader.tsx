import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  CarouselApi,
} from "@/components/ui/carousel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NumberField, NumberFieldInput } from "@/components/ui/number-field";
import { Image } from "@kobalte/core/image";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import { createEffect, createSignal } from "solid-js";
import { For, render } from "solid-js/web";
import { TransitionGroup } from "solid-transition-group";

export async function getReaderData(slug: string) {
  const response = await (
    await fetch(`http://localhost:8000/read/${slug}/1`)
  ).json();

  return response;
}

export default async function Reader(data: any) {
  const reader_button = document.getElementById(
    "reader-button"
  ) as HTMLButtonElement;

  const [getChapterPages, setChapterPages] = createSignal(data["images"]);

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
              {(img_url) => (
                <CarouselItem>
                  <div class="reader-item">
                    <img loading="lazy" src={img_url} />
                  </div>
                </CarouselItem>
              )}
            </For>
          </CarouselContent>
          <div class="reader-bar">
            <div class="flex items-center gap-2">
              <a class="flex text-xs font-semibold">Розділ {data["chapter"]}</a>
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
