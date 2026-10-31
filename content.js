// Adds a button to each video card that hands the card's Not interested command to YouTube's own
// command handler, the code its menu entry runs, so the request and the "removed" card are YouTube's.
(() => {
  const MENUS = [
    ".ytLockupMetadataViewModelMenuButton",
    "ytm-shorts-lockup-view-model [class*='MetadataMenu']",
    "ytd-video-renderer ytd-menu-renderer",
    "ytd-compact-video-renderer ytd-menu-renderer",
    "ytd-rich-grid-media ytd-menu-renderer",
    "ytd-grid-video-renderer ytd-menu-renderer",
    "ytd-reel-video-renderer #right-controls",
  ].join(",");
  const PLAYER = "ytd-reel-video-renderer";
  const CARDS = [
    PLAYER,
    "yt-lockup-view-model",
    "ytm-shorts-lockup-view-model",
    "ytd-video-renderer",
    "ytd-compact-video-renderer",
    "ytd-grid-video-renderer",
    "ytd-rich-item-renderer",
  ].join(",");
  // The geometry of YouTube's circle_slash icon, as centre lines so the weight is set in CSS.
  const ICON = "M12 2a10 10 0 100 20 10 10 0 000-20ZM4.25 7.53l15.5 8.94";
  // The classes of the ⋮ button, which carry YouTube's hover and press colours for each theme.
  const YOUTUBE_BUTTON = [
    "ytSpecButtonShapeNextHost",
    "ytSpecButtonShapeNextText",
    "ytSpecButtonShapeNextMono",
    "ytSpecButtonShapeNextSizeM",
    "ytSpecButtonShapeNextIconButton",
  ].join(" ");
  // The first is the class of the ⋮ button's slot, which owns its hover circle and mouse handling.
  const PLAYER_BUTTON = [
    "ytdShortsPlayerControlsMenuButton",
    "ytSpecButtonShapeNextHost",
    "ytSpecButtonShapeNextText",
    "ytSpecButtonShapeNextOverlay",
    "ytSpecButtonShapeNextSizeL",
    "ytSpecButtonShapeNextIconButton",
  ].join(" ");
  const SVG = "http://www.w3.org/2000/svg";
  const PREFIX = "ytni";
  const SWAP_DEADLINE_MS = 1500;

  // Lockup cards keep their data behind an accessor on componentProps; on those elements
  // .data is an unrelated symbol.
  function cardData(el) {
    const props = el.componentProps?.data;
    if (typeof props === "function") return props();
    return props ?? el.data ?? el.__data?.data;
  }

  // YouTube files the swap under the endpoint's contentId, so a command without one sends the
  // feedback but leaves the card as it was. Shorts cards carry the id on their watch command.
  function withContentId(command, data) {
    const endpoint = command.feedbackEndpoint;
    const contentId =
      endpoint.contentId ??
      data.contentId ??
      data.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId;
    return { ...command, feedbackEndpoint: { ...endpoint, contentId } };
  }

  // The Shorts player's entry sends this same command, then asks for an optional reason in a sheet
  // that only reason answers lead on from. Moving on is the action those answers carry, so it runs
  // once YouTube has taken the feedback, and no reason is claimed for the user.
  function withNextShort(command) {
    const next = { reelNavigateCommand: { destination: "REEL_NAVIGATION_DESTINATION_NEXT" } };
    return { ...command, feedbackEndpoint: { ...command.feedbackEndpoint, actions: [next] } };
  }

  // On the page, not the clipboard: YouTube can refuse clipboard access, and a failure
  // report has to survive that.
  function showReport(text) {
    console.warn("[ytni]", text);
    document.querySelector(`.${PREFIX}-report`)?.remove();
    const report = document.createElement("textarea");
    report.className = `${PREFIX}-report`;
    report.readOnly = true;
    report.value = text;
    document.body.append(report);
    report.select();
    // Deferred: removing a focused element fires blur, and blur must not remove it mid-removal.
    report.addEventListener("blur", () => queueMicrotask(() => report.remove()));
  }

  function onClick(event, card, button) {
    event.preventDefault();
    event.stopPropagation();
    const data = cardData(card);
    const hit = globalThis.ytniFind(data);
    if (!hit) {
      const report = JSON.stringify(
        { error: "no token", card: card.tagName, menu: globalThis.ytniDescribe(data) },
        null,
        1,
      );
      button.dataset.state = "error";
      button.title = "No token found";
      showReport(report);
      return;
    }
    button.dataset.state = "busy";
    const inPlayer = card.matches(PLAYER);
    const command = inPlayer ? withNextShort(hit.command) : withContentId(hit.command, data);
    const startUrl = location.href;
    try {
      document.querySelector("ytd-app").handleCommandWithCommandHandler(command, card);
    } catch (err) {
      const report = `send failed: ${err.message ?? err}`;
      button.dataset.state = "error";
      button.title = report;
      showReport(report);
      return;
    }
    if (inPlayer) {
      setTimeout(() => {
        button.dataset.state = "";
        if (location.href !== startUrl) return;
        button.dataset.state = "error";
        button.title = "Sent, but YouTube did not move to the next Short";
        showReport(
          JSON.stringify(
            {
              error: "sent, short not skipped",
              commandKeys: Object.keys(command),
              endpointKeys: Object.keys(command.feedbackEndpoint),
            },
            null,
            1,
          ),
        );
      }, SWAP_DEADLINE_MS);
      return;
    }
    // The swap replaces the card's contents, button included, or hides them. Undo can bring them
    // back before the deadline, so a swap is recorded when it happens, not judged at the end.
    let swapped = false;
    const watcher = new ResizeObserver(() => {
      swapped ||= !button.isConnected || !button.checkVisibility();
    });
    watcher.observe(button);
    setTimeout(() => {
      watcher.disconnect();
      button.dataset.state = "";
      if (swapped || !button.isConnected || !button.checkVisibility()) return;
      button.dataset.state = "error";
      button.title = "Sent, but YouTube did not swap this card";
      showReport(
        JSON.stringify(
          {
            error: "sent, card not swapped",
            card: card.tagName,
            contentId: Boolean(command.feedbackEndpoint.contentId),
            commandKeys: Object.keys(command),
            endpointKeys: Object.keys(command.feedbackEndpoint),
            actions: command.feedbackEndpoint.actions?.map((a) => Object.keys(a)) ?? null,
          },
          null,
          1,
        ),
      );
    }, SWAP_DEADLINE_MS);
  }

  function makeButton(card) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `${PREFIX}-button ${card.matches(PLAYER) ? PLAYER_BUTTON : YOUTUBE_BUTTON}`;
    // Inline like the ⋮ button's own, so only the slot's hover circle shows, not the class's too.
    if (card.matches(PLAYER)) button.style.backgroundColor = "transparent";
    button.title = "Not interested";
    button.setAttribute("aria-label", "Not interested");
    // Built node by node: YouTube's Trusted Types policy refuses innerHTML.
    const svg = document.createElementNS(SVG, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(SVG, "path");
    path.setAttribute("d", ICON);
    svg.append(path);
    button.append(svg);
    button.addEventListener("click", (event) => onClick(event, card, button));
    return button;
  }

  // Cached per data object, because every page mutation rescans every card. Search results and
  // signed-out pages have no Not interested entry, so a card is only offered what its menu holds.
  const offered = new WeakMap();

  function offersNotInterested(data) {
    if (!data) return false;
    if (!offered.has(data)) offered.set(data, Boolean(globalThis.ytniFind(data)));
    return offered.get(data);
  }

  // YouTube reuses card elements for other videos, so a button can also have to go again.
  function decorate(menu) {
    const card = menu.closest(CARDS);
    if (!card) return;
    const existing = menu.querySelector(`:scope > .${PREFIX}-button`);
    const wanted = offersNotInterested(cardData(card));
    if (wanted === Boolean(existing)) return;
    card.classList.toggle(`${PREFIX}-card`, wanted);
    menu.classList.toggle(`${PREFIX}-menu`, wanted);
    if (wanted) menu.append(makeButton(card));
    else existing.remove();
  }

  const scan = () => document.querySelectorAll(MENUS).forEach(decorate);

  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      scan();
    });
  }).observe(document.documentElement, { childList: true, subtree: true });
  // A reused card can take a new video's data without a child list change, and list cards only
  // show the button on hover, so the hover settles what that card offers.
  document.addEventListener(
    "mouseover",
    (event) => event.target.closest?.(CARDS)?.querySelectorAll(MENUS).forEach(decorate),
    { passive: true },
  );
  scan();
})();
