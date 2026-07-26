import { revokeConvexSession } from './convex-client';

type LoginResponse = {
  authenticated: true;
  refreshToken: string;
  user: UserDataV2;
};

export async function Login() {
  const response = (await browser.runtime.sendMessage({
    type: 'login',
  })) as LoginResponse | undefined;
  if (!response?.authenticated) {
    throw new Error('Не вдалося завершити вхід через hikka.io');
  }
  useSettings.getState().setSettings({
    convexSession: { refreshToken: response.refreshToken },
    userData: response.user,
  });
  return response.user;
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
