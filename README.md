# Not Interested Button for YouTube

A one-click Not interested button on YouTube video cards, right next to the ⋮ menu. An independent project, not affiliated with or endorsed by YouTube or Google.

The button runs the same command as the menu's own Not interested entry, so nothing is faked: YouTube sends the request and shows its normal "removed" card with Undo. There is no overlay and no clicking through the menu behind your back.

- Works on home and sidebar cards and on Shorts cards in shelves, wherever the card's ⋮ menu has Not interested
- In the full-screen Shorts player it also moves on to the next Short, and the extension's popup can turn this button off
- An optional hotkey: hover a video and press a letter of your choice, set in the popup (off by default; never fires with Ctrl, Alt or ⌘, or while you type in a field)
- The popup can also move the button from beside the ⋮ to under it
- Works in every UI language, because it matches the menu icon rather than its label
- Only asks for the `storage` permission, for these settings, and sends nothing anywhere except YouTube

The Shorts player has no Undo for this. Its menu entry sends the feedback before it asks for a reason, and the button sends that feedback and leaves the reason out. Search results have no Not interested entry, so they get no button.

## Install

1. Download `yt-not-interested.zip` from the [latest release](https://github.com/RasmusKD/yt-not-interested/releases/latest) and unzip it.
2. Open `chrome://extensions` (or `brave://extensions`) and turn on Developer mode.
3. Click Load unpacked and pick the unzipped folder.

## How it works

The content script runs in the page, reads each card's menu data and finds the entry with the `HIDE` or `NOT_INTERESTED` icon. A click passes that entry's whole command to YouTube's own command handler, with the video id the card swap is keyed on.

This relies on YouTube's internal page code and class names, which can change without notice. If a card does not swap, the button turns orange and shows a report with no tokens in it. Please paste that report into an issue.

## Develop

```bash
bun test
```

## License

MIT
