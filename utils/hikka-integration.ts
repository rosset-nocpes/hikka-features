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
