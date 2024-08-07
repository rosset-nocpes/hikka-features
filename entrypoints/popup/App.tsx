import { createSignal, Show } from "solid-js";
import { aniBackState } from "@/utils/storage";
import { version } from "@/package.json";
import HikkaFLogoSmall from "/hikka-features-small.svg";
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
  DrawerDescription,
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

const [showAniButtons, toggleAniButtons] = createSignal(
  await aniButtonsState.getValue()
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
      <div class="dark bg-black text-white p-[30px] w-[400px] flex flex-col gap-7 font-inter font-semibold rounded-none">
        <h3 class="flex justify-between items-center text-lg font-bold tracking-normal">
          Налаштування
        </h3>
        <div class="flex flex-col gap-5">
          <Switch
            checked={showWatchButton()}
            onClick={() => {
              watchButtonState.setValue(!showWatchButton());
              toggleWatchButton(!showWatchButton());
            }}
            class="flex items-center justify-between"
          >
            <div class="flex flex-col gap-1 mr-10">
              <SwitchLabel>Перегляд</SwitchLabel>
              <SwitchDescription class="text-xs font-medium text-[#A1A1A1]">
                Кнопка для відображення плеєру
              </SwitchDescription>
            </div>
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
          </Switch>
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
          <div class="flex justify-between">
            <div class="flex flex-col gap-1 mr-10">
              <label class="text-sm font-medium">Плеєр</label>
              <div class="text-xs font-medium text-[#A1A1A1]">
                Плеєр за замовчуванням
              </div>
            </div>
            <Select
              value={defaultPlayerProvider()}
              onChange={(e) => {
                defaultPlayer.setValue(e);
                setDefaultPlayerProvider(e);
              }}
              options={["moon", "ashdi"]}
              placeholder="Оберіть плеєр за замовчуванням…"
              itemComponent={(props) => (
                <SelectItem item={props.item}>
                  {props.item.rawValue.toUpperCase()}
                </SelectItem>
              )}
            >
              <SelectTrigger
                aria-label="Player"
                class="focus:ring-0 focus:ring-transparent"
              >
                <SelectValue<string>>
                  {(state) => state.selectedOption().toUpperCase()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent class="dark" />
            </Select>
          </div>
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
                        <Select
                          value={getBackendBranch()}
                          onChange={(e) => {
                            backendBranch.setValue(e);
                            setBackendBranch(e);
                          }}
                          options={["stable", "beta"]}
                          placeholder="Оберіть гілку бекенду…"
                          itemComponent={(props) => (
                            <SelectItem item={props.item}>
                              {props.item.rawValue}
                            </SelectItem>
                          )}
                        >
                          <SelectTrigger
                            aria-label="Backend"
                            class="focus:ring-0 focus:ring-transparent"
                          >
                            <SelectValue<string>>
                              {(state) => state.selectedOption()}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent class="dark" />
                        </Select>
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
