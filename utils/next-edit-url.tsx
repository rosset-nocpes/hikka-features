async function fetchPendingEdits(page: number, sort: string[]) {
  const response = await fetch(
    `https://api.hikka.io/edit/list?page=${page}&size=15`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sort,
        status: "pending",
        slug: "",
      }),
    }
  );
  return response.json();
}

export default async function NextEditURL(edit_id: number) {
  const params = new URLSearchParams(document.location.search);
  const sortDirection =
    params.get("reverse") !== null ? "created:asc" : "created:desc";

  const pendingEdits = await fetchPendingEdits(1, [sortDirection]);

  if (pendingEdits.pagination.total === 0) {
    return;
  } else {
    const first_edit_pos = pendingEdits["list"]
      .map((e) => e.edit_id)
      .indexOf(edit_id);
    if (first_edit_pos === -1) {
      for (let i = 2; i <= pendingEdits.pagination.pages; i++) {
        const { list } = await fetchPendingEdits(i, [sortDirection]);

        const found_edit_pos = list.map((e) => e.edit_id).indexOf(edit_id);
        // console.log(list);
        console.log(found_edit_pos);

        if (found_edit_pos != -1) {
          if (
            found_edit_pos + 1 == list.length &&
            pendingEdits.pagination.pages == i
          ) {
            params.get("reverse") === null
              ? params.set("reverse", "true")
              : params.delete("reverse");
            history.replaceState(
              null,
              "",
              `${document.location.pathname}${
                params.toString() ? `?${params.toString()}` : ""
              }`
            );
            NextEditURL(edit_id);
          } else if (found_edit_pos + 1 == list.length) {
            const { list } = await fetchPendingEdits(i + 1, [sortDirection]);
            return `https://hikka.io/edit/${list[0].edit_id}${
              params.toString() ? `?${params.toString()}` : ""
            }`;
          } else {
            return `https://hikka.io/edit/${list[found_edit_pos + 1].edit_id}${
              params.toString() ? `?${params.toString()}` : ""
            }`;
          }
        }
      }
    } else if (first_edit_pos + 1 == pendingEdits["list"].length) {
      params.get("reverse") === null
        ? params.set("reverse", "true")
        : params.delete("reverse");
      history.replaceState(
        null,
        "",
        `${document.location.pathname}${
          params.toString() ? `?${params.toString()}` : ""
        }`
      );
    } else {
      return `https://hikka.io/edit/${
        pendingEdits["list"][first_edit_pos + 1].edit_id
      }${params.toString() ? `?${params.toString()}` : ""}`;
    }
  }
}
