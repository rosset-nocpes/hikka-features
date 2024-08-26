export async function Login() {
  browser.runtime.sendMessage(undefined, { type: "login" });
}

export async function Logout() {
  richPresence.removeValue();
  userData.removeValue();
  hikkaSecret.removeValue();
}

export async function getUserData() {
  if ((await hikkaSecret.getValue()) === null) {
    return;
  }

  return await (
    await fetch("https://api.hikka.io/user/me", {
      headers: { auth: (await hikkaSecret.getValue())! },
    })
  ).json();
}

export async function EditDesc(description: string) {
  await fetch("https://api.hikka.io/settings/description", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      auth: (await hikkaSecret.getValue())!,
    },
    body: JSON.stringify({
      description: description,
    }),
  });
}
