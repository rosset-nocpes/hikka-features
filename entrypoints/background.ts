export default defineBackground(() => {
  browser.webNavigation.onHistoryStateUpdated.addListener(async (details) => {
    if (!details.transitionQualifiers.includes("forward_back")) {
      browser.tabs.sendMessage(details.tabId, { type: "page-rendered" });
    }
  });
});
