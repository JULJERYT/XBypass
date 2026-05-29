// background service worker
// initialises default storage values on install.
chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.local.set({
    enabled: true,
    status: 'active',
    logs: [],
    devMode: false
  });
});
