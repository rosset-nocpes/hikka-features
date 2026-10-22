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
`FIREFOX_EXTENSION_REDIRECT_URI` on the backend.

The background worker owns the account session (`utils/convex-session.ts`).
Refresh tokens rotate on every use, so content scripts and the popup never
refresh on their own: they call `accountQuery`/`accountMutation`, which forward
the request to the background. Public functions (`watch:resolve`,
`catalog:get`, `editor:suggest`) are called directly. Watch together keeps a
live WebSocket connection per tab (`acquireLiveClient`), shared by the room,
the invite toasts, the friend list and the homepage's "Друзі дивляться" block
until the last of them releases it; the background only lends it short-lived
access tokens and still does every refresh.

The "Друзі дивляться" block joins hikka.io's homepage widgets and its layout
dialog (`features/friends-activity`). hikka.io stores the layout in the account
and accepts only its own widgets, so the block's place is kept in the
extension's settings, as the site widgets right before and after it.

## Extension/backend compatibility

The package version and backend API protocol are intentionally separate. The
current protocol is declared in `utils/compatibility.ts`; only increment it for
an incompatible Convex contract. Existing function names remain the protocol 1
contract, and future breaking contracts must use new function names so both can
run against the same database during rollout.

Breaking backend changes never force an update. Browsers update the extension
on their own, so the backend serves the old and the new contract side by side
until nobody uses the old one:

1. Add the new contract under new function names (e.g. `watch:resolveV2`),
   leaving the old functions as they are, and deploy the backend.
2. Point `utils/convex-api.ts` at the new names, increment
   `EXTENSION_API_PROTOCOL`, add it to `supportedProtocols` in Convex, and
   publish the extension.
3. Every install reports its version and protocol once a day
   (`compatibility:report`, an anonymous count). Once
   `compatibility:usage` shows no recent installs on the old protocol, delete
   the old functions and drop the protocol from `supportedProtocols`.

Additive changes (new functions, optional arguments, extra result fields) need
none of this: deploy the backend, then publish the extension.

`utils/convex-api.ts` mirrors the backend's functions by hand. `bun run
check:contract` type-checks it against `../features-backend`'s generated API
and lists every function whose name, kind, arguments or result disagree. It
must pass for both the released and the new extension before a backend
deploy, and for the current one before deleting old functions.

As a safety net, the background checks `compatibility:get` on startup and
hourly, and any context checks again (at most once a minute) when a Convex
call fails with anything but a `ConvexError`. If Convex reports the build as
unsupported, calls fail with `EXTENSION_UPDATE_REQUIRED`, the toolbar icon
shows a red badge, the popup explains why, and Chrome is asked to fetch the
update it would install anyway. Users are never sent to the store.

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
