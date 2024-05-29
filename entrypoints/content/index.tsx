import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import "./style.css";
import aniButtons from "@/utils/ani-buttons";
import aniBackground from "@/utils/ani-background";
import NextEditURL from "@/utils/next-edit-url";
import UCharURL from "@/utils/u-char-url";
import watchButton from "@/utils/watchButton";

export default defineContentScript({
  matches: ["https://hikka.io/*"],
  async main() {
    const [showAniBackground, toggleAniBackground] = createSignal(
      storage.getItem("local:aniBackState")
    );

    let url: string;

    const [getPreviousCreatingEdit, setPreviousCreatingEdit] = [
      () => storage.getItem("local:previousCreatingEdit"),
      (input: boolean) => storage.setItem("local:previousCreatingEdit", input),
    ];

    const [getPreviousAnimeSlug, setPreviousAnimeSlug] = [
      () => storage.getItem("local:previousAnimeSlug"),
      (input: string) => storage.setItem("local:previousAnimeSlug", input),
    ];

    const setNextEditURLReverse = (input: boolean) =>
      storage.setItem("local:NextEditURLReverse", input);

    // Only for edit page!
    const isModerator = () =>
      document.evaluate(
        "/html/body/main/div/div[1]/div/div[1]/div[2]",
        document,
        null,
        XPathResult.BOOLEAN_TYPE,
        null
      ).booleanValue;

    !getPreviousCreatingEdit() ? setPreviousCreatingEdit(false) : "";
    (await getPreviousAnimeSlug()) == "" ? setPreviousAnimeSlug("") : "";
    !showAniBackground() ? storage.setItem("local:aniBackState", false) : "";

    browser.runtime.onMessage.addListener(async function (request) {
      if (request.type === "page-rendered") {
        // console.log(NextEditURLReverse.getValue());

        // TODO: make something with this removing
        const features = document.querySelectorAll(".hikka-features");
        features ? features.forEach((e) => e.remove()) : null;

        const split_path = document.location.pathname.split("/");
        const path = split_path[1];
        const isHomepage = document.location.pathname == "/";

        path == "anime" ? setPreviousAnimeSlug(split_path[2]) : null;

        // for anime page scripts
        if (split_path.length == 3 && path == "anime") {
          const anime_slug = split_path[2];

          const info_block = document.querySelector(
            "body main > .grid > .flex:nth-child(2) > .grid > div:nth-child(3) > .flex"
          )!;

          const anime_data = await (
            await fetch(`https://api.hikka.io/anime/${anime_slug}`)
          ).json();

          // Watch button
          watchButton(anime_slug);

          // aniButtons
          info_block.children[1].insertAdjacentHTML(
            "afterbegin",
            '<div id="ani-buttons" class="hikka-features" style="display: flex; justify-content: center;"></div>'
          );

          render(
            () => aniButtons(anime_data),
            info_block.children[1].firstChild!
          );

          // aniBackground
          const mal_id = anime_data.mal_id;
          aniBackground(mal_id, showAniBackground);
        } else if (split_path.length == 3 && path == "edit") {
          const creatingEdit = isNaN(parseInt(split_path[2]));

          const edit_info = creatingEdit
            ? new URLSearchParams(document.location.search)
            : await (
                await fetch(`https://api.hikka.io/edit/${split_path[2]}`)
              ).json();

          const getEditInfo = async () =>
            await (
              await fetch(`https://api.hikka.io/edit/${split_path[2]}`)
            ).json();

          const content_type = creatingEdit
            ? edit_info.get("content_type")
            : edit_info.content.data_type;

          const slug = creatingEdit
            ? edit_info.get("slug")
            : edit_info.content.slug;

          // ani-buttons on edit page
          const data = await (
            await fetch(
              `https://api.hikka.io/${
                content_type === "character"
                  ? "characters"
                  : content_type === "person"
                  ? "people"
                  : content_type
              }/${slug}`
            )
          ).json();

          const info_block = document.querySelector(
            "div.flex.flex-col.gap-4.rounded-md"
          )!;

          info_block.insertAdjacentHTML(
            "afterbegin",
            '<div id="ani-buttons" class="hikka-features" style="display: flex; justify-content: center;"></div>'
          );

          render(
            () => aniButtons(data),
            document.getElementById("ani-buttons")!
          );

          // next-edit-button;
          if (
            !creatingEdit &&
            (await getEditInfo()).status === "pending" &&
            !(await getPreviousCreatingEdit()) &&
            isModerator()
          ) {
            const [getNextEditButton, toggleNextEditButton] =
              createSignal(true);

            render(
              () => (
                <button
                  id="next-edit-button"
                  class="features-button hikka-features"
                  disabled={getNextEditButton()}
                  onClick={() => {
                    window.open(url, "_self");
                  }}
                >
                  <span class="tabler--circle-arrow-right-filled"></span>
                </button>
              ),
              document.querySelector("#breadcrumbs")!
            );

            const url = await NextEditURL(edit_info.edit_id);

            url ? toggleNextEditButton(!getNextEditButton()) : null;
          }

          // u-char-button
          if (
            !creatingEdit &&
            (await getPreviousCreatingEdit()) &&
            (content_type === "character" || content_type === "person")
          ) {
            const [uCharDisabled, toggleUCharDisabled] = createSignal(true);
            render(
              () => (
                <button
                  id="u-char-button"
                  class="features-button hikka-features"
                  disabled={uCharDisabled()}
                  onClick={() => window.open(url, "_self")}
                >
                  <span class="tabler--circle-arrow-right-filled"></span>
                </button>
              ),
              document.querySelector("#breadcrumbs")!
            );

            !(await getPreviousCreatingEdit())
              ? (url = await UCharURL(
                  slug,
                  content_type,
                  await getPreviousAnimeSlug()
                ))
              : null;
            url ? toggleUCharDisabled(!uCharDisabled()) : null;
          } else if (
            creatingEdit &&
            (content_type === "character" || content_type === "person")
          ) {
            url = await UCharURL(
              slug,
              content_type,
              await getPreviousAnimeSlug()
            );
          }

          await setPreviousCreatingEdit(creatingEdit);
        } else if (
          (split_path.length == 3 &&
            path !== "edit" &&
            path !== "characters" &&
            path !== "people" &&
            !getPreviousCreatingEdit()) ||
          (split_path.length == 2 && path === "edit") ||
          isHomepage
        ) {
          setPreviousCreatingEdit(false);
          setPreviousAnimeSlug("");
          setNextEditURLReverse(false);
        }
      }
    });
  },
});
