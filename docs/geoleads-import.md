# GeoLeadScraper: local discovery and review

KabGo can stage a **Google Maps business JSON export** from [GeoLeadScraper](https://github.com/ozhehkovski/geoleadscraper) without adding a paid API or a runtime dependency. This importer does not install the extension, scrape a website, call Google APIs, start a backend, or publish listings. Existing public data stays unchanged.

The reviewed upstream revision is `28505a873bb91e00d7c4c54bea06fbfca5cbcb1b` (MIT). Its export is a JSON **array**, with fields such as `title`, `address`, `categories`, `maps_url`, `website`, `latitude`, and `longitude`. Save that JSON file under this repository's ignored `.local/` directory. Use the actual collection date, not today's date unless collected today:

```powershell
node scripts/import-geoleads.mjs --input .local/research/geoleads-export.json --output .local/research/geoleads-review-2026-10-28.json --collected-at 2026-10-28
node --test scripts/import-geoleads.test.mjs
```

The command writes a **new** JSON review file only inside `.local/`. It refuses overwrites, output outside `.local/`, and symbolic-link/junction output paths. Do not commit raw exports or review files. Rejected rows contain a row number and reason, not the complete raw record. A collection date records discovery, not verification of current business operation.

Only business name, address, category, website, exact source Maps URL, and screened coordinates enter candidates. Reviewers, avatars, reviews, ratings, review counts, photo counts, phones, emails, social profiles, opening hours, pricing and arbitrary extra fields are discarded. URLs must be public HTTP(S), without credentials, literal IP addresses, local/internal hosts or custom ports. The importer never follows them. Normal Maps URLs and Google Maps short links are accepted; short links remain unresolved and must be reviewed.

Addresses must explicitly mention Kabankalan. Malformed coordinates are rejected. Missing coordinates stay null. Coordinates outside the conservative central discovery rectangle (9.96–10.03 N, 122.78–122.85 E, from the earlier OSM research query) are discarded and flagged for manual location review while the candidate is retained. **This rectangle is not the municipal boundary**: valid rural Kabankalan places may fall outside it, and being inside it does not establish jurisdiction or an entrance. Confirm the location and city independently before entering a production pin.

Candidates are matched to existing directory IDs using an exact source URL first, then normalized business name **and** address together. Multiple matches are preserved for review; fuzzy matching and automatic changes are deliberately absent. Duplicate rows in one export are reported separately. An importer match does not establish that a business is open or that its contact details are current. Check owner/official sources, preserve their URLs and actual check dates, and retain unknown details before promoting any record manually.

## Photos

The ordinary business export's `photos` field is a **number**, not a business-photo URL. The review exporter contains reviewer identity and review-photo links; it is not a licensed photo feed. This importer discards both. Obtain venue photos separately from a verified publisher with appropriate rights and credit; preserve the source link. Do not substitute stock photos or claim every listing has a verified photo.

## Extension and permission limits

The extension is optional, local, and free according to its repository; this does not guarantee platform access, complete coverage, or automatic updates. Installing it requires explicit approval of browser access: storage, active tab, scripting, tabs, alarms, Google domains, and localhost. Its content-script configuration covers many regional Google domains. Use a dedicated browser profile without unrelated signed-in accounts where practical.

Keep **Enrich missing email / phone** off and do not grant optional `<all_urls>` access. Disable the optional backend URL when collecting manual exports. The reviewed extension polls a configured backend for jobs; its optional API defaults to listening on all interfaces with permissive CORS and unauthenticated job routes. Do not expose that backend publicly or add it to Vercel unchanged. No backend, account sign-in, payment card, or Google billing is needed for this staging command. Public availability of content does not grant republication rights.
