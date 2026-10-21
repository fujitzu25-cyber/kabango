# KabanGo public directory — 21 October 2026

69 source-backed listings; 30 have published owner or merchant images, 64 have source-provided map positions. This is a growing directory, not an exhaustive census or a guarantee that each business is currently operating.

Each `restaurants.json` record includes `sources` with the exact URL, source type, check date and limitations. `verified:false` means the owner has not confirmed the entry. A source check date records retrieval, not a visit or an owner verification.

## Sources and coverage

- OpenStreetMap contributors: named restaurant, cafe, fast-food, bar and bakery features within the city-proper bounding box 122.78,9.96,122.85,10.03. Community data can be old; building centres are approximate. [ODbL attribution and license](https://www.openstreetmap.org/copyright). Record-level node/way links are retained. This derived map portion is available under ODbL; the separate publisher records and images retain their respective rights.
- [foodpanda Kabankalan merchant directory](https://www.foodpanda.ph/city/kabankalan-city-negros-occidental): public merchant names, addresses, cuisine, listing coordinates and original image URLs. Nearby/duplicate records are merged only when identity and location can be matched. Separate branches retain separate records. Merchant images can be promotional food images rather than venue photographs. No review text or ratings imported.
- [City Government tourism directory](https://kabankalancity.gov.ph/tourism/resort-and-restaurants/): named businesses and published business contacts/addresses. Publication date unspecified.
- Official Jollibee branch locator, Mang Inasal locations, and Ayahay Bistro website: branch details and explicit owner-published links. Official details take precedence over directory information.
- Sluurpy, Waze and Negros Season of Culture: named cafe details, marked as secondary sources with limits.

## Unknown values and imagery

- `hours:[]` is unknown, never “closed.” A seven-day array uses Sunday first; an empty day within it means a documented closed day. Raw ambiguous schedules stay in `hoursText`, without an open-now claim.
- `priceLevel:0`, `maxGroupSize:0`, `rating:0`, `reviewCount:0` mean unpublished/unknown. They must not be rendered as a free meal, confirmed capacity or zero-star rating. No dine-in price data is fabricated.
- `lat:null,lng:null` excludes a place from pin-based distances and route estimates. A map-search link remains available.
- Third-party images stay at their original URL with credit and source links. No third-party image bytes are committed or bulk downloaded. The offline pack includes directory records, not remote publisher images. Failed images show a placeholder.
- Facebook official links and the owner-linked Ayahay menu post are provided; no logged-in personal Facebook data was used.

Update records and their check dates together. Do not run the fictional seed generator over this production directory. Use `pnpm validate:data` and the source/unknown-field tests before publishing changes.
