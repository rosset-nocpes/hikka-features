import { createSignal, For, Show } from "solid-js";
import { aniBackState } from "@/utils/storage";
import { version } from "@/package.json";
import MaterialSymbolsExpandAllRounded from "~icons/material-symbols/expand-all-rounded";
import "../app.css";
import {
  Switch,
  SwitchControl,
  SwitchLabel,
  SwitchThumb,
  SwitchDescription,
} from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Transition } from "solid-transition-group";

const [showDevOptions, toggleDevOptions] = createSignal(
  await devOptionsState.getValue()
);

const [showAniBackground, toggleAniBackground] = createSignal(
  await aniBackState.getValue()
);

const [showLocalizedPosterButton, toggleLocalizedPosterButton] = createSignal(
  await localizedPosterButtonState.getValue()
);

const [showLocalizedPoster, toggleLocalizedPoster] = createSignal(
  await localizedPosterState.getValue()
);

const [showAniButtons, toggleAniButtons] = createSignal(
  await aniButtonsState.getValue()
);

const [showFandubBlock, toggleFandubBlock] = createSignal(
  await fandubBlockState.getValue()
);

const [showWatchButton, toggleWatchButton] = createSignal(
  await watchButtonState.getValue()
);

const [defaultPlayerProvider, setDefaultPlayerProvider] = createSignal(
  await defaultPlayer.getValue()
);

const [getBurunyaaMode, toggleBurunyaaMode] = createSignal(
  await burunyaaMode.getValue()
);

const [getBackendBranch, setBackendBranch] = createSignal(
  await backendBranch.getValue()
);

let devClicked = 0;

function App() {
  return (
    <>
      <style>
        {`:root { background-color: black; } 
        .slide-fade-enter-active {
          transition: all 0.3s ease;
        }
        .slide-fade-exit-active {
          transition: all 0.1s cubic-bezier(1, 0.5, 0.8, 1);
        }
        .slide-fade-enter,
        .slide-fade-exit-to {
          transform: translateX(10px);
          opacity: 0;
        }`}
      </style>
      <div
        class={cn(
          "dark text-white p-[30px] h-screen flex flex-col gap-7 font-inter font-semibold",
          getBurunyaaMode()
            ? "bg-[url(https://media1.tenor.com/m/PDzKPqFw6f8AAAAC/neco-neco-arc.gif)]"
            : "bg-black"
        )}
      >
        <h3 class="flex justify-between items-center text-lg font-bold tracking-normal">
          Налаштування
        </h3>
        <div class="flex flex-col gap-5">
          <Drawer>
            <div class="flex justify-between">
              <div class="flex flex-col gap-1 mr-10">
                <label class="text-sm font-medium">Плеєр</label>
                <div class="text-xs font-medium text-[#A1A1A1]">
                  Налаштування плеєра
                </div>
              </div>
              <DrawerTrigger>
                <Button size="icon-sm">
                  <MaterialSymbolsExpandAllRounded />
                </Button>
              </DrawerTrigger>
            </div>
            <DrawerContent class="dark text-white">
              <div class="mx-auto w-full max-w-sm">
                <DrawerHeader>
                  <DrawerTitle>Налаштування плеєра</DrawerTitle>
                </DrawerHeader>
                <div class="flex flex-col gap-5 px-[30px]">
                  <Switch
                    checked={showWatchButton()}
                    onClick={() => {
                      watchButtonState.setValue(!showWatchButton());
                      toggleWatchButton(!showWatchButton());
                    }}
                    class="flex items-center justify-between"
                  >
                    <div class="flex flex-col gap-1 mr-10">
                      <SwitchLabel>Кнопка перегляду</SwitchLabel>
                      <SwitchDescription class="text-xs font-medium text-[#A1A1A1]">
                        Кнопка для відображення плеєру
                      </SwitchDescription>
                    </div>
                    <SwitchControl>
                      <SwitchThumb />
                    </SwitchControl>
                  </Switch>
                  <div class="flex items-center justify-between">
                    <label class="text-sm font-medium">
                      Плеєр за замовчуванням
                    </label>
                    <select
                      class="h-10 px-3 py-1 border bg-transparent rounded-md"
                      value={defaultPlayerProvider()}
                      onChange={(e) => {
                        const target = e.target.value as PlayerSource;
                        defaultPlayer.setValue(target);
                        setDefaultPlayerProvider(target);
                      }}
                    >
                      <For each={["moon", "ashdi"]}>
                        {(elem) => (
                          <option value={elem}>{elem.toUpperCase()}</option>
                        )}
                      </For>
                    </select>
                  </div>
                </div>
                <DrawerFooter>
                  <DrawerClose as={Button<"button">} variant="outline">
                    Зачинити
                  </DrawerClose>
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>
          <Switch
            checked={showAniButtons()}
            onClick={() => {
              aniButtonsState.setValue(!showAniButtons());
              toggleAniButtons(!showAniButtons());
            }}
            class="flex items-center justify-between"
          >
            <div class="flex flex-col gap-1 mr-10">
              <SwitchLabel>Інші джерела</SwitchLabel>
              <SwitchDescription class="text-xs font-medium text-[#A1A1A1]">
                Додаткові посилання на сторінках тайтлів
              </SwitchDescription>
            </div>
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
          </Switch>
          <Switch
            checked={showFandubBlock()}
            onClick={() => {
              fandubBlockState.setValue(!showFandubBlock());
              toggleFandubBlock(!showFandubBlock());
            }}
            class="flex items-center justify-between"
          >
            <div class="flex flex-col gap-1 mr-10">
              <SwitchLabel>Блок фандаб команд</SwitchLabel>
              <SwitchDescription class="text-xs font-medium text-[#A1A1A1]">
                Посилання на фандаб команди, які озвучили аніме тайтл
              </SwitchDescription>
            </div>
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
          </Switch>
          <Switch
            checked={showAniBackground()}
            onClick={() => {
              aniBackState.setValue(!showAniBackground());
              toggleAniBackground(!showAniBackground());
            }}
            class="flex items-center justify-between"
          >
            <div class="flex flex-col gap-1 mr-10">
              <SwitchLabel>Обкладинки</SwitchLabel>
              <SwitchDescription class="text-xs font-medium text-[#A1A1A1]">
                Покращене оформлення на сторінках тайтлів, персонажів та правок
              </SwitchDescription>
            </div>
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
          </Switch>
          <Drawer>
            <div class="flex justify-between">
              <div class="flex flex-col gap-1 mr-10">
                <label class="text-sm font-medium">Локалізовані постери</label>
                <div class="text-xs font-medium text-[#A1A1A1]">
                  Налаштування локалізованих постерів
                </div>
              </div>
              <DrawerTrigger>
                <Button size="icon-sm">
                  <MaterialSymbolsExpandAllRounded />
                </Button>
              </DrawerTrigger>
            </div>
            <DrawerContent class="dark text-white">
              <div class="mx-auto w-full max-w-sm">
                <DrawerHeader>
                  <DrawerTitle>Локалізовані постери</DrawerTitle>
                </DrawerHeader>
                <div class="flex flex-col gap-5 px-[30px]">
                  <Switch
                    checked={showLocalizedPosterButton()}
                    onClick={() => {
                      localizedPosterButtonState.setValue(
                        !showLocalizedPosterButton()
                      );
                      toggleLocalizedPosterButton(!showLocalizedPosterButton());
                    }}
                    class="flex items-center justify-between"
                  >
                    <div class="flex flex-col gap-1 mr-10">
                      <SwitchLabel>Кнопка локалізації постера</SwitchLabel>
                    </div>
                    <SwitchControl>
                      <SwitchThumb />
                    </SwitchControl>
                  </Switch>
                  <Switch
                    checked={showLocalizedPoster()}
                    onClick={() => {
                      localizedPosterState.setValue(!showLocalizedPoster());
                      toggleLocalizedPoster(!showLocalizedPoster());
                    }}
                    class="flex items-center justify-between"
                  >
                    <div class="flex flex-col gap-1 mr-10">
                      <SwitchLabel>Авто-локалізація постера</SwitchLabel>
                      <SwitchDescription class="text-xs font-medium text-[#A1A1A1]">
                        Автоматично замінює постер локалізованою версією
                      </SwitchDescription>
                    </div>
                    <SwitchControl>
                      <SwitchThumb />
                    </SwitchControl>
                  </Switch>
                </div>
                <DrawerFooter>
                  <DrawerClose as={Button<"button">} variant="outline">
                    Зачинити
                  </DrawerClose>
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
        <div class="flex items-center justify-center text-xs text-[#5C5C5C] gap-1">
          <a
            href="https://github.com/rosset-nocpes/hikka-features"
            class="font-bold"
          >
            GitHub
          </a>
          <a>•</a>
          <button
            onClick={() => {
              devClicked++;
              if (devClicked === 5) {
                devOptionsState.setValue(!showDevOptions());
                toggleDevOptions(!showDevOptions());
                devClicked = 0;
              }
            }}
          >
            v{version}
          </button>
          <Transition name="slide-fade">
            <Show when={showDevOptions()}>
              <Drawer>
                <DrawerTrigger as="a" class="absolute right-8">
                  :3
                </DrawerTrigger>
                <DrawerContent class="dark text-white">
                  <div class="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                      <DrawerTitle>Експерементальні функції</DrawerTitle>
                    </DrawerHeader>
                    <div class="flex flex-col gap-5 px-[30px]">
                      <Switch
                        checked={getBurunyaaMode()}
                        onClick={() => {
                          burunyaaMode.setValue(!getBurunyaaMode());
                          toggleBurunyaaMode(!getBurunyaaMode());
                        }}
                        class="flex items-center justify-between"
                      >
                        <div class="flex flex-col gap-1 mr-10">
                          <SwitchLabel>Burunyaa режим</SwitchLabel>
                          <SwitchDescription class="text-xs font-medium text-[#A1A1A1]">
                            Burunyaaaaaa
                          </SwitchDescription>
                        </div>
                        <SwitchControl>
                          <SwitchThumb />
                        </SwitchControl>
                      </Switch>
                      <div class="flex justify-between items-center">
                        <label class="text-sm font-medium">Гілка бекенду</label>
                        <select
                          class="h-10 px-3 py-1 border bg-transparent rounded-md"
                          value={getBackendBranch()}
                          onChange={(e) => {
                            const target = e.target.value as BackendBranches;
                            backendBranch.setValue(target);
                            setBackendBranch(target);
                          }}
                        >
                          <option value="stable">stable</option>
                          <option value="beta">beta</option>
                        </select>
                      </div>
                    </div>
                    <DrawerFooter>
                      <DrawerClose as={Button<"button">} variant="outline">
                        Зачинити
                      </DrawerClose>
                    </DrawerFooter>
                  </div>
                </DrawerContent>
              </Drawer>
            </Show>
          </Transition>
        </div>
      </div>
    </>
  );
}

export default App;
