import fs from "node:fs";
const base = (
  process.env.VITE_SITE_URL ?? "https://kabango-eight.vercel.app"
).replace(/\/$/, "");
const restaurants = JSON.parse(
  fs.readFileSync("public/data/restaurants.json", "utf8"),
);
const escape = (s) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const shell = fs.readFileSync("dist/index.html", "utf8");
for (const r of restaurants) {
  // Fictional sample listings are not emitted as real Restaurant structured data or indexed.
  const url = `${base}/restaurant/${r.slug}`,
    description = `${r.sample ? "Fictional sample listing. " : ""}${r.description}`;
  const jsonld = r.sample
    ? ""
    : `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "Restaurant", name: r.name, address: r.address, ...(r.lat !== null && r.lng !== null ? { geo: { "@type": "GeoCoordinates", latitude: r.lat, longitude: r.lng } } : {}), ...(r.photos.length ? { image: r.photos.map((p) => (p.startsWith("https:") ? p : base + p)) } : {}), url, ...(r.priceLevel ? { priceRange: "₱".repeat(r.priceLevel) } : {}), servesCuisine: r.cuisine }).replace(/</g, "\\u003c")}</script>`;
  const page = shell
    .replace(
      /<title>.*?<\/title>/,
      `<title>${escape(r.name)} · KabanGo</title>`,
    )
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
      `<meta name="description" content="${escape(description)}"/>`,
    )
    .replace(
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:title" content="${escape(r.name)} · KabanGo"/>`,
    )
    .replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:description" content="${escape(description)}"/>`,
    )
    .replace(
      "</head>",
      `<link rel="canonical" href="${url}"/><meta property="og:url" content="${url}"/>${r.sample ? '<meta name="robots" content="noindex,follow"/>' : ""}${jsonld}</head>`,
    );
  fs.mkdirSync(`dist/restaurant/${r.slug}`, { recursive: true });
  fs.writeFileSync(`dist/restaurant/${r.slug}/index.html`, page);
}
fs.writeFileSync(
  "dist/robots.txt",
  `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`,
);
const paths = [
  "/",
  "/fare",
  "/ask",
  "/privacy",
  ...restaurants.filter((r) => !r.sample).map((r) => `/restaurant/${r.slug}`),
];
fs.writeFileSync(
  "dist/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((p) => `<url><loc>${base}${p}</loc></url>`).join("")}</urlset>`,
);
