# [![hikka Features logo](https://github.com/user-attachments/assets/013b9522-cd69-42b3-a706-43c6d8c79f71) ![hikka Features title](https://github.com/user-attachments/assets/6c4901ae-2b47-451a-b8d9-ad1c6cbd360c)](https://hikka-features.pp.ua)

[![Chrome Web Store Badge](https://github.com/user-attachments/assets/6a406567-8cd7-42b2-9037-482c4aea41e6)](https://chromewebstore.google.com/detail/hikka-features/apjnamihmmcjbchjdfhbgmmlhbnihkhk)
[![AMO Badge](https://github.com/user-attachments/assets/119684c1-e569-44fd-a24c-56ac1aa1bb13)](https://addons.mozilla.org/en-US/firefox/addon/hikka-features/)

Plugin uses:

- [WXT](https://wxt.dev)
- [React](https://react.dev/)
- [tailwindCSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)

## Development

Copy `.env.example` to `.env` and set the Convex deployment URLs. The extension
uses `WXT_CONVEX_URL` for functions and `WXT_CONVEX_SITE_URL` for the Hikka
OAuth/session endpoints.

Register `<CONVEX_SITE_URL>/auth/hikka/callback` as the redirect URL of the
Hikka application. Configure the values returned by
`browser.identity.getRedirectURL()` as `CHROME_EXTENSION_REDIRECT_URI` and
`FIREFOX_EXTENSION_REDIRECT_URI` on the backend, and include both in
`ALLOWED_EXTENSION_REDIRECTS`.

## Extension/backend compatibility

The package version and backend API protocol are intentionally separate. The
current protocol is declared in `utils/compatibility.ts`; only increment it for
an incompatible Convex contract. Existing function names remain the protocol 1
contract, and future breaking contracts must use new function names so both can
run against the same database during rollout.

The background worker checks `compatibility:get` on startup, when Hikka loads,
and hourly. When Convex reports a newer or unsupported client, Hikka displays an
update banner and the extension asks the browser store for the new build. It
only calls `runtime.reload()` after `runtime.onUpdateAvailable` confirms that
the update has downloaded.

Release in this order:

1. Deploy additive backend support while retaining the previous protocol.
2. Publish and wait for the new extension version in every browser store.
3. Set `latestVersion` in Convex to show the update banner.
4. Later raise `minimumVersion` or remove the old protocol.

The backend command is documented in `features-backend/convex/README.md`.

```sh
# Run plugin on Chrome
$ bun dev
# or
$ bun dev:firefox

# Build script
$ bun build
# or
$ bun build:firefox

# Zip
$ bun zip
# or
$ bun zip:firefox
```
