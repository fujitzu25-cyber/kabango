import { z } from "zod";
const httpUrl = z
  .string()
  .url()
  .refine((v) => /^https?:\/\//i.test(v), "HTTP(S) URL required");
const photoUrl = z
  .string()
  .refine(
    (v) => /^https?:\/\//i.test(v) || /^\/(?!\/)[\w/.-]+$/.test(v),
    "Local image or HTTP(S) URL required",
  );
const interval = z.tuple([
  z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
]);
export const restaurantSchema = z.object({
  kind: z.enum(["food", "attraction"]).default("food"),
  visitInfo: z.string().optional(),
  admission: z.string().optional(),
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  description: z.string(),
  categories: z.array(z.string()),
  cuisine: z.array(z.string()),
  signatureDishes: z.array(z.string()),
  // Zero means unpublished, never a free meal or a zero-star review.
  priceLevel: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  address: z.string(),
  barangay: z.string(),
  landmark: z.string(),
  lat: z.number().min(-90).max(90).nullable(),
  lng: z.number().min(-180).max(180).nullable(),
  phone: z.string().optional(),
  facebookUrl: httpUrl.optional(),
  googleMapsUrl: httpUrl,
  website: httpUrl.optional(),
  hours: z
    .array(z.array(interval))
    .refine((days) => days.length === 0 || days.length === 7),
  hoursText: z.string().optional(),
  photos: z.array(photoUrl),
  photoCredit: z.string().optional(),
  photoSourceUrl: httpUrl.optional(),
  menuUrl: httpUrl.optional(),
  facebookPostUrl: httpUrl.optional(),
  sources: z
    .array(
      z.object({
        title: z.string(),
        url: httpUrl,
        kind: z.enum([
          "official",
          "government",
          "merchant",
          "community",
          "directory",
        ]),
        checkedAt: z.string(),
        note: z.string(),
      }),
    )
    .default([]),
  menu: z.array(
    z.object({
      name: z.string(),
      price: z.number().nonnegative(),
      category: z.string(),
      photo: photoUrl.optional(),
    }),
  ),
  tags: z.array(z.string()),
  maxGroupSize: z.number().nonnegative(),
  payments: z.array(z.string()),
  services: z.array(z.string()),
  directions: z.object({ en: z.string(), hil: z.string(), fil: z.string() }),
  aiNotes: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  verified: z.boolean(),
  sample: z.boolean(),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().nonnegative(),
  popularity: z.number(),
});
export type Restaurant = z.infer<typeof restaurantSchema>;
export type Coordinates = { lat: number; lng: number };
export type Language = "en" | "hil" | "fil";
export const replySchema = z.object({
  reply: z.string().min(1).max(2000),
  restaurantIds: z.array(z.string()).max(8),
  action: z.enum(["show_route", "estimate_fare"]).optional(),
});
export type AssistantReply = z.infer<typeof replySchema>;
export const fareSchema = z.object({
  sample: z.boolean(),
  updatedAt: z.string(),
  modes: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      baseFare: z.number().nonnegative(),
      perKm: z.number().nonnegative(),
      includedKm: z.number().nonnegative(),
      minFare: z.number().nonnegative(),
      uncertainty: z.number().min(0).max(1),
      zoneFares: z.array(
        z.object({
          from: z.string(),
          to: z.string(),
          fare: z.number().nonnegative(),
        }),
      ),
      discounts: z.record(z.number().min(0).max(1)),
      notes: z.string(),
    }),
  ),
});
export type FareConfig = z.infer<typeof fareSchema>;
export type Filters = {
  kind: "all" | "food" | "attraction";
  query: string;
  category: string;
  open: boolean;
  budget: number;
  tag: string;
  service: string;
  payment: string;
  rating: number;
  sort: string;
};
export const defaultFilters: Filters = {
  kind: "all",
  query: "",
  category: "all",
  open: false,
  budget: 0,
  tag: "",
  service: "",
  payment: "",
  rating: 0,
  sort: "recommended",
};
