import fs from "node:fs";
import assert from "node:assert/strict";
const places = [
  ...JSON.parse(fs.readFileSync("public/data/restaurants.json")),
  ...JSON.parse(fs.readFileSync("public/data/tourist-spots.json")),
];
for (const path of [
  "index.html",
  ...places.map((r) => `place/${r.slug}/index.html`),
]) {
  const html = fs.readFileSync(`dist/${path}`, "utf8");
  const title = html.match(/<title>(.*?)<\/title>/)?.[1];
  const decode = (s) =>
    s
      .replaceAll("&amp;", "&")
      .replaceAll("&quot;", '"')
      .replaceAll("&#39;", "'")
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">");
  assert(title && decode(title).length <= 60, `Missing/long title: ${path}`);
  assert.equal(
    (html.match(/rel="canonical"/g) ?? []).length,
    1,
    `Duplicate canonical: ${path}`,
  );
  assert.match(
    html,
    /property="og:image"\s+content="https:\/\/[^" ]+\/og-cover.png"/,
  );
  assert.match(
    html,
    /name="twitter:image"\s+content="https:\/\/[^" ]+\/og-cover.png"/,
  );
  const description = html.match(/name="description"\s+content="([^"]*)"/)?.[1];
  assert(
    description && decode(description).length <= 155,
    `Missing/long description: ${path}`,
  );
  if (path.includes("mag-aso-falls"))
    assert.match(html, /"@type":"TouristAttraction"/);
  if (path.includes("organiko-")) assert.match(html, /"@type":"Restaurant"/);
  assert.doesNotMatch(html, /"aggregateRating"/);
}
const manifest = JSON.parse(fs.readFileSync("dist/manifest.webmanifest"));
assert.equal(manifest.short_name, "KabGo");
assert(fs.existsSync("dist/images/magaso-540.webp"));
console.log(
  `Verified metadata, canonical URLs, image assets, structured data and manifest for ${places.length + 1} pages.`,
);
