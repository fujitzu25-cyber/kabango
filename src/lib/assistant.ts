import { unsafeInstruction } from "./query-policy";
import { replySchema, defaultFilters } from "./schema";
import type {
  AssistantReply,
  Coordinates,
  Language,
  Restaurant,
} from "./schema";
import { searchRestaurants } from "./search";
import { db } from "./db";
export function detectLanguage(text: string): Language {
  return /\b(ano|diin|diri|namit|barato|palihog|sang|nga|kaon|pila)\b/i.test(
    text,
  )
    ? "hil"
    : /\b(saan|masarap|mura|magkano|pagkain|po|pamilya|bukas)\b/i.test(text)
      ? "fil"
      : "en";
}
export function parseIntent(query: string) {
  const q = query.toLowerCase(),
    filters = { ...defaultFilters };
  const categories: [RegExp, string][] = [
    [/waterfall|falls|talon/, "Waterfalls"],
    [/cave|langub/, "Caves"],
    [/heritage|cathedral|church|simbahan/, "Heritage"],
    [/farm|uma/, "Farms"],
    [/seafood|isda|talaba|bangus/, "Seafood"],
    [/cafe|café|coffee|kape|latte/, "Café"],
    [/bakery|pandesal|bread|tinapay/, "Bakery"],
    [/street|isaw/, "Street Food"],
    [/vegetar|gulay|utan/, "Vegetarian"],
  ];
  if (
    /touris|attraction|waterfall|falls|cave|resort|nature|heritage|visit|travel|lagaw|pasyal/.test(
      q,
    )
  )
    filters.kind = "attraction";
  else if (
    /eat|food|restaurant|cafe|coffee|lunch|dinner|merienda|kaon|pagkain/.test(q)
  )
    filters.kind = "food";
  filters.category = categories.find(([re]) => re.test(q))?.[1] ?? "all";
  if (/cheap|budget|barato|mura|cheapest/.test(q)) {
    filters.budget = 1;
    filters.sort = "price";
  }
  if (/open now|bukas ngayon|bukas pa|bukas subong|abri/.test(q))
    filters.open = true;
  if (/late|10\s*p\.?m|11\s*p\.?m|midnight|gab.?i/.test(q))
    filters.tag = "late-night";
  if (/family|pamilya|kids|bata/.test(q)) filters.tag = "family";
  if (/group|birthday|party|celebrat/.test(q)) filters.tag = "group";
  if (/date|romantic/.test(q)) filters.tag = "date";
  if (/pet|dog|cat/.test(q)) filters.tag = "pet-friendly";
  if (/nearest|near me|lapit|malapit/.test(q)) filters.sort = "distance";
  if (/best|rating|top rated/.test(q)) filters.sort = "rating";
  for (const service of ["delivery", "takeout", "dine-in"])
    if (q.includes(service)) filters.service = service;
  for (const pay of ["GCash", "Maya", "cash"])
    if (q.includes(pay.toLowerCase())) filters.payment = pay;
  const groupSize = Number(
    q.match(/(\d+)\s*(people|persons|pax|tawo|tao)/)?.[1] ?? 0,
  );
  const hour = q.match(/\b(1[0-2]|[1-9])\s*(am|pm)\b/);
  const requestedHour = hour
    ? (Number(hour[1]) % 12) + (hour[2] === "pm" ? 12 : 0)
    : undefined;
  return {
    filters,
    groupSize,
    requestedHour,
    language: detectLanguage(q),
    fare: /fare|pamasahe|plete|magkano|pila/.test(q),
    directions: /directions|how to get|paano pumunta/.test(q),
    compare: /compare|versus|\bvs\b/.test(q),
    order: /what.*order|ano.*order|signature/.test(q),
    surprise: /surprise|random|ikaw.*pili/.test(q),
  };
}
export function localAnswer(
  query: string,
  restaurants: Restaurant[],
  origin?: Coordinates,
): AssistantReply {
  if (unsafeInstruction(query))
    return {
      reply:
        "I can help with Kabankalan food, tourist spots and transport. I cannot follow requests to override instructions or disclose private configuration.",
      restaurantIds: [],
    };
  const intent = parseIntent(query),
    q = query.toLowerCase();
  let candidates = searchRestaurants(restaurants, intent.filters, origin);
  const barangay = restaurants.find(
    (r) =>
      r.barangay !== "Kabankalan City" && q.includes(r.barangay.toLowerCase()),
  );
  if (barangay)
    candidates = candidates.filter((r) => r.barangay === barangay.barangay);
  if (intent.groupSize)
    candidates = candidates.filter((r) => r.maxGroupSize >= intent.groupSize);
  if (intent.requestedHour !== undefined) {
    const h = intent.requestedHour;
    candidates = candidates.filter((r) =>
      r.hours.some((day) =>
        day.some(([s, e]) => {
          const a = Number(s.slice(0, 2)),
            b = Number(e.slice(0, 2));
          return b > a ? h >= a && h < b : h >= a || h < b;
        }),
      ),
    );
  }
  const named = restaurants.filter((r) => q.includes(r.name.toLowerCase()));
  if (named.length) candidates = named;
  if (intent.surprise && candidates.length)
    candidates = [candidates[Math.floor(Math.random() * candidates.length)]];
  const picks = candidates.slice(0, intent.compare ? 2 : 3),
    names = picks.map((r) => r.name).join(", "),
    sample = picks.some((r) => r.sample);
  const lead =
    intent.language === "hil"
      ? picks.length
        ? `Ari ang mahimo mo kadtuan: ${names}.`
        : "Wala sang lugar nga nag-angay. Sulayi ang iban nga filter."
      : intent.language === "fil"
        ? picks.length
          ? `Subukan ang ${names}.`
          : "Walang tugma. Subukan ang ibang filter."
        : picks.length
          ? `Here are a few places to explore: ${names}.`
          : "No spots match all of that yet. Try a different budget or category.";
  let extra =
    intent.order && picks.length
      ? ` ${picks[0].signatureDishes.join(", ")}.`
      : "";
  if (intent.fare)
    extra +=
      " " +
      (intent.language === "hil"
        ? "I-tap ang Fare kag pilia ang ginhalinan."
        : intent.language === "fil"
          ? "I-tap ang Fare at piliin ang pinanggalingan."
          : "Tap Fare and choose your starting point for a transport estimate.");
  if (intent.compare && picks.length === 2)
    extra += ` ${picks.map((r) => `${r.name}: ${r.priceLevel ? "₱".repeat(r.priceLevel) : "price unpublished"}, ${r.maxGroupSize ? r.maxGroupSize + " people" : "capacity unconfirmed"}`).join(" · ")}.`;
  if (sample)
    extra +=
      " " +
      (intent.language === "hil"
        ? "Sample lang ini nga mga lugar kag presyo; kumpirmaha anay."
        : intent.language === "fil"
          ? "Halimbawa lang ang mga lugar at presyo; kumpirmahin muna."
          : "These are sample listings and prices; please verify before visiting.");
  if (!sample)
    extra +=
      intent.language === "hil"
        ? " Kumpirmaha ang oras kag presyo sa ginhalinan nga link; wala pa nakumpirma ang iban nga detalye."
        : intent.language === "fil"
          ? " Kumpirmahin ang oras at presyo sa source link; may mga detalyeng hindi pa alam."
          : " Check the source links for current hours and prices; unpublished details are unknown.";
  return {
    reply: lead + extra,
    restaurantIds: picks.map((r) => r.id),
    ...(intent.fare
      ? { action: "estimate_fare" as const }
      : intent.directions
        ? { action: "show_route" as const }
        : {}),
  };
}
export function validateReply(
  value: unknown,
  allowed: Restaurant[],
): AssistantReply {
  const reply = replySchema.parse(value);
  if (reply.restaurantIds.some((id) => !allowed.some((r) => r.id === id)))
    throw new Error("Unknown restaurant");
  return reply;
}
export async function askAssistant(
  query: string,
  restaurants: Restaurant[],
  signal: AbortSignal,
  origin?: Coordinates,
): Promise<AssistantReply & { mode: string }> {
  const fallback = {
    ...localAnswer(query, restaurants, origin),
    mode: "local",
  };
  if (import.meta.env.VITE_AI_ENABLED === "false")
    return {
      ...fallback,
      reply:
        "The assistant is disabled. You can still browse, search and estimate fares.",
    };
  if (unsafeInstruction(query)) return fallback;
  const url = import.meta.env.VITE_CHAT_URL;
  if (!navigator.onLine || !url) return fallback;
  const intent = parseIntent(query),
    retrieved = searchRestaurants(restaurants, intent.filters, origin).slice(
      0,
      8,
    );
  const key = `chat:${intent.language}:${query.trim().toLowerCase()}:${retrieved.map((r) => r.updatedAt + r.id).join(",")}`;
  try {
    const cached = await db.cache.get(key);
    if (cached && Date.now() - cached.at < 3600000)
      return { ...validateReply(cached.value, retrieved), mode: "cloud" };
    const timeout = AbortSignal.timeout(7000);
    const response = await fetch(url, {
      method: "POST",
      signal: AbortSignal.any([signal, timeout]),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        sessionId: getSessionId(),
        restaurantIds: retrieved.map((r) => r.id),
        language: intent.language,
      }),
    });
    if (!response.ok) throw new Error("Cloud resting");
    const reply = validateReply(await response.json(), retrieved);
    await db.cache.put({ key, value: reply, at: Date.now() });
    return { ...reply, mode: "cloud" };
  } catch {
    if (signal.aborted) throw new DOMException("Stopped", "AbortError");
    return fallback;
  }
}
function getSessionId() {
  let id = sessionStorage.getItem("kabango-session");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("kabango-session", id);
  }
  return id;
}
