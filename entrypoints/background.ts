export default defineBackground(() => {
  // const lastPageState: { [key: number]: string } = {};

  // TODO: send message and wait for response

  browser.webNavigation.onHistoryStateUpdated.addListener((details) => {
    const { tabId, url } = details;

    // lastPageState[tabId] = url;
    browser.tabs.sendMessage(tabId, { type: "page-rendered" });
  });

  // browser.tabs.onRemoved.addListener((tabId) => {
  //   delete lastPageState[tabId];
  // });
});
