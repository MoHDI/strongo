import { describe, expect, it } from "vitest";
import { extractJson } from "../lib/meta";

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
