import { createSignal } from "solid-js";
import solidLogo from "@/assets/solid.svg";
import wxtLogo from "/hikka-features.svg";
import "./App.css";

const [showAniBackground, toggleAniBackground] = createSignal(
  await storage.getItem("local:aniBackState")
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
              ? storage.setItem<boolean>("local:aniBackState", true)
              : storage.setItem<boolean>("local:aniBackState", false);
            toggleAniBackground(!showAniBackground());
          }}
        />
        AniBackground
      </label>
    </>
  );
}

export default App;
