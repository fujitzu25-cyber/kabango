import { z } from "zod";
export const savedSchema = z
  .object({
    id: z.string().regex(/^(favorites|want):[\w-]{1,100}$/),
    list: z.enum(["favorites", "want"]),
    createdAt: z.number().finite().nonnegative(),
    note: z.string().max(500).optional(),
  })
  .refine((v) => v.id.startsWith(v.list + ":"));
export function readSaved(value: unknown) {
  return Array.isArray(value)
    ? value.slice(0, 1000).flatMap((row) => {
        const parsed = savedSchema.safeParse(row);
        return parsed.success ? [parsed.data] : [];
      })
    : [];
}
export const messageSchema = z.object({
  id: z.string().max(100),
  role: z.enum(["user", "assistant"]),
  text: z.string().max(4000),
  restaurantIds: z.array(z.string().max(120)).max(8).optional(),
  createdAt: z.number().finite(),
  mode: z.string().max(20).optional(),
});
export function readMessages(value: unknown) {
  return Array.isArray(value)
    ? value.slice(-100).flatMap((row) => {
        const p = messageSchema.safeParse(row);
        return p.success ? [p.data] : [];
      })
    : [];
}
