/* eslint-disable no-undef */
export default async function NextEditURL(edit_id: any) {
  const pending_edits = await (
    await fetch("https://api.hikka.io/edit/list?page=1&size=100", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sort: [
          (await NextEditURLReverse.getValue())
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
                (await NextEditURLReverse.getValue())
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
        console.log(j + 1 > list.length - 1);
        if (j + 1 > list.length - 1) {
          await NextEditURLReverse.setValue(
            !(await NextEditURLReverse.getValue())
          );
          return NextEditURL(edit_id);
        }
        if (elem["edit_id"] == edit_id) {
          return `https://hikka.io/edit/${list[j + 1]["edit_id"]}`;
        }
      }
    }
  }
}
