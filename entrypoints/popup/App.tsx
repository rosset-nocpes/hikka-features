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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

function App() {
  return (
    <>
      <style>{`:root { background-color: black; }`}</style>
      <div class="dark bg-black text-white p-[30px] w-[400px] flex flex-col gap-7 font-inter font-semibold rounded-none">
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
          <a>•</a>v{version}
        </div>
      </div>
    </>
  );
}

export default App;
