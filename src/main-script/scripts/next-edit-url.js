/* eslint-disable no-undef */
export default async function NextEditURL(edit_id) {
  const pending_edits = await (
    await fetch('https://api.hikka.io/edit/list?page=1&size=100', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'pending',
        slug: '',
      }),
    })
  ).json();

  if (pending_edits['pagination']['total'] != 0) {
    for (const [i, elem] of pending_edits['list'].entries()) {
      if (elem['edit_id'] == edit_id) {
        return `https://hikka.io/edit/${pending_edits['list'][i + 1]['edit_id']}`;
      }
    }
  }
}
