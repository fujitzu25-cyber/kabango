import { describe, it, expect } from "vitest";
import handler, { parseModelJSON, validate } from "./index";
describe("cloud guardrails", () => {
  it("rejects unknown source IDs", () =>
    expect(() =>
      validate({ reply: "hello", restaurantIds: ["fake"] }, ["kg-1"]),
    ).toThrow());
  it("parses fenced JSON and rejects malformed output", () => {
    expect(
      parseModelJSON('```json\n{"reply":"Hello","restaurantIds":[]}\n```'),
    ).toEqual({ reply: "Hello", restaurantIds: [] });
    expect(() => parseModelJSON("hello")).toThrow();
  });
  it("rejects cross-origin calls before AI usage", async () => {
    const response = await handler.fetch(
      new Request("https://example.com/api/chat", {
        method: "POST",
        headers: { Origin: "https://evil.test" },
      }),
      { ALLOWED_ORIGINS: "https://kabango.test" } as never,
    );
    expect(response.status).toBe(403);
  });
  it("fails closed when cloud AI is disabled or bindings are missing", async () => {
    const response = await handler.fetch(
      new Request("https://example.com/api/chat", {
        method: "POST",
        headers: { Origin: "https://kabango.test" },
      }),
      { ALLOWED_ORIGINS: "https://kabango.test", AI_ENABLED: "false" } as never,
    );
    expect(response.status).toBe(503);
  });
});
