export async function Login() {
  const user = (await browser.runtime.sendMessage({ type: 'login' })) as
    | UserDataV2
    | undefined;
  if (!user) throw new Error('Не вдалося завершити вхід через hikka.io');
  return user;
}

export async function Logout() {
  await browser.runtime.sendMessage({ type: 'logout' });
  useSettings.getState().setSettings({ richPresence: false });
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
