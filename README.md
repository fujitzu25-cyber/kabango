# KabGo

A free, offline-ready food and travel guide for Kabankalan City. Browse local meals, cafés, waterfalls, caves, farms and heritage landmarks; save places, share a list, add private notes and check fare references. Built with React 19, Vite, TypeScript, Leaflet, Workbox, Dexie and Fuse.

Live app: [kabgo-kabankalan.vercel.app](https://kabgo-kabankalan.vercel.app). The previous address remains available so existing local saves can still be accessed. Browser data is specific to each site origin. Source: [fujitzu25-cyber/kabango](https://github.com/fujitzu25-cyber/kabango). Legacy repository, Worker and database identifiers are retained for compatibility. The optional AI endpoint is `https://kabango-ai.kabango.workers.dev/api/chat`; the client falls back locally whenever it is unavailable. The Worker has a 100-request daily cap and uses `@cf/meta/llama-3.1-8b-instruct-fast` without a browser-visible provider key.

## Honest data boundaries

The production directory contains **81 real, publicly sourced places** checked on 2026-10-21: 69 food listings and 12 tourist destinations. **30 food listings have externally hosted merchant/owner images**; some show promotional food rather than branch interiors. The homepage uses a real, credited Mag-aso Falls photograph under CC BY-SA 4.0, with local resized WebP derivatives. Missing images show a named placeholder. Every record links its sources, limitations and check date. Coverage is not exhaustive; current operation, admission fees, access, hours and unpublished prices need confirmation. No Google reviews, ratings, speculative map pins or invented prices are imported. See [sources and image rights](public/data/SOURCES.md).

**Tricycle tariffs are separate:** `public/data/tricycle-tariffs.json` contains 43 schedules transcribed from the user's screenshots labeled City Ordinance 2026-006, received October 20, 2026. This is a transcription, not independent legal verification. The app requires an explicit fuel band; it does not pretend to know the current fuel price or applicable band. It preserves exact printed regular and discounted amounts, CPPA/CCPA spellings, missing values, and the two ambiguous Casipsipan schedules. It does not infer reverse fares. City-proper add-ons are recorded as notes because discount treatment is not stated. The distance-based estimator uses clearly labeled **illustrative rates**, not this tariff.

## Run

Node 24 and pnpm 11.25.0 (declared in `package.json`).

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
pnpm validate:data
pnpm test
pnpm lint
pnpm build
pnpm test:e2e
```

Playwright uses installed Microsoft Edge on Windows; on other platforms run `pnpm exec playwright install chromium`. Tests run against the production build on port 4173. To exercise cloud failure, build with `VITE_CHAT_URL=/api/chat`; the smoke suite intercepts that endpoint with a 503. `TEST_URL` can point browser tests at a deployment.

The optional on-device model's JavaScript is deliberately excluded from PWA precaching. Its model weights are downloaded only after the user consents. This separate optional bundle produces a build size warning; the initial page does not load it.

## Structure

```text
public/data/       editable restaurants, categories, landmarks, fares, tariff references
public/images/     local optimized stock photos
public/fonts/      self-hosted Inter
src/components/   shared cards, dialogs, offline controls, lazy map
src/pages/        explore, detail, map, chat, saved, fare, community, privacy
src/lib/          Zod schemas, data adapter, search, hours, routes, fares, assistant, IndexedDB
src/locales/      English, Hiligaynon, Filipino (English fallback)
worker/           optional Cloudflare AI proxy and atomic rate/budget limiter
scripts/          validation, sample generation, asset setup, static SEO pages
tests/            browser smoke tests
```

## Replace or import restaurants

Edit `public/data/restaurants.json`, then run `pnpm validate:data` before building. For importing a JSON file:

```sh
pnpm exec tsx scripts/validate.ts /path/to/import.json
```

The validation script checks shape, coordinates, hour intervals and duplicate IDs/slugs. After validation, replace the JSON file and commit it. This local script is the admin interface; there is no unprotected browser admin route. Hours use Sunday-first arrays of `[start,end]` 24-hour intervals. An empty outer hours array means unknown hours; an empty day inside a seven-day week means a closed day. Overnight intervals are supported in Asia/Manila. Use multiple intervals for lunch breaks. Equal start/end means 24 hours. Real public records use `sample:false`; `verified` is reserved for owner-verified data and remains false. Price level and capacity zero mean unpublished; rating/review count zero means no imported rating. Missing coordinates are null: those places are omitted from routing/map markers, with a map-search link instead. Do not invent ratings; set zero until genuine community ratings are available. Contact fields are optional. Publish only public business contact information. Keep image source/credit links; do not rehost third-party images or include them in offline downloads without reuse rights.

`scripts/seed.mjs` regenerates and **overwrites** sample restaurant data; it is only a development tool and must never be run against the production catalog. Tests use a separate sample fixture; deployment does not run the seed script. `scripts/tariffs.mjs` regenerates the supplied tariff transcription. Avoid rerunning either after making verified data changes without reviewing the diff.

`DataProvider`, `RoutingProvider` and `RatingsProvider` are the future backend integration boundaries. Favorites, want-to-try lists, notes, feedback, chats and community drafts currently stay in IndexedDB on this browser. Community forms explicitly save and export local drafts; no server submission or ownership verification is claimed.

## Free AI layers

1. **Local smart mode**: no key, no server, works offline. English/Filipino/Hiligaynon keyword intent parsing retrieves only local entries. Handles budget, cuisine, hours, group size, nearest, payment, services, compare, what to order and random picks. Cards link to directions and fares. It never invents a restaurant outside the dataset.
2. **Optional cloud mode**: the frontend sends a message, random session ID and relevant restaurant IDs to `VITE_CHAT_URL`. It never sends GPS coordinates. The Worker retrieves authoritative records from its bundled dataset, adds grounding instructions, validates JSON and checks IDs. Failures, timeouts, bad outputs, quotas and missing credentials fall back to local mode. Browsers store frequent validated answers for one hour; the Worker caches HMAC query keys in KV for one hour.
3. **Optional private model**: WebLLM + SmolLM2 360M, lazy-loaded only after consent with a size notice and progress. Requires WebGPU and sufficient memory. Model download/capability failures fall back to local mode. This is experimental and can be slower or less capable than cloud inference.

Voice input and read-aloud use browser Speech APIs when supported. Voice availability and language quality vary by OS/browser. Cloud responses are buffered JSON to validate them before display; no simulated streaming is used. Users can stop a request, clear history and save answer feedback locally.

Set `VITE_AI_ENABLED=false` to disable the assistant UI and both optional AI modes. Search, fares, maps, saved places and the rest of the app still work. Leave `VITE_CHAT_URL` empty for local-only chat. **Never put provider keys in a `VITE_` variable.** They are included in the public client bundle.

### Provider quotas checked October 20, 2026

- [Cloudflare Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/): Workers Free includes 10,000 neurons/day, resets at 00:00 UTC; exceeding it fails rather than charging on the Free plan. Some frontier models require paid billing. Use a supported free-plan model such as Llama 3.1 8B Fast and keep the account on Workers Free.
- [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/platform/pricing/): SQLite-backed objects are supported on Workers Free with hard free-tier limits. The Worker uses a single durable object for serialized per-IP, per-session and global daily caps; it does not rely on eventually consistent KV for counters.
- [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing) and [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits): free access is model/account/region dependent; active project limits are displayed in AI Studio. Get a free key in [Google AI Studio](https://aistudio.google.com/apikey), keep billing disabled and verify the selected model's free eligibility. There is no universal reliable fixed RPM value to bake into this app.
- [Groq limits](https://console.groq.com/docs/rate-limits): the Free Plan table lists per-model limits; account limits and headers are authoritative. Get a key in [Groq Console](https://console.groq.com/keys), choose a currently free model and do not enable paid billing. The adapter requires an explicit model rather than assuming a free model stays available indefinitely.

No provider promises unlimited free inference. The local fallback is what keeps KabGo usable when free cloud quotas run out.

### Deploy the optional Cloudflare Worker

Use an existing Cloudflare account on **Workers Free**, with no payment method or paid upgrade needed. Use the official Wrangler CLI. Commands below create only the resources used by this app:

```sh
pnpm dlx wrangler login
cd worker
pnpm dlx wrangler kv namespace create CACHE
```

Put the returned namespace ID in `worker/wrangler.toml`. Set `ALLOWED_ORIGINS` to the exact production HTTPS origin (comma-separated for additional trusted development/preview origins). Keep wildcard origins out. Set `CF_MODEL` to a current free-plan model, `AI_PROVIDER=cloudflare`, and `AI_ENABLED=true` only after bindings are ready.

```sh
# Enter a long random secret at the hidden prompt. Do not commit or print it.
pnpm dlx wrangler secret put HASH_SECRET
pnpm dlx wrangler deploy
```

The deployment creates the SQLite Durable Object migration. Configure the frontend's `VITE_CHAT_URL=https://YOUR-WORKER.workers.dev/api/chat` and rebuild. An atomic limit of six requests/minute for each hashed IP/session and a conservative 100 requests/day globally is the default. Counters reserve before provider usage (including malformed responses); requests fail closed if limiter or cache bindings are missing. No personal-data logs are enabled. CORS is not authentication; quotas and provider free-plan limits are the actual cost safeguards.

For Gemini: `AI_PROVIDER=gemini`, `GEMINI_MODEL=<verified free model>` and `wrangler secret put GEMINI_API_KEY`. For Groq: `AI_PROVIDER=groq`, `GROQ_MODEL=<verified free model>` and `wrangler secret put GROQ_API_KEY`. Keys are server secrets only. Do not turn on provider billing. A frontend and Worker data change should be deployed together so retrieved IDs remain in sync.

## PWA, offline and maps

Workbox precaches the shell, local JSON (including tariffs), decorative local images, font, and normal lazy page chunks. JSON uses stale-while-revalidate. Only same-origin images use bounded cache-first storage; remote business photos remain online and are not included in the offline pack. Only map tiles actually viewed are cached, with 150 entries and a seven-day expiration. App updates prompt before activating a new service worker.

**No bulk OpenStreetMap tile download is implemented.** The [OSM public tile usage policy](https://operations.osmfoundation.org/policies/tiles/) prohibits city/area prefetch for offline use. The download button saves directory records, local assets and fares; it does not promise an offline basemap. In airplane mode, cached tiles may appear, markers remain usable, and routes use clearly labeled straight-line estimates. A dotted line is not a road route. A full offline city basemap needs a provider or self-hosted tiles whose license and hosting terms explicitly permit it. `VITE_OFFLINE_TILE_URL` is reserved for that future adapter.

OSRM's public demo provides best-effort driving directions, not guaranteed transit schedules or availability. It has a six-second timeout and a straight-line fallback. No Google Places API is used. Google Maps is an ordinary external link. Geolocation is requested only on user action; denial falls back to the city plaza.

Install from the browser menu; on iPhone use Share → Add to Home Screen. Icons and a standalone manifest are included. Splash display is handled by each OS using manifest icons/background; custom per-device iOS splash artwork is not included.

## Hosting and SEO

The requested production host is **Vercel Hobby**, using the included `vercel.json` and a Vite build. Connect the repository, keep the project on the free plan, use `pnpm install --frozen-lockfile`, `pnpm build`, output `dist`, Node 24. Set `VITE_SITE_URL` to the final verified origin so sitemap/canonical URLs match it. No database or paid integration is necessary.

The build writes static per-listing HTML with individual title, description, Open Graph URL and canonical link. Fictional sample pages are `noindex` and deliberately do not publish false Restaurant structured data or fake review schema. Real sourced listings receive Restaurant JSON-LD without fabricated ratings, unknown prices or missing coordinates. A source record is not an owner verification. Robots and sitemap are generated. SPA navigation works through the Vercel rewrite.

The same `dist` can be hosted on Cloudflare Pages or Netlify free static hosting (add their SPA fallback if using them). GitHub Pages requires base-path handling and an SPA 404 fallback for deep URLs; Vercel is the configured target here. A Capacitor wrapper can consume the static build later.

## Privacy, limitations and quality

No analytics or ad trackers, no account requirement, no payments. Location stays local except exact route coordinates needed by OSRM when users request online directions. Cloud AI receives no automatic GPS. See the in-app privacy page for browser/third-party behavior. Reviews are local drafts pending moderation, not a synchronized community rating system. Owner claims are exported requests, not proof of ownership.

Core hours/search/fare/assistant tests, Worker guards and browser smoke tests are included. Lighthouse scores are targets and should not be claimed without a measured report for the deployment. On-device model downloads and genuine provider access depend on the visitor's hardware and the configured account; those cannot be verified by local unit tests alone.

Graphify's free workspace `fuji-s-workspace` has indexed this repository. Its dashboard successfully returned a grounded query about search, offline data and AI limits on 21 October 2026. Direct plugin calls still returned `403 no_workspace`, including workspace selection; they require the connector binding to be repaired. No measured token-savings claim is made. [AGENTS.md](AGENTS.md) records the workspace, repository ID and efficient fallback guidance for future work. See [upgrade verification](UPGRADE_REPORT.md) for checks and outstanding limits.
