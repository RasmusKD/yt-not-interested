const shorts = document.getElementById("shorts");
const placement = document.getElementById("placement");
const hotkeyOn = document.getElementById("hotkey-on");
const hotkey = document.getElementById("hotkey");

// A letter or digit only: anything else is a key YouTube or the browser already gives a meaning.
const usable = (key) => /^[a-z0-9]$/i.test(key);

// The stored hotkey is the key itself, or "" for off; the box remembers the key while it is off.
chrome.storage.sync.get(["showInShorts", "placement", "hotkey", "lastHotkey"], (stored) => {
  shorts.checked = stored.showInShorts !== false;
  placement.value = stored.placement === "below" ? "below" : "beside";
  hotkeyOn.checked = usable(stored.hotkey ?? "");
  hotkey.value = (hotkeyOn.checked ? stored.hotkey : stored.lastHotkey) || "x";
});

shorts.addEventListener("change", () => chrome.storage.sync.set({ showInShorts: shorts.checked }));
placement.addEventListener("change", () => chrome.storage.sync.set({ placement: placement.value }));

function saveHotkey() {
  const key = hotkey.value.toLowerCase();
  hotkey.setCustomValidity(usable(key) ? "" : "A letter or a digit");
  if (!usable(key)) return hotkey.reportValidity();
  chrome.storage.sync.set({ hotkey: hotkeyOn.checked ? key : "", lastHotkey: key });
}
hotkeyOn.addEventListener("change", saveHotkey);
hotkey.addEventListener("input", saveHotkey);
