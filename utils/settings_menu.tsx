function settingsMenu() {
  const settings_menu = document.querySelector(".order-1 > div:nth-child(1)");

  render(
    () => (
      <Transition name="slide-fade">
        {showSettings() && (
          <div
            id="settings-menu"
            style="background: #0e0c10;border-width: 1px;border-radius: 10px;padding: 10px;"
          >
            <label id="optionSetting">
              <input
                id="aniBToggle"
                type="checkbox"
                checked={showAniBackground()}
                onClick={() => {
                  !localStorage.getItem("aniBackState")
                    ? localStorage.setItem("aniBackState", true)
                    : localStorage.setItem("aniBackState", false);
                  toggleAniBackground(!showAniBackground());
                }}
              />
              AniBackground (Experimantal)
            </label>
          </div>
        )}
      </Transition>
    ),
    settings_menu
  );
}
