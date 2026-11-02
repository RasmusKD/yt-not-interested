import { expect, test } from "bun:test";
import "./hotkey.js";

const isHotkey = globalThis.ytniIsHotkey;
const field = (selector) => ({ closest: (s) => (s.split(", ").includes(selector) ? {} : null) });
const page = { closest: () => null };
const press = (key, extra = {}) => ({ key, repeat: false, target: page, ...extra });

test("the bound key fires, in either case", () => {
  expect(isHotkey(press("x"), "x")).toBe(true);
  expect(isHotkey(press("X", { shiftKey: true }), "x")).toBe(true);
});

test("no binding, another key or a repeat does not fire", () => {
  expect(isHotkey(press("x"), "")).toBe(false);
  expect(isHotkey(press("y"), "x")).toBe(false);
  expect(isHotkey(press("x", { repeat: true }), "x")).toBe(false);
});

test("a modifier leaves the press to the browser and YouTube", () => {
  for (const mod of ["ctrlKey", "altKey", "metaKey"]) {
    expect(isHotkey(press("x", { [mod]: true }), "x")).toBe(false);
  }
});

test("typing in a field is never taken", () => {
  for (const selector of ["input", "textarea", "[contenteditable='true']"]) {
    expect(isHotkey(press("x", { target: field(selector) }), "x")).toBe(false);
  }
});
