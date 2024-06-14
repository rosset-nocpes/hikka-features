import { createSignal } from "solid-js";
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

const [showAniBackground, toggleAniBackground] = createSignal(
  await aniBackState.getValue()
);

const [showAniButtons, toggleAniButtons] = createSignal(
  await aniButtonsState.getValue()
);

const [showWatchButton, toggleWatchButton] = createSignal(
  await watchButtonState.getValue()
);

function App() {
  return (
    <div class="dark bg-black text-white p-[30px] h-screen flex flex-col gap-7 font-inter font-semibold">
      <h3 class="flex justify-between items-center text-lg font-bold tracking-normal">
        Налаштування
      </h3>
      <div class="flex flex-col gap-5">
        <Switch
          checked={showWatchButton()}
          onClick={() => {
            !showWatchButton()
              ? watchButtonState.setValue(true)
              : watchButtonState.setValue(false);
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
            !showAniButtons()
              ? aniButtonsState.setValue(true)
              : aniButtonsState.setValue(false);
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
            !showAniBackground()
              ? aniBackState.setValue(true)
              : aniBackState.setValue(false);
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
      </div>
      <div class="flex items-center justify-center text-xs text-[#5C5C5C] gap-1">
        <a
          href="https://github.com/rosset-nocpes/hikka-features"
          class="font-bold"
        >
          GitHub
        </a>
        <a>•</a>v{version}
      </div>
    </div>
  );
}

export default App;
