import ky from 'ky';

export async function Login() {
  const granted =
    import.meta.env.BROWSER === 'firefox'
      ? true
      : await browser.permissions.request({
          permissions: ['identity'],
          origins: ['https://api.hikka.io/*'],
        });

  if (granted) await browser.runtime.sendMessage({ type: 'login' });
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

  return ky
    .get('https://api.hikka.io/user/me', {
      headers: { auth: hikkaSecret.secret },
    })
    .json<any>();
}

export async function EditDesc(description: string) {
  const { hikkaSecret } = useSettings.getState();
  if (!hikkaSecret) return;

  await ky.put('https://api.hikka.io/settings/description', {
    headers: { auth: hikkaSecret.secret },
    json: { description },
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
