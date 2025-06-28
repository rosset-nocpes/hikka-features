import { QueryClient } from '@tanstack/react-query';
import '../app.css';
import aniBackground from './modules/ani-background';
// import UCharURL from "@/utils/u-char-url";
import aniButtons from './modules/ani-buttons';
import devButtons from './modules/dev-buttons';
import fandubBlock from './modules/fandub-block';
import localizedPosterButton from './modules/localized-poster/localized-poster-button';
import watchButton from './modules/player/watchButton';
import readButton from './modules/reader/readButton';
import recommendationBlock from './modules/recommendation-block';

export const queryClient = new QueryClient({
  // defaultOptions: { queries: { gcTime: Infinity, staleTime: Infinity } },
});

export default defineContentScript({
  matches: ['https://hikka.io/*'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    const [getPreviousCreatingEdit, setPreviousCreatingEdit] = [
      () =>
        (
          document.head.querySelector(
            '[name=previous-creating-edit][content]',
          ) as HTMLMetaElement
        )?.content,
      (input: boolean) => {
        input && getPreviousCreatingEdit() === undefined
          ? document.head.insertAdjacentHTML(
              'beforeend',
              `<meta name="previous-creating-edit" content="true">`,
            )
          : input && getPreviousCreatingEdit() === 'false'
            ? ((document.head.querySelector(
                '[name=previous-creating-edit][content]',
              ) as HTMLMetaElement)!.content = 'true')
            : null;
      },
    ];

    const [getSavedMalId, setSavedMalId] = [
      () =>
        parseInt(
          (
            document.head.querySelector(
              '[name=saved-mal-id][content]',
            ) as HTMLMetaElement
          )?.content,
        ),
      (input: number) => {
        Number.isNaN(getSavedMalId())
          ? document.head.insertAdjacentHTML(
              'beforeend',
              `<meta name="saved-mal-id" content="${input}">`,
            )
          : ((document.head.querySelector(
              '[name=saved-mal-id][content]',
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
        '/html/body/main/div/div[1]/div/div[1]/div[2]',
        document,
        null,
        XPathResult.BOOLEAN_TYPE,
        null,
      ).booleanValue;

    // (await getPreviousAnimeSlug()) == "" ? setPreviousAnimeSlug("") : "";

    browser.runtime.onMessage.addListener(async function (request: any) {
      if ((request as any).type === 'page-rendered') {
        getComputedStyle(document.documentElement).colorScheme === 'dark'
          ? darkMode.setValue(true)
          : darkMode.setValue(false);

        const split_path = document.location.pathname.split('/');
        const path_params = new URLSearchParams(document.location.search);
        const path = split_path[1];
        const isHomepage = document.location.pathname == '/';

        // path == "anime" ? setPreviousAnimeSlug(split_path[2]) : null;

        const mal_id = parseInt(
          (
            document.head.querySelector(
              '[name=mal-id][content]',
            ) as HTMLMetaElement
          )?.content,
        );

        switch (path) {
          case 'anime':
            if (split_path.length === 3) {
              const anime_slug = split_path[2];

              const anime_data = await (
                await fetch(`https://api.hikka.io/anime/${anime_slug}`)
              ).json();

              (await devButtons(ctx, anime_data))?.mount();

              // Watch button
              (await watchButton(ctx, anime_data))?.mount();

              // aniButtons
              (await aniButtons(ctx, anime_data))?.mount();

              // recommendationBlock
              (await recommendationBlock(ctx, anime_data))?.mount();

              (await fandubBlock(ctx, anime_data))?.mount();
              (await localizedPosterButton(ctx, anime_data))?.mount();
            }

            // aniBackground
            if (split_path.length >= 3) {
              (await aniBackground(ctx, mal_id, 'anime'))?.mount();
              setSavedMalId(mal_id);
            } else {
              setSavedMalId(-1);
            }

            break;
          case 'manga':
          case 'novel':
            if (split_path.length === 3) {
              const slug = split_path[2];

              const data = await (
                await fetch(`https://api.hikka.io/${path}/${slug}`)
              ).json();

              (await devButtons(ctx, data))?.mount();

              // readerButton
              (await readButton(ctx, data.title_original))!.mount();

              // aniButtons
              (await aniButtons(ctx, data))!.mount();
            }

            // aniBackground
            if (split_path.length >= 3) {
              (await aniBackground(ctx, mal_id, 'manga'))!.mount();
              setSavedMalId(mal_id);
            } else {
              setSavedMalId(-1);
            }

            // actionRichPresence("remove");

            break;
          case 'edit':
            if (
              split_path.length === 3 ||
              (split_path.length === 4 && split_path[3] === 'update')
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
                ? edit_info.get('content_type')
                : edit_info.content.data_type;

              const slug = creatingEdit
                ? edit_info.get('slug')
                : edit_info.content.slug;

              const data = await (
                await fetch(
                  `https://api.hikka.io/${
                    content_type === 'character'
                      ? 'characters'
                      : content_type === 'person'
                        ? 'people'
                        : content_type
                  }/${slug}`,
                )
              ).json();

              // ani-buttons on edit page
              const info_block = document.querySelector(
                `div.gap-12:nth-child(2) > section:nth-child(${
                  creatingEdit ? 1 : 2
                })`,
              )!;

              (await aniButtons(ctx, data, 'last', true, info_block))?.mount();

              // aniBackground
              switch (content_type) {
                case 'anime':
                  (await aniBackground(ctx, data.mal_id, 'anime'))?.mount();
                  break;
                case 'manga':
                case 'novel':
                  (await aniBackground(ctx, data.mal_id, 'manga'))?.mount();
                  break;
                case 'character':
                  const haveAnime = data.anime_count !== 0;

                  (
                    await aniBackground(
                      ctx,
                      getSavedMalId() !== -1 && !Number.isNaN(getSavedMalId())
                        ? getSavedMalId()
                        : await (
                            await (
                              await fetch(
                                `https://api.hikka.io/${
                                  haveAnime ? 'anime' : 'manga'
                                }/${
                                  (
                                    await (
                                      await fetch(
                                        `https://api.hikka.io/characters/${slug}/${
                                          haveAnime ? 'anime' : 'manga'
                                        }`,
                                      )
                                    ).json()
                                  ).list[0][haveAnime ? 'anime' : 'manga'].slug
                                }`,
                              )
                            ).json()
                          ).mal_id,
                      haveAnime ? 'anime' : 'manga',
                    )
                  )?.mount();
                  break;
              }

              // next-edit-button;
              // if (
              //   !creatingEdit &&
              //   (await getEditInfo()).status === "pending" &&
              //   (getPreviousCreatingEdit() === undefined ||
              //     getPreviousCreatingEdit() === "false") &&
              //   isModerator()
              // ) {
              //   if (
              //     document.body.querySelectorAll("#next-edit-button").length ===
              //     0
              //   ) {
              //     const [getNextEditButton, toggleNextEditButton] =
              //       createSignal(true);

              //     render(
              //       () => (
              //         <button
              //           id="next-edit-button"
              //           class="inline-flex gap-2 items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 border border-secondary/60 bg-secondary/30 hover:bg-secondary/60 hover:text-secondary-foreground h-12 px-4 py-2 hikka-features"
              //           disabled={getNextEditButton()}
              //           onClick={() => {
              //             window.open(url, "_self");
              //           }}
              //         >
              //           <span class="tabler--circle-arrow-right-filled"></span>
              //         </button>
              //       ),
              //       document.querySelector("#breadcrumbs")!
              //     );

              //     const url = await NextEditURL(edit_info.edit_id);

              //     url ? toggleNextEditButton(!getNextEditButton()) : null;
              //   }
              // }

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
                '[name=previous-creating-edit][content]',
              ).length !== 0
                ? setPreviousCreatingEdit(false)
                : null;

              setSavedMalId(-1);
            }

            // actionRichPresence("remove");

            break;
          case 'characters':
            async function first_aniBackground() {
              const source = (document.body.querySelector(
                'a.mt-1.truncate',
              ) as HTMLAnchorElement)!.href.split('/');

              const source_type = source[3] as MediaType;
              console.log(source_type);

              const first_source_mal_id = await (
                await fetch(`https://api.hikka.io/${source_type}/${source[4]}`)
              ).json();

              (
                await aniBackground(
                  ctx,
                  first_source_mal_id['mal_id'],
                  source_type,
                )
              )?.mount();
            }

            if (getSavedMalId() !== -1 && !Number.isNaN(getSavedMalId())) {
              (await aniBackground(ctx, getSavedMalId(), 'anime'))?.mount() ??
                (await aniBackground(ctx, getSavedMalId(), 'manga'))?.mount();
            } else {
              first_aniBackground();
            }

            // actionRichPresence("remove");

            break;
          default:
            document.head.querySelectorAll(
              '[name=previous-creating-edit][content]',
            ).length !== 0
              ? setPreviousCreatingEdit(false)
              : null;

            if (
              (await richPresence.getValue()) &&
              (await userData.getValue())?.['description']
            ) {
              browser.runtime.sendMessage(undefined, {
                type: 'rich-presence-check',
              });
            }

            setSavedMalId(-1);
            actionRichPresence('remove');

            break;
        }
      }
    });
  },
});
