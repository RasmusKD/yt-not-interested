import { expect, test } from "bun:test";
import "./find.js";

const find = globalThis.ytniFind;
const tokenOf = (hit) => hit?.command.feedbackEndpoint.feedbackToken;

test("classic menu: picks Not interested, not the channel entry", () => {
  const data = {
    content: {
      videoRenderer: {
        menu: {
          menuRenderer: {
            items: [
              {
                menuServiceItemRenderer: {
                  icon: { iconType: "NOT_INTERESTED" },
                  serviceEndpoint: {
                    feedbackEndpoint: {
                      feedbackToken: "right",
                      actions: [{ x: { undoFeedbackEndpoint: { undoToken: "undo-right" } } }],
                    },
                  },
                },
              },
              {
                menuServiceItemRenderer: {
                  icon: { iconType: "REMOVE" },
                  serviceEndpoint: { feedbackEndpoint: { feedbackToken: "channel" } },
                },
              },
            ],
          },
        },
      },
    },
  };
  expect(tokenOf(find(data))).toBe("right");
});

test("lockup sheet: order and depth do not matter", () => {
  const entry = (image, token) => ({
    listItemViewModel: {
      leadingImage: { sources: [{ clientResource: { imageName: image } }] },
      rendererContext: {
        commandContext: {
          onTap: { innertubeCommand: { feedbackEndpoint: { feedbackToken: token } } },
        },
      },
    },
  });
  const data = {
    content: {
      lockupViewModel: {
        sheet: {
          listItems: [
            entry("SHARE", "share"),
            entry("HIDE", "right"),
            entry("REMOVE", "channel"),
          ],
        },
      },
    },
  };
  expect(tokenOf(find(data))).toBe("right");
});

test("follow-up prompts inside the entry do not hide its token", () => {
  const data = {
    listItems: [
      {
        listItemViewModel: {
          leadingImage: { sources: [{ clientResource: { imageName: "NOT_INTERESTED" } }] },
          onTap: {
            feedbackEndpoint: {
              feedbackToken: "right",
              actions: [{ followUp: { feedbackEndpoint: { feedbackToken: "tell-us-why" } } }],
            },
          },
        },
      },
    ],
  };
  expect(tokenOf(find(data))).toBe("right");
});

test("returns the whole command, so tracking params and metadata reach YouTube's handler", () => {
  const onTap = {
    clickTrackingParams: "tracking",
    commandMetadata: { webCommandMetadata: { sendPost: true } },
    feedbackEndpoint: { feedbackToken: "right", contentId: "video" },
  };
  const data = { listItems: [{ listItemViewModel: { imageName: "HIDE", onTap } }] };
  expect(find(data).command).toBe(onTap);
});

test("an entry without a token never borrows a neighbour's", () => {
  const data = {
    listItems: [
      { listItemViewModel: { icon: "NOT_INTERESTED" } },
      { listItemViewModel: { icon: "REMOVE", feedbackEndpoint: { feedbackToken: "channel" } } },
    ],
  };
  expect(find(data)).toBeNull();
});

test("the report leaves tokens out", () => {
  const data = {
    listItemViewModel: {
      title: { content: "Ikke interesseret" },
      imageName: "NOT_INTERESTED",
      feedbackEndpoint: { feedbackToken: "secret" },
    },
  };
  const report = JSON.stringify(globalThis.ytniDescribe(data));
  expect(report).not.toContain("secret");
  expect(report).toContain("Ikke interesseret");
});

test("Shorts player: the plain feedback, not a reason's", () => {
  const reason = {
    listItemViewModel: {
      rendererContext: {
        commandContext: {
          onTap: {
            serialCommand: {
              commands: [{ innertubeCommand: { feedbackEndpoint: { feedbackToken: "reason" } } }],
            },
          },
        },
      },
    },
  };
  const data = {
    reelPlayerOverlayRenderer: {
      menu: {
        menuRenderer: {
          items: [
            {
              listItemViewModel: {
                leadingImage: { sources: [{ clientResource: { imageName: "HIDE" } }] },
                rendererContext: {
                  commandContext: {
                    onTap: {
                      innertubeCommand: {
                        commandExecutorCommand: {
                          commands: [
                            { feedbackEndpoint: { feedbackToken: "plain" } },
                            {
                              showSheetCommand: {
                                content: { listViewModel: { listItems: [reason] } },
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                },
              },
            },
          ],
        },
      },
    },
  };
  expect(tokenOf(find(data))).toBe("plain");
});

test("no entry: null, never another entry's token", () => {
  expect(
    find({ a: { icon: "REMOVE", feedbackEndpoint: { feedbackToken: "channel" } } }),
  ).toBeNull();
  expect(find(undefined)).toBeNull();
});
