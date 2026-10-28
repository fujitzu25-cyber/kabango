import fs from "node:fs";
const base = (
  process.env.VITE_SITE_URL ?? "https://kabgo-kabankalan.vercel.app"
).replace(/\/$/, "");
const places = [
  ...JSON.parse(fs.readFileSync("public/data/restaurants.json", "utf8")),
  ...JSON.parse(fs.readFileSync("public/data/tourist-spots.json", "utf8")),
  ...JSON.parse(fs.readFileSync("public/data/services.json", "utf8")),
];
const escape = (s) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const shell = fs.readFileSync("dist/index.html", "utf8");
const jsonld = (value) =>
  `<script type="application/ld+json">${JSON.stringify(value).replace(/</g, "\\u003c")}</script>`;
function page(title, description, path, data) {
  const shortTitle =
    title.length > 60 ? title.slice(0, 51).trimEnd() + " · KabGo" : title;
  const desc =
    description.length > 155
      ? description.slice(0, 151).trimEnd() + "…"
      : description;
  return shell
    .replace(/<title>.*?<\/title>/, `<title>${escape(shortTitle)}</title>`)
    .replace(
      /(<meta\s+(?:name="description"|property="og:description")\s+content=")[^"]*("\s*\/>)/g,
      `$1${escape(desc)}$2`,
    )
    .replace(
      /(<meta\s+property="og:title"\s+content=")[^"]*("\s*\/>)/,
      `$1${escape(shortTitle)}$2`,
    )
    .replace(/https:\/\/kabgo-kabankalan.vercel.app/g, base)
    .replace(
      "</head>",
      `<link rel="canonical" href="${base}${path}"/><meta property="og:url" content="${base}${path}"/>${jsonld(data)}</head>`,
    );
}
const site = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "KabGo",
  url: base,
  description: "Your free food and travel guide to Kabankalan City.",
};
fs.writeFileSync(
  "dist/index.html",
  page(
    "KabGo — Eat & Explore Kabankalan",
    "Discover local food, cafés, waterfalls and tourist spots in Kabankalan City. Save places, plan a visit and check tricycle fare references.",
    "/",
    site,
  ),
);
for (const kind of ["food", "attractions"]) {
  fs.mkdirSync(`dist/${kind}`, { recursive: true });
  fs.writeFileSync(
    `dist/${kind}/index.html`,
    page(
      `${kind === "food" ? "Eat & drink" : "Tourist spots"} in Kabankalan · KabGo`,
      "Explore sourced places in Kabankalan City. Check venue links for current hours, prices and access.",
      `/${kind}`,
      site,
    ),
  );
}
for (const r of places.filter((r) => !r.sample)) {
  const kind = r.kind ?? "food";
  const path = `/place/${r.slug}`,
    url = base + path;
  const data = {
    "@context": "https://schema.org",
    "@type": r.secondaryKinds?.length
      ? [kind, ...r.secondaryKinds].map(
          (kind) =>
            ({
              food: "Restaurant",
              attraction: "TouristAttraction",
              hotel: "Hotel",
              fuel: "GasStation",
            })[kind],
        )
      : {
          food: "Restaurant",
          attraction: "TouristAttraction",
          hotel: "Hotel",
          fuel: "GasStation",
        }[kind],
    name: r.name,
    address: r.address,
    url,
    ...(r.lat !== null && r.lng !== null
      ? {
          geo: { "@type": "GeoCoordinates", latitude: r.lat, longitude: r.lng },
        }
      : {}),
    ...(r.photos.length
      ? { image: r.photos.map((p) => (p.startsWith("https:") ? p : base + p)) }
      : {}),
    ...(kind === "food" ? { servesCuisine: r.cuisine } : {}),
  };
  for (const prefix of ["place", "restaurant"]) {
    fs.mkdirSync(`dist/${prefix}/${r.slug}`, { recursive: true });
    fs.writeFileSync(
      `dist/${prefix}/${r.slug}/index.html`,
      page(`${r.name} · KabGo`, r.description, path, data),
    );
  }
}
fs.writeFileSync(
  "dist/robots.txt",
  `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`,
);
const paths = [
  "/",
  "/food",
  "/attractions",
  "/fare",
  "/ask",
  "/privacy",
  ...places.filter((r) => !r.sample).map((r) => `/place/${r.slug}`),
];
fs.writeFileSync(
  "dist/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((p) => `<url><loc>${base}${p}</loc></url>`).join("")}</urlset>`,
);
