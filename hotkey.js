// Decides whether a key press is the user's Not interested hotkey.
(() => {
  // Typing anywhere must stay typing: search, comments, chat and any editable field.
  function isTyping(target) {
    if (!target || typeof target.closest !== "function") return false;
    return Boolean(target.closest("input, textarea, select, [contenteditable=''], [contenteditable='true']"));
  }

  // A modifier makes it someone else's shortcut, and a held key repeats, so neither counts.
  globalThis.ytniIsHotkey = (event, key) => {
    if (!key || event.repeat) return false;
    if (event.ctrlKey || event.altKey || event.metaKey) return false;
    if (isTyping(event.target)) return false;
    return event.key.toLowerCase() === key.toLowerCase();
  };
})();
