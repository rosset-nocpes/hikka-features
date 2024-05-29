/* eslint-disable no-undef */
export default async function NextEditURL(edit_id: any) {
  const params = new URLSearchParams(document.location.search);

  const pending_edits = await (
    await fetch("https://api.hikka.io/edit/list?page=1&size=100", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sort: [
          JSON.parse(params.get("reverse")!) || params.get("reverse") !== null
            ? "created:asc"
            : "created:desc",
        ],
        status: "pending",
        slug: "",
      }),
    })
  ).json();

  if (pending_edits["pagination"]["total"] != 0) {
    for (let i = 1; i <= pending_edits["pagination"]["pages"]; i++) {
      const list = (
        await (
          await fetch(`https://api.hikka.io/edit/list?page=${i}&size=100`, {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sort: [
                JSON.parse(params.get("reverse")!) ||
                params.get("reverse") !== null
                  ? "created:asc"
                  : "created:desc",
              ],
              status: "pending",
              slug: "",
            }),
          })
        ).json()
      )["list"];

      for (const [j, elem] of list.entries()) {
        if (j + 1 > list.length - 1) {
          params.get("reverse") === null
            ? params.set("reverse", "true")
            : params.delete("reverse");
          history.replaceState(
            null,
            null!,
            document.location.href.split("?")[0] +
              (params.get("reverse") !== null ? "?" : "") +
              params.toString()
          );
          return NextEditURL(edit_id);
        }
        if (elem["edit_id"] == edit_id) {
          return `https://hikka.io/edit/${
            list[j + 1]["edit_id"] +
            (params.get("reverse") !== null ? "?" : "") +
            params.toString()
          }`;
        }
      }
    }
  }
}
