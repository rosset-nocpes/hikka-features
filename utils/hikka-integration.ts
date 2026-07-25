import { revokeConvexSession } from './convex-client';

export async function Login() {
  await browser.runtime.sendMessage({ type: 'login' });
}

export async function Logout() {
  await revokeConvexSession();
  useSettings.getState().setSettings({ richPresence: false });
}

export async function getUserData() {
  return useSettings.getState().userData;
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
