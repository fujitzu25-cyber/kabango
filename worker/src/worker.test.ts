import { describe, it, expect, vi } from "vitest";
import handler, { parseModelJSON, validate, RateBudget } from "./index";
describe("cloud guardrails", () => {
  it("stops global usage across sessions and expires counters at UTC midnight", async () => {
    const clock = vi
      .spyOn(Date, "now")
      .mockReturnValue(Date.parse("2026-10-21T08:00:00Z"));
    const values = new Map<string, unknown>();
    let alarm: number | null = Date.parse("2026-10-22T08:00:00Z");
    const storage = {
      get: async (key: string) => values.get(key),
      put: async (entries: Record<string, unknown>) => {
        for (const [k, v] of Object.entries(entries)) values.set(k, v);
      },
      transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(storage),
      getAlarm: async () => alarm,
      setAlarm: async (value: number) => {
        alarm = value;
      },
      deleteAll: async () => {
        values.clear();
      },
    };
    const budget = new RateBudget({ storage } as never);
    const reserve = (user: string) =>
      budget.fetch(
        new Request("https://budget/check", {
          method: "POST",
          body: JSON.stringify({ ipKey: user, sessionKey: user, daily: 2 }),
        }),
      );
    try {
      expect((await reserve("a")).status).toBe(200);
      expect((await reserve("b")).status).toBe(200);
      expect((await reserve("c")).status).toBe(429);
      expect(alarm).toBe(Date.parse("2026-10-22T00:00:00Z"));
      await budget.alarm();
      clock.mockReturnValue(Date.parse("2026-10-22T00:00:01Z"));
      expect((await reserve("c")).status).toBe(200);
      expect(alarm).toBe(Date.parse("2026-10-23T00:00:00Z"));
    } finally {
      clock.mockRestore();
    }
  });
  it("rejects unknown source IDs", () =>
    expect(() =>
      validate({ reply: "hello", restaurantIds: ["fake"] }, ["kg-1"]),
    ).toThrow());
  it("parses fenced JSON and rejects malformed output", () => {
    const structured = { reply: "Try this cafe", restaurantIds: ["known"] };
    expect(validate(parseModelJSON(structured), ["known"])).toEqual(structured);
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
