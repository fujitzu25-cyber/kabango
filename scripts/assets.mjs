import fs from "node:fs/promises";
await fs.mkdir("public/images", { recursive: true });
const photos = {
  hero: "photo-1547592180-85f173990554",
  inasal: "photo-1532550907401-a500c9a57435",
  cafe: "photo-1501339847302-ac426a4a7cbb",
  seafood: "photo-1559737558-2f5a35f4523b",
  filipino: "photo-1512621776951-a57141f2eefd",
  grill: "photo-1529193591184-b1d58069ecdd",
  bakery: "photo-1509440159596-0249088772ff",
  street: "photo-1561758033-d89a9ad46330",
  healthy: "photo-1511690743698-d9d85f2fbf38",
  noodles: "photo-1569718212165-3a8278d5f624",
  burger: "photo-1568901346375-23c9450c58cd",
};
await Promise.all(
  Object.entries(photos).map(async ([name, id]) => {
    const file = `public/images/${name}.webp`;
    try {
      await fs.access(file);
      return;
    } catch {}
    const res = await fetch(
      `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${name === "hero" ? 1000 : 640}&q=80&fm=webp`,
    );
    if (!res.ok) throw new Error(`${name}: ${res.status}`);
    await fs.writeFile(file, new Uint8Array(await res.arrayBuffer()));
    console.log(`Saved ${name}`);
  }),
);
