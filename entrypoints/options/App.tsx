import { createSignal } from "solid-js";
import { aniBackState } from "@/utils/storage";
import HikkaFLogoSmall from "/hikka-features-small.svg";
import "../app.css";
import {
  Switch,
  SwitchControl,
  SwitchLabel,
  SwitchThumb,
} from "@/components/ui/switch";

const [showAniBackground, toggleAniBackground] = createSignal(
  await aniBackState.getValue()
);

function App() {
  return (
    <div class="dark bg-black text-white p-2 items-center h-screen">
      <h3 class="flex justify-between items-center font-display text-lg font-bold tracking-normal pb-4">
        Налаштування
      </h3>
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
        <SwitchLabel>Обкладинка аніме</SwitchLabel>
        <SwitchControl>
          <SwitchThumb />
        </SwitchControl>
      </Switch>
    </div>
  );
}

export default App;
