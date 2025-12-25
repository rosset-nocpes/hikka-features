import aniBackground from '../modules/ani-background';
import aniButtons from '../modules/ani-buttons';

const edit_page = async () => {
  const split_path = document.location.pathname.split('/'); // still needed for edit logic
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
      await (await fetch(`https://api.hikka.io/edit/${split_path[2]}`)).json();

    const content_type = creatingEdit
      ? edit_info.get('content_type')
      : edit_info.content.data_type;

    const editSlug = creatingEdit // 'slug' is already defined from the store
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
        }/${editSlug}`,
      )
    ).json();

    // ani-buttons on edit page
    const info_block = document.querySelector(
      `div.gap-12:nth-child(2) > section:nth-child(${creatingEdit ? 1 : 2})`,
    )!;

    (await aniButtons('last', true, info_block, data))?.mount();

    // aniBackground
    switch (content_type) {
      case 'anime':
        (await aniBackground(data.mal_id, 'anime'))?.mount();
        break;
      case 'manga':
      case 'novel':
        (await aniBackground(data.mal_id, 'manga'))?.mount();
        break;
      case 'character':
        {
          const haveAnime = data.anime_count !== 0;

          (
            await aniBackground(
              usePageStore.getState().saved_mal_id
                ? usePageStore.getState().saved_mal_id
                : await (
                    await (
                      await fetch(
                        `https://api.hikka.io/${
                          haveAnime ? 'anime' : 'manga'
                        }/${
                          (
                            await (
                              await fetch(
                                `https://api.hikka.io/characters/${editSlug}/${
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
        }
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
    //           class="inline-flex gap-2 items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 border border-secondary/60 bg-secondary/30 hover:bg-secondary/60 hover:text-secondary-foreground h-12 px-4 py-2 hikka-features"
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
    document.head
      .querySelectorAll('[name=previous-creating-edit][content]')
      .forEach((e) => e.remove());

    usePageStore.getState().clearMALId();
  }

  // actionRichPresence("remove");
};
