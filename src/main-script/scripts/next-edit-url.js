/* eslint-disable no-undef */
export default async function NextEditURL(edit_id) {
  const [getNextEditURLReverse, setNextEditURLReverse] = [
    () => GM_getValue('NextEditURLReverse'),
    (input) => GM_setValue('NextEditURLReverse', input),
  ];

  const pending_edits = await (
    await fetch('https://api.hikka.io/edit/list?page=1&size=100', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sort: [getNextEditURLReverse() ? 'created:asc' : 'created:desc'],
        status: 'pending',
        slug: '',
      }),
    })
  ).json();

  if (pending_edits['pagination']['total'] != 0) {
    for (let i = 1; i <= pending_edits['pagination']['pages']; i++) {
      const list = (
        await (
          await fetch(`https://api.hikka.io/edit/list?page=${i}&size=100`, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sort: [getNextEditURLReverse() ? 'created:asc' : 'created:desc'],
              status: 'pending',
              slug: '',
            }),
          })
        ).json()
      )['list'];

      for (const [j, elem] of list.entries()) {
        if (j + 1 > list.length - 1) {
          return NextEditURL(
            edit_id,
            setNextEditURLReverse(!getNextEditURLReverse()),
          );
        }
        if (elem['edit_id'] == edit_id) {
          return `https://hikka.io/edit/${list[j + 1]['edit_id']}`;
        }
      }
    }
  }
}
