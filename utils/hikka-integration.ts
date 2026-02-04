export async function Login() {
  browser.runtime.sendMessage(undefined, { type: 'login' });
}

export async function Logout() {
  const { setSettings } = useSettings.getState();

  setSettings({
    richPresence: false,
    userData: undefined,
    hikkaSecret: undefined,
  });
}

export async function getUserData() {
  const { hikkaSecret } = useSettings.getState();
  if (!hikkaSecret) return;

  return await (
    await fetch('https://api.hikka.io/user/me', {
      headers: { auth: hikkaSecret.secret },
    })
  ).json();
}

export async function EditDesc(description: string) {
  const { hikkaSecret } = useSettings.getState();
  if (!hikkaSecret) return;

  await fetch('https://api.hikka.io/settings/description', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      auth: hikkaSecret.secret,
    },
    body: JSON.stringify({
      description: description,
    }),
  });
}

export async function actionRichPresence(action: 'check' | 'remove') {
  const { richPresence } = useSettings.getState();

  if (richPresence) {
    browser.runtime.sendMessage({
      type: 'rich-presence-check',
      action: action,
    });
  }
}
