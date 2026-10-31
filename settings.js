// The page scripts run in YouTube's world, without extension APIs, so the setting reaches the
// stylesheet through an attribute on the root element.
const apply = (showInShorts) => {
  document.documentElement.dataset.ytniShorts = showInShorts === false ? "off" : "on";
};

chrome.storage.sync.get("showInShorts", (stored) => apply(stored.showInShorts));
chrome.storage.onChanged.addListener((changes) => {
  if (changes.showInShorts) apply(changes.showInShorts.newValue);
});
