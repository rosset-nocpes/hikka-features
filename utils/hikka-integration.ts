export async function Login() {
  let r = await (
    await fetch(`https://api.hikka.io/auth/token/request/${CLIENT_REFERENCE}`, {
      body: JSON.stringify({
        scope: NEEDED_SCOPES,
      }),
    })
  ).json();

  r = await (await fetch(r["redirect_url"])).json();

  hikkaSecret.setValue(r["secret"]);
}

export async function Logout() {
  hikkaSecret.removeValue();
}

export async function getUserData() {
  if ((await hikkaSecret.getValue()) === null) {
    return;
  }

  return await (
    await fetch(`https://api.hikka.io/user/me`, {
      headers: { auth: (await hikkaSecret.getValue())! },
    })
  ).json();
}
