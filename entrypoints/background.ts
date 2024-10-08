export default defineBackground(() => {
  browser.webNavigation.onHistoryStateUpdated.addListener(async (details) => {
    if (!details.transitionQualifiers.includes("forward_back")) {
      browser.tabs.sendMessage(details.tabId, { type: "page-rendered" });
    }
  });

  browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.type) {
      case "login":
        const auth_url = `https://hikka.io/oauth/?reference=${CLIENT_REFERENCE}&scope=${encodeURIComponent(
          NEEDED_SCOPES.join(",")
        )}`;

        browser.identity
          .launchWebAuthFlow({
            interactive: true,
            url: auth_url,
          })
          .then((response_url) => {
            const params = new URLSearchParams(response_url.split("?")[1]);

            hikkaSecret.setValue({
              secret: String(params.get("secret")),
              expiration: Number(params.get("expiration")),
            });

            getUserData().then((r) => {
              userData.setValue({
                username: r["username"],
                avatar: r["avatar"],
              });
            });
          });

        break;

      case "rich-presence-check":
        browser.tabs
          .query({ url: "https://hikka.io/anime/*-*" })
          .then((tabs) => {
            browser.tabs.sendMessage(sender.tab!.id!, {
              type: "rich-presence-reply",
              action: request.action,
              tabs_count: tabs.length,
            });
          });

        break;
    }
  });
});
