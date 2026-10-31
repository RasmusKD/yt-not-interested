const box = document.getElementById("shorts");

chrome.storage.sync.get("showInShorts", (stored) => {
  box.checked = stored.showInShorts !== false;
});
box.addEventListener("change", () => {
  chrome.storage.sync.set({ showInShorts: box.checked });
});
