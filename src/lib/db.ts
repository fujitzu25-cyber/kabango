import Dexie from "dexie";
import type { Table } from "dexie";
export type Saved = {
  id: string;
  list: "favorites" | "want";
  createdAt: number;
};
export type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  restaurantIds?: string[];
  createdAt: number;
  mode?: string;
};
export type Review = {
  id: string;
  restaurantId: string;
  rating: number;
  text: string;
  photo?: Blob;
  createdAt: number;
  moderation: "pending";
};
class KabanDB extends Dexie {
  saved!: Table<Saved, string>;
  messages!: Table<Message, string>;
  reviews!: Table<Review, string>;
  searches!: Table<{ query: string; at: number }, string>;
  cache!: Table<{ key: string; value: unknown; at: number }, string>;
  feedback!: Table<{ id: string; value: number; at: number }, string>;
  submissions!: Table<
    { id: string; kind: string; data: unknown; at: number },
    string
  >;
  constructor() {
    super("kabango");
    this.version(1).stores({
      saved: "id,list",
      messages: "id,createdAt",
      reviews: "id,restaurantId,createdAt",
      searches: "query,at",
      cache: "key,at",
      feedback: "id",
      submissions: "id,kind",
    });
  }
}
export const db = new KabanDB();
export interface RatingsProvider {
  get(restaurantId: string): Promise<{ rating: number; count: number }>;
}
export const localRatings: RatingsProvider = {
  async get(id) {
    const items = await db.reviews.where("restaurantId").equals(id).toArray();
    return {
      rating: items.length
        ? items.reduce((n, r) => n + r.rating, 0) / items.length
        : 0,
      count: items.length,
    };
  },
};
