import fs from "node:fs/promises";
const css = await (
  await fetch(
    "https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap",
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      },
    },
  )
).text();
const urls = [...css.matchAll(/url\((https:[^)]+\.woff2)\)/g)].map((m) => m[1]);
if (!urls.length) throw new Error("No woff2 font returned");
const res = await fetch(urls.at(-1));
if (!res.ok) throw new Error("Font download failed");
await fs.writeFile(
  "public/fonts/inter.woff2",
  new Uint8Array(await res.arrayBuffer()),
);
console.log("Saved self-hosted Inter woff2");
