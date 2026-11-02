// The page scripts run in YouTube's world, without extension APIs, so the settings reach them
// and the stylesheet through attributes on the root element.
const ROOT = document.documentElement.dataset;
const APPLY = {
  showInShorts: (value) => (ROOT.ytniShorts = value === false ? "off" : "on"),
  hotkey: (value) => (ROOT.ytniHotkey = typeof value === "string" ? value : ""),
  placement: (value) => (ROOT.ytniPlace = value === "below" ? "below" : "beside"),
};

chrome.storage.sync.get(Object.keys(APPLY), (stored) => {
  for (const [key, apply] of Object.entries(APPLY)) apply(stored[key]);
});
chrome.storage.onChanged.addListener((changes) => {
  for (const [key, change] of Object.entries(changes)) APPLY[key]?.(change.newValue);
});
