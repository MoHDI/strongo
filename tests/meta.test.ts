import { describe, expect, it } from "vitest";
import { extractJson, extractReplyText } from "../lib/meta";

describe("extractJson", () => {
  it("parses pure JSON", () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });

  it("extracts JSON embedded in prose", () => {
    expect(extractJson('Here: {"x": [1, 2]} done')).toEqual({ x: [1, 2] });
  });

  it("returns null when there are no braces", () => {
    expect(extractJson("no json here")).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    expect(extractJson("{oops")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(extractJson("")).toBeNull();
  });
});

describe("extractReplyText", () => {
  it("reads plain string content", () => {
    expect(
      extractReplyText({ choices: [{ message: { content: "hi" } }] })
    ).toBe("hi");
  });

  it("joins content-block arrays", () => {
    expect(
      extractReplyText({
        choices: [
          {
            message: {
              content: [
                { type: "text", text: "a" },
                { type: "output_text", text: "b" },
              ],
            },
          },
        ],
      })
    ).toBe("ab");
  });

  it("returns null when content is missing", () => {
    expect(extractReplyText({ choices: [{ message: {} }] })).toBeNull();
    expect(extractReplyText({})).toBeNull();
  });

  it("returns null for empty content", () => {
    expect(
      extractReplyText({ choices: [{ message: { content: "" } }] })
    ).toBeNull();
    expect(
      extractReplyText({ choices: [{ message: { content: [] } }] })
    ).toBeNull();
  });
});
