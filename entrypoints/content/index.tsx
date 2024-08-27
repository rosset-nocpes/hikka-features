import { createResource, createSignal } from "solid-js";
import { render } from "solid-js/web";
import "./style.css";
import aniBackground from "./modules/ani-background";
import aniButtons from "./modules/ani-buttons";
import NextEditURL from "@/utils/next-edit-url";
// import UCharURL from "@/utils/u-char-url";
import watchButton from "./modules/watchButton";
import FandubBlock from "./modules/fandub-block";
import NotionFetch from "@/utils/notion-db";
import localizedPosterButton from "./modules/localized-poster-button";

export default defineContentScript({
  matches: ["https://hikka.io/*"],
  async main() {
    const [getPreviousCreatingEdit, setPreviousCreatingEdit] = [
      () =>
        (
          document.head.querySelector(
            "[name=previous-creating-edit][content]"
          ) as HTMLMetaElement
        )?.content,
      (input: boolean) => {
        input && getPreviousCreatingEdit() === undefined
          ? document.head.insertAdjacentHTML(
              "beforeend",
              `<meta name="previous-creating-edit" content="true">`
            )
          : input && getPreviousCreatingEdit() === "false"
          ? ((document.head.querySelector(
              "[name=previous-creating-edit][content]"
            ) as HTMLMetaElement)!.content = "true")
          : null;
      },
    ];

    const [getSavedMalId, setSavedMalId] = [
      () =>
        parseInt(
          (
            document.head.querySelector(
              "[name=saved-mal-id][content]"
            ) as HTMLMetaElement
          )?.content
        ),
      (input: number) => {
        Number.isNaN(getSavedMalId())
          ? document.head.insertAdjacentHTML(
              "beforeend",
              `<meta name="saved-mal-id" content="${input}">`
            )
          : ((document.head.querySelector(
              "[name=saved-mal-id][content]"
            ) as HTMLMetaElement)!.content = input.toString());
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

        const mal_id = parseInt(
          (
            document.head.querySelector(
              "[name=mal-id][content]"
            ) as HTMLMetaElement
          )?.content
        );

        switch (path) {
          case "anime":
            if (split_path.length === 3) {
              const anime_slug = split_path[2];

              const info_block = document.querySelector(
                "body main > .grid > .flex:nth-child(2) > .grid > div:nth-child(3) > .flex"
              )!;

              const anime_data = await (
                await fetch(`https://api.hikka.io/anime/${anime_slug}`)
              ).json();

              // Watch button
              watchButton(anime_data);

              // aniButtons
              aniButtons(anime_data);

              let [getNotionData] = createResource(anime_slug, NotionFetch);
              FandubBlock(getNotionData);
              localizedPosterButton(getNotionData);
            }

            // aniBackground
            if (split_path.length >= 3) {
              aniBackground(mal_id, "anime");
              setSavedMalId(mal_id);
            } else {
              setSavedMalId(-1);
            }

            break;
          case "manga":
          case "novel":
            if (split_path.length === 3) {
              const slug = split_path[2];

              const data = await (
                await fetch(`https://api.hikka.io/${path}/${slug}`)
              ).json();

              // aniButtons
              aniButtons(data);
            }

            // aniBackground
            if (split_path.length >= 3) {
              aniBackground(mal_id, "manga");
              setSavedMalId(mal_id);
            } else {
              setSavedMalId(-1);
            }

            actionRichPresence("remove");

            break;
          case "edit":
            if (
              split_path.length === 3 ||
              (split_path.length === 4 && split_path[3] === "update")
            ) {
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
              const info_block = document.querySelector(
                `div.gap-12:nth-child(2) > div:nth-child(${
                  creatingEdit ? 1 : 2
                })`
              )!;

              aniButtons(data, info_block, true);

              // aniBackground
              switch (content_type) {
                case "anime":
                  aniBackground(data.mal_id, "anime");
                  break;
                case "manga":
                case "novel":
                  aniBackground(data.mal_id, "manga");
                  break;
                case "character":
                  const haveAnime = data.anime_count !== 0;

                  aniBackground(
                    getSavedMalId() !== -1 && !Number.isNaN(getSavedMalId())
                      ? getSavedMalId()
                      : await (
                          await (
                            await fetch(
                              `https://api.hikka.io/${
                                haveAnime ? "anime" : "manga"
                              }/${
                                (
                                  await (
                                    await fetch(
                                      `https://api.hikka.io/characters/${slug}/${
                                        haveAnime ? "anime" : "manga"
                                      }`
                                    )
                                  ).json()
                                ).list[0][haveAnime ? "anime" : "manga"].slug
                              }`
                            )
                          ).json()
                        ).mal_id,
                    haveAnime ? "anime" : "manga"
                  );
                  break;
              }

              // next-edit-button;
              if (
                !creatingEdit &&
                (await getEditInfo()).status === "pending" &&
                (getPreviousCreatingEdit() === undefined ||
                  getPreviousCreatingEdit() === "false") &&
                isModerator()
              ) {
                if (
                  document.body.querySelectorAll("#next-edit-button").length ===
                  0
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

              setPreviousCreatingEdit(creatingEdit);
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
            } else {
              document.head.querySelectorAll(
                "[name=previous-creating-edit][content]"
              ).length !== 0
                ? setPreviousCreatingEdit(false)
                : null;

              setSavedMalId(-1);
            }

            actionRichPresence("remove");

            break;
          case "characters":
            async function first_aniBackground() {
              const source = (document.body.querySelector(
                "a.mt-1.truncate"
              ) as HTMLAnchorElement)!.href.split("/");

              const source_type = source[3] as MediaType;

              const first_source_mal_id = await (
                await fetch(`https://api.hikka.io/${source_type}/${source[4]}`)
              ).json();

              aniBackground(first_source_mal_id["mal_id"], source_type);
            }

            if (getSavedMalId() !== -1 && !Number.isNaN(getSavedMalId())) {
              (await aniBackground(getSavedMalId(), "anime")) ??
                (await aniBackground(getSavedMalId(), "manga"));
            } else {
              first_aniBackground();
            }

            actionRichPresence("remove");

            break;
          default:
            document.head.querySelectorAll(
              "[name=previous-creating-edit][content]"
            ).length !== 0
              ? setPreviousCreatingEdit(false)
              : null;

            if (
              (await richPresence.getValue()) &&
              (await userData.getValue())?.["description"]
            ) {
              browser.runtime.sendMessage(undefined, {
                type: "rich-presence-check",
              });
            }

            setSavedMalId(-1);
            actionRichPresence("remove");

            break;
        }
      } else if (request.type === "rich-presence-reply") {
        if (
          request.tabs_count === 0 &&
          request.action === "remove" &&
          (await userData.getValue())?.["description"]
        ) {
          EditDesc((await userData.getValue())!["description"]);
          let r = await userData.getValue();
          delete r!["description"];
          userData.setValue(r);
        }
      }
    });
  },
});
