import { createSignal } from "solid-js";
import solidLogo from "@/assets/solid.svg";
import wxtLogo from "/hikka-features.svg";
import { aniBackState } from "@/utils/storage";
import "./App.css";

const [showAniBackground, toggleAniBackground] = createSignal(
  await aniBackState.getValue()
);

function App() {
  return (
    <>
      <h2>Settings</h2>
      <label>
        <input
          type="checkbox"
          checked={showAniBackground()}
          onClick={() => {
            !showAniBackground()
              ? aniBackState.setValue(true)
              : aniBackState.setValue(false);
            toggleAniBackground(!showAniBackground());
          }}
        />
        AniBackground
      </label>
    </>
  );
}

export default App;
