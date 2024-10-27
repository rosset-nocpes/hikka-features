import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NumberField, NumberFieldInput } from "@/components/ui/number-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import { createEffect, createResource, createSignal, Show } from "solid-js";
import { For, render } from "solid-js/web";
import { TransitionGroup } from "solid-transition-group";
import { ContentScriptContext } from "wxt/client";
import MaterialSymbolsSettingsOutline from "~icons/material-symbols/settings-outline";
import "../../app.css";

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

export default async function reader(ctx: ContentScriptContext, data: any) {
  const [getChapterData, setChapterData] = createSignal<ChapterDataEntry>(
    data[0]
  );
  const [getChapterPages, setChapterPages] = createSignal(
    await getReaderImages("mon", getChapterData()["id"])
  );

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

  return createShadowRootUi(ctx, {
    name: "reader-ui",
    position: "inline",
    append: "first",
    anchor: document.querySelector(".order-2"),
    onMount(container) {
      render(
        () => (
          <div class="dark relative bg-secondary/30 border-secondary/60 border rounded-md">
            <TransitionGroup name="vertical-slide-fade" appear={true}>
              <Carousel
                opts={{
                  dragFree: false,
                }}
                plugins={[WheelGesturesPlugin()]}
                orientation="vertical"
                setApi={setApi}
              >
                <div class="gradient-mask-b-90-d">
                  <CarouselContent class="h-[700px]">
                    <For each={getChapterPages()}>
                      {/* <For
                      each={[
                        "https://cdn.hikka.io/content/manga/berserk-fb9fbd/_k-c2Jia2JOcguyOMMEPGQ.jpg",
                      ]}
                    > */}
                      {(img_url) => {
                        const [image] = createResource<string>(() =>
                          loadImage(img_url)
                        );
                        return (
                          <CarouselItem>
                            <div class="flex h-[90%] justify-center items-center">
                              <Show
                                when={image()}
                                fallback={
                                  <div class="reader-image-skeleton animate-pulse bg-white rounded-md" />
                                }
                              >
                                <img
                                  src={image()}
                                  alt="Chapter page"
                                  loading="lazy"
                                  class="w-[65%] h-auto"
                                />
                              </Show>
                            </div>
                          </CarouselItem>
                        );
                      }}
                    </For>
                  </CarouselContent>
                </div>
                <div class="reader-bar">
                  <div class="flex flex-1 items-center gap-2">
                    <a class="flex text-xs font-semibold">Розділ</a>
                    {/* <Combobox
                      class="text-xs font-semibold w-20"
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
                    </Combobox> */}
                    <Select
                      value={getChapterData()}
                      class="w-full overflow-y-auto max-h-9"
                      gutter={15}
                      onChange={setChapterData}
                      options={data}
                      optionValue="id"
                      optionTextValue="chapter"
                      placeholder="Оберіть розділ…"
                      itemComponent={(props) => (
                        <SelectItem item={props.item}>
                          <div class="flex flex-col gap-1">
                            <a>{props.item.rawValue.chapter}</a>
                            <a class="text-xs font-medium">
                              {props.item.rawValue.scanlation_groups[0].name}
                            </a>
                          </div>
                        </SelectItem>
                      )}
                    >
                      <SelectTrigger aria-label="Chapter" class="focus:ring-0">
                        <SelectValue<any>>
                          {(state) =>
                            state.selectedOption() &&
                            state.selectedOption().chapter
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent class="overflow-y-auto max-h-96 z-0" />
                    </Select>
                  </div>
                  <div class="flex flex-1 items-center justify-center">
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
                      <NumberFieldInput class="size-5 px-0 text-xs font-semibold" />
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
                  <div class="flex flex-1 justify-end">
                    <DropdownMenu placement="top-end" gutter={10}>
                      <DropdownMenuTrigger
                        class="flex hover:bg-black"
                        as={Button<"button">}
                        variant="ghost"
                      >
                        <MaterialSymbolsSettingsOutline />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent class="w-48">
                        <DropdownMenuLabel>Налаштування</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <span>Commit</span>
                          <DropdownMenuShortcut>⌘+K</DropdownMenuShortcut>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Carousel>
            </TransitionGroup>
          </div>
        ),
        container
      );
    },
  });
}
