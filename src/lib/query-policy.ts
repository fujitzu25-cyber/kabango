export function unsafeInstruction(query: string) {
  return /(?:ignore|disregard|override).{0,50}(?:previous|system|instructions|rules)|(?:reveal|print|show|leak).{0,40}(?:system prompt|secret|api.key|token)|you are now|act as (?:a hacker|unrestricted)/i.test(
    query,
  );
}
export function cleanQuery(query: string) {
  // eslint-disable-next-line no-control-regex -- Strip ASCII controls from untrusted input.
  return query.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
}
