// Finds the Not interested feedback command in a card's data.
// Matches on the icon name, not the label, so it works in every UI language, and walks
// the whole object because YouTube nests it differently per card type.
(() => {
  // Lockup menus use HIDE, classic menus NOT_INTERESTED; "Don't recommend channel" is REMOVE.
  const MARKERS = new Set(["HIDE", "NOT_INTERESTED"]);
  const ENTRY_KEY = /(ItemViewModel|ItemRenderer)$/;
  const MAX_DEPTH = 40;

  function walk(node, visit, depth = 0) {
    if (depth > MAX_DEPTH || node === null || typeof node !== "object") return;
    for (const [key, value] of Object.entries(node)) {
      visit(key, value, node);
      walk(value, visit, depth + 1);
    }
  }

  // Menu entries, each with its own subtree, so one entry can never lend another its token.
  function entries(data) {
    const list = [];
    walk(data, (key, value) => {
      if (ENTRY_KEY.test(key) && value && typeof value === "object") list.push([key, value]);
    });
    return list;
  }

  function hasMarker(entry) {
    let hit = false;
    walk(entry, (_key, value) => {
      hit ||= MARKERS.has(value);
    });
    return hit;
  }

  globalThis.ytniFind = (data) => {
    for (const [, entry] of entries(data)) {
      if (!hasMarker(entry)) continue;
      // The entry's own endpoint comes first; later ones belong to its follow-up prompts.
      let command = null;
      walk(entry, (key, value, parent) => {
        if (key === "feedbackEndpoint" && value?.feedbackToken) command ??= parent;
      });
      if (command) return { command };
    }
    return null;
  };

  // Shape of a card's menu with every token left out, for reporting a card the finder missed.
  globalThis.ytniDescribe = (data) =>
    entries(data).map(([key, entry]) => {
      const icons = new Set();
      const commands = new Set();
      walk(entry, (name, value) => {
        if (name === "imageName" || name === "iconType") icons.add(value);
        if (/(Endpoint|Command)$/.test(name)) commands.add(name);
      });
      return {
        key,
        title: entry.title?.content ?? entry.text?.runs?.[0]?.text ?? null,
        icons: [...icons],
        commands: [...commands],
      };
    });
})();
