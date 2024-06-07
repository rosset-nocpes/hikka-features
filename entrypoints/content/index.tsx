import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import "./style.css";
import aniButtons from "@/utils/ani-buttons";
import aniBackground from "@/utils/ani-background";
import NextEditURL from "@/utils/next-edit-url";
// import UCharURL from "@/utils/u-char-url";
import watchButton from "@/utils/watchButton";

export default defineContentScript({
  matches: ["https://hikka.io/*"],
  async main() {
    let url: string;
    const params = new URLSearchParams(document.location.search);

    const [getPreviousCreatingEdit, setPreviousCreatingEdit] = [
      () => params.get("previousCreatingEdit") !== null,
      (input: boolean) => {
        input && !getPreviousCreatingEdit()
          ? (params.append("previousCreatingEdit", "true"),
            history.replaceState(
              null,
              null!,
              document.location.href.split("?")[0] + "?" + params.toString()
            ))
          : null;
      },
    ];

    // const [getPreviousAnimeSlug, setPreviousAnimeSlug] = [
    //   () => storage.getItem("local:previousAnimeSlug"),
    //   (input: string) => storage.setItem("local:previousAnimeSlug", input),
    // ];

    // Only for edit page!
    const isModerator = () =>
      document.evaluate(
        "/html/body/main/div/div[1]/div/div[1]/div[2]",
        document,
        null,
        XPathResult.BOOLEAN_TYPE,
        null
      ).booleanValue;

    // (await getPreviousAnimeSlug()) == "" ? setPreviousAnimeSlug("") : "";

    browser.runtime.onMessage.addListener(async function (request) {
      if (request.type === "page-rendered") {
        // TODO: make something with this removing
        const features = document.querySelectorAll(".hikka-features");
        features.forEach((e) => e.remove());

        const split_path = document.location.pathname.split("/");
        const path = split_path[1];
        const isHomepage = document.location.pathname == "/";

        // path == "anime" ? setPreviousAnimeSlug(split_path[2]) : null;

        switch (path) {
          case "anime":
            const mal_id = document.head.querySelector(
              "[name=mal-id][content]"
            )!.content;

            if (split_path.length === 3) {
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
              aniButtons(anime_data, info_block);
            }

            // aniBackground
            aniBackground(mal_id);

            if (
              document.head.querySelectorAll("[name=anime-mal-id][content]")
                .length === 0
            ) {
              document.head.insertAdjacentHTML(
                "beforeend",
                `<meta name="anime-mal-id" content="${mal_id}">`
              );
            } else if (
              mal_id !==
              document.head.querySelector("[name=anime-mal-id][content]")!
                .content
            ) {
              document.head.querySelector(
                "[name=anime-mal-id][content]"
              )!.content = mal_id;
            }

            break;
          case "edit":
            if (split_path.length === 3) {
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

              // ani-buttons on edit page
              if (document.querySelectorAll("#ani-buttons").length == 0) {
                const info_block = document.querySelector(
                  `div.gap-12:nth-child(2) > div:nth-child(${
                    creatingEdit ? 1 : 2
                  })`
                )!;

                aniButtons(data, info_block, true);
              }

              // next-edit-button;
              if (
                !creatingEdit &&
                (await getEditInfo()).status === "pending" &&
                !getPreviousCreatingEdit() &&
                isModerator()
              ) {
                const [getNextEditButton, toggleNextEditButton] =
                  createSignal(true);

                render(
                  () => (
                    <button
                      id="next-edit-button"
                      class="inline-flex gap-2 items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 border border-secondary/60 bg-secondary/30 hover:bg-secondary/60 hover:text-secondary-foreground h-12 px-4 py-2 hikka-features"
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

              switch (content_type) {
                case "anime":
                  aniBackground(data.mal_id);
                  break;
                case "character":
                  aniBackground(
                    document.head.querySelector("[name=anime-mal-id][content]")
                      ?.content ||
                      (
                        await (
                          await fetch(
                            `https://api.hikka.io/characters/${slug}/anime`
                          )
                        ).json()
                      ).list[0].anime.mal_id
                  );
                  break;
              }

              // u-char-button
              //   if (
              //     !creatingEdit &&
              //     getPreviousCreatingEdit() &&
              //     (content_type === "character" || content_type === "person")
              //   ) {
              //     const [uCharDisabled, toggleUCharDisabled] = createSignal(true);
              //     render(
              //       () => (
              //         <button
              //           id="u-char-button"
              //           class="features-button hikka-features"
              //           disabled={uCharDisabled()}
              //           onClick={() => window.open(url, "_self")}
              //         >
              //           <span class="tabler--circle-arrow-right-filled"></span>
              //         </button>
              //       ),
              //       document.querySelector("#breadcrumbs")!
              //     );

              //     !getPreviousCreatingEdit()
              //       ? (url = await UCharURL(
              //           slug,
              //           content_type,
              //           await getPreviousAnimeSlug()
              //         ))
              //       : null;
              //     url ? toggleUCharDisabled(!uCharDisabled()) : null;
              //   } else if (
              //     creatingEdit &&
              //     (content_type === "character" || content_type === "person")
              //   ) {
              //     url = await UCharURL(
              //       slug,
              //       content_type,
              //       await getPreviousAnimeSlug()
              //     );
              //   }

              // setPreviousCreatingEdit(creatingEdit);
              // } else if (
              //   (split_path.length == 3 &&
              //     path !== "edit" &&
              //     path !== "characters" &&
              //     path !== "people" &&
              //     !getPreviousCreatingEdit()) ||
              //   (split_path.length == 2 && path === "edit") ||
              //   isHomepage
              // ) {
              //   setPreviousAnimeSlug("");
              // }
              break;
            }
          case "characters":
            const anime_mal_id = document.head.querySelectorAll(
              "[name=anime-mal-id][content]"
            );

            if (anime_mal_id.length !== 0) {
              aniBackground(anime_mal_id[0].content);
            } else {
              const anime_slug = document.body
                .querySelector("a.mt-1.truncate")!
                .href.split("/")[4];

              const first_anime_mal_id = await (
                await fetch(`https://api.hikka.io/anime/${anime_slug}`)
              ).json();

              aniBackground(first_anime_mal_id["mal_id"]);
            }

            break;
        }
      }
    });
  },
});
