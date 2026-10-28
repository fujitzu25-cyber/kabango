# KabGo public directory — 28 October 2026

107 publicly sourced places: 83 food listings, 12 destinations, 5 additional accommodation listings and 7 gasoline stations. Zaycoland also appears in the hotel filter through its existing destination record, preserving saved IDs. 31 places have published images and 69 have source-provided map positions. Source checks span 21–28 October 2026; see each record. This is a growing directory, not an exhaustive census or a guarantee that each place is currently operating or accessible.

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
- Merchant images stay at their original URL with credit and source links; their bytes are not committed or bulk downloaded. The offline pack includes directory records and the licensed Mag-aso image, not remote merchant images. Failed images show a placeholder.
- Facebook official links and the owner-linked Ayahay menu post are provided; no logged-in personal Facebook data was used.

Update records and their check dates together. Do not run the fictional seed generator over this production directory. Use `pnpm validate:data` and the source/unknown-field tests before publishing changes.

## 28 October directory update

- Re-fetched the central OpenStreetMap rectangle and compared the 40 named food features with the prior snapshot. Their tags were unchanged. The new retrieval dates do not establish that those businesses are still operating. Other existing source dates were preserved.
- Added Café Haynato from its owner website, 11 cafés/restaurants/bars supported by public business directories, and two separately addressed foodpanda merchants (JM Shawarma at ROB SPM and Goldilocks on Guanzon Street). Directory copies of Facebook posts are marked `directory`, not owner verification. Historical posts and conflicting addresses remain disclosed. Café Haynato's Tuesday–Sunday schedule is raw text because Monday is unspecified.
- `services.json` adds accommodation from the city directory and Rozay's host/property listings; Shell from official station pages; Petro Gazz from its official directory; Petron from its December 2025 station list; and Caltex from its participating-station list. Shell forecourt hours are distinct from shop hours. Pump prices and room availability are never inferred. Southgate's conflicting telephone is omitted.
- New hotel/station images are not copied without suitable rights. Where verified, external publisher-gallery links let visitors see the actual property photos. Existing photo credits and Mag-aso's CC BY-SA license remain intact; missing images remain visibly unavailable.
- Google Maps reviews are reached through an external search/place link with a branch-confirmation notice. No review text, reviewer identities or Google ratings were imported. No Google API or billing was enabled. Leaflet remains the map display library, not a business-data provider.
- GeoLeadScraper was reviewed as an optional free local collection tool. Its ordinary `photos` field is a count, not an image feed. A private staging importer is documented in `docs/geoleads-import.md`; it does not overwrite production data. The extension was not installed or used for this release, per the user's instruction to continue without it. No scraping backend is deployed.

## Tourist destinations

`tourist-spots.json` adds Mag-aso Falls and Cave, Balicaocao Eco Park, Carol-an Valley, Udlom Cave, Denden Farm, Inapoy Ostrich Farm, the cathedral, city plaza, old city hall, Zaycoland and Plumeria. The [city eco-tourism directory](https://kabankalancity.gov.ph/tourism/eco-tourism/) names the first seven. The [city resort directory](https://kabankalancity.gov.ph/tourism/resort-and-restaurants/) supplies resort addresses and published contacts. Mag-aso Falls is in Oringao, confirmed by the [barangay page](https://kabankalancity.gov.ph/barangay/barangay-oringao/). Four landmark/resort positions come from linked OSM features. Other positions remain null; named destinations are not enough to infer an entrance or driving route. Admission, opening hours and current access are unconfirmed, not assumed free.

The real Mag-aso Falls photograph is by **Godopeta7410**, [original file and license](https://commons.wikimedia.org/wiki/File:Mag-asoFallsKabankalanNegrosOcc.jpg), **CC BY-SA 4.0**. Local WebP versions are resized/recompressed derivatives under that same license. The hero also uses this image, with credit linked from the footer. No generated or unrelated stock image is presented as a tourist destination.
