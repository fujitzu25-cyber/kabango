# KabGo upgrade verification — 21 October 2026

The public app is now **KabGo — Eat & Explore Kabankalan**. The free canonical address is https://kabgo-kabankalan.vercel.app . The previous address remains usable; private browser data stays with its original site address.

## Data and visitor experience

- 69 food listings retained; 12 sourced tourist destinations added. 31 places have publisher images. No claim of a complete city census or owner verification.
- Real Mag-aso Falls hero photo by Godopeta7410, CC BY-SA 4.0, with credited resized WebP copies. Eight tourist destinations have no confirmed map pin. No fee, opening time or entrance coordinate is inferred from a place name.
- Food/tourism filters, local search synonyms, keyboard suggestions, browser Back synchronization, map area search and place preview, Save/Undo, shared lists, private notes and an in-context chat panel.
- Suggestions use a three-step local draft flow with image type/signature/size checks. Export is explicit; nothing is submitted to a public database. Claims do not verify ownership.
- App name, mobile layout, dark theme, readable text, focus targets and links updated. Legacy storage IDs are retained. Existing saved lists are not deleted.

## Audit findings checked

| Finding | Result |
| --- | --- |
| Relative SVG sharing preview | Replaced with absolute 1200×630 PNG, Twitter image, consistent titles and canonical URLs. Static place metadata distinguishes Restaurant and TouristAttraction. No invented review schema. |
| Exposed browser AI key | Browser sends to the existing Worker; no provider key in the client. Worker secrets remain server-side. |
| AI usage abuse | Existing atomic Durable Object limiter retained: 6/minute per hashed IP/session; 100/day globally. Disabled/missing services and quotas fail closed; local suggestions remain available. Input limited to 500 characters and structured output to known IDs. |
| Prompt injection | No model tools, account credentials or private GPS. Records treated as data; output validated, rendered as text. Basic override requests declined. Pattern filtering is additional defense, not a proof against every injection. |
| Public submissions / storage rules | Public submission API, public uploads and shared database are absent. RLS, public moderation and server-side spam controls are not applicable to private device drafts. No false moderation deadline or public acceptance message. |
| Stored script injection | React text rendering retained; script-like draft text tested as inert. HTTP(S) source URLs only; corrupt saved/chat/cache rows rejected. |
| Security headers | CSP, framing protection, HSTS, nosniff, referrer and permission policies configured. Eight pages tested in both themes with the production policy injected into local HTTP responses; no CSP violations detected. |
| Contrast / mobile | axe-core 4.14.0: no detected A/AA rule violations across eight pages in both themes at 390×844. No horizontal overflow in that matrix. Automated results do not constitute complete manual WCAG certification. |
| Dependency vulnerabilities | Vitest upgraded to 4.1.11; package audit reported zero known vulnerabilities. |
| Repository secrets | Custom provider-key/private-key/assigned-secret scan of all five existing Git revisions found no matches. Official Gitleaks download failed from this PC; this is not a completed Gitleaks audit or a guarantee that no secret exists. |

## Verification

- Frontend and Worker TypeScript compilation and ESLint.
- 32 unit tests: timezone hours, fuzzy search, fare tables, unknown data, assistant grounding, cloud parser, origin checks, daily quota reset and delayed-alarm protection, plus tourism/storage/URL regressions.
- Browser flows cover search, details, Save/Undo, shared IDs, keyboard suggestions, Back, chat panel, inert drafts, publisher-photo failure, city fare references, offline directory/assistant and mobile navigation.
- `node scripts/verify-build.mjs` checks 82 generated pages, canonical URLs, sharing assets, structured data and the KabGo manifest.
- Lighthouse installation timed out; no Lighthouse score or 90+ performance claim is made. Optional on-device model JavaScript/weights remain a separate consent-based download and are not part of initial page loading or PWA precache.

## Graphify

The free `fuji-s-workspace` dashboard contains the indexed `fujitzu25-cyber/kabango` repository (313 nodes at the check). A dashboard query returned 13 cited code nodes for search, offline data and cloud rate limiting. The direct plugin still rejected discovery/selection with `403 no_workspace`; no direct connector success or measured token savings is claimed. Future guidance is recorded in AGENTS.md. Indexed results can lag local changes and must be checked against the source revision.

## Hosting boundaries

No paid plan, card, paid map/photo API or new paid integration was added. Existing Vercel and Cloudflare resources are reused. Free quotas can make online AI unavailable; local search, guide, fares and rule-based suggestions continue. External publisher images need an internet connection and can change or fail. Cloudflare initially timed out from this PC, then successfully deployed the tourism records and new canonical origin after retrying with IPv4. The final live-site check follows deployment.

The public site returned HTTP 200 with CSP, HSTS, nosniff and framing protection. A live waterfall question received an HTTP 200 response from the Worker and displayed **Online AI** with the Mag-aso Falls record. A separate slow request correctly used Local smart mode. The live Mag-aso detail page returned its own canonical URL and TouristAttraction metadata. The last content check removed a leftover fictional example from chat starter text and made the licensed waterfall image available locally on its listing as well as the homepage.

## Directory refresh — 28 October 2026

- 107 publicly sourced records: 83 food/drink, 12 destinations, 5 new accommodation listings and 7 fuel stations. Zaycoland also matches the hotel filter through a secondary kind, retaining its original saved ID and slug. The central OSM snapshot was retrieved again: all 40 food features had unchanged tags. Other source dates remain intact.
- Added 12 missing café/bar/restaurant records from an accessible owner site and clearly marked directories, plus two separately addressed merchant branches. Directory copies of Facebook content are not described as independently retrieved owner pages. Historical and conflicting details remain disclosed.
- Existing design, local saved data and free resources are preserved. Added type filters, matching local/cloud assistant grounding, offline service records and correct Hotel/GasStation structured data. Room rates, pump prices, unconfirmed pins and ratings remain unknown.
- Google Maps review links are external. No Google review text or reviewer identities were copied, and no billing-enabled Google API was added. Leaflet already handles map display. Thirty-one records retain their existing publisher images; verified external galleries were added for three venues without copying their photos.
- GeoLeadScraper's source and official v1.2.0 release were reviewed. The release archive matched GitHub's SHA-256 digest. Its regular photo field is only a count. A dependency-free importer stages only private review candidates and cannot overwrite production data. The browser tool blocked access to the extension manager; the user chose to continue without installation. No extension or scraping backend was installed or deployed.
- Installed agents performed the implementation, source checks and independent review. Findings fixed: legacy food JSON-LD lost its type when raw records omitted `kind`; petrol queries accidentally requested pet-friendly venues; empty barangays incorrectly narrowed assistant results; four citations were corrected to the page actually retrieved.
- Passed frontend/Worker TypeScript, ESLint, 107-record validation, 35 unit tests, 8 private-importer tests, production build and 108-page metadata verification, and 14 Edge browser tests. Five new/affected views in each of two themes passed automated axe A/AA checks with no detected violations or horizontal overflow. This is not complete manual accessibility certification.
- The updated existing Worker deployed as `7785e4ec-a50c-455e-8edd-60e6799ba10c`, retaining the 100/day global budget and local fallback. No paid resources, cards, billing or automatic upgrades were added. External business pages/photos can change, and this directory is not an exhaustive or live owner-verified census.
