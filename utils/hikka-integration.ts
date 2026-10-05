export async function Login() {
  const user = (await browser.runtime.sendMessage({ type: 'login' })) as
    | UserDataV2
    | undefined;
  if (!user) throw new Error('Не вдалося завершити вхід через hikka.io');
  await useSettings.persist.rehydrate();
  return user;
}

export async function Logout() {
  await browser.runtime.sendMessage({ type: 'logout' });
  await useSettings.persist.rehydrate();
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
