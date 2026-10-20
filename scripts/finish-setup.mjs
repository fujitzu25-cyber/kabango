import fs from "node:fs/promises";
const entries = {
  previousPhoto: "Previous photo",
  nextPhoto: "Next photo",
  tariffTab: "Tricycle fare tables",
  tripTab: "Trip estimate",
  tariffTitle: "Know before you ride",
  tariffIntro:
    "Select the exact route and fuel band from the supplied city fare reference. Amounts below are copied from the printed tables.",
  routeArea: "Route area",
  allAreas: "All route areas",
  chooseOrigin: "Choose starting point",
  chooseDestination: "Choose destination",
  fuelBand: "Fuel price band (₱/liter)",
  chooseFuel: "Select the applicable fuel band",
  fuelNote:
    "The current fuel band is not detected automatically. Confirm which band is in force with the city or operator.",
  tariffSource:
    "Transcribed from your screenshots of City Ordinance 2026-006, received October 20, 2026. Validity and effective date have not been independently verified.",
  listedFare: "Listed tricycle fare",
  chooseRouteFuel: "Choose a starting point, destination and fuel band.",
  missingTariff:
    "This fuel band is missing from the supplied reference. No fare has been inferred.",
  tariffDisclaimer:
    "Reference amount only, for the exact printed endpoints and fuel band. Confirm the applicable tariff and any add-on with the operator. Reverse trips and private/special hires are not inferred.",
  allBands: "All listed fuel bands",
  discounted: "Senior / PWD / student",
  tariffEndpoints:
    "CPPA and CCPA are retained exactly as printed. The source has two columns labeled From; the app presents them as starting point and destination without expanding the acronyms.",
  downloadTariffs: "Download transcribed fare data",
  tripSampleNote:
    "Distance-based figures below are illustrative, not the city tricycle tariff. For the supplied route fares, use Tricycle fare tables.",
  heroFloatTitle: "Made for your cravings",
  heroFloatCaption: "A little taste of Kabankalan",
  photoIllustrative: "Illustrative photo",
  modelDisclaimer: "No model download starts until you agree.",
};
for (const lang of ["en", "hil", "fil"]) {
  const file = `src/locales/${lang}.json`;
  const data = JSON.parse(await fs.readFile(file, "utf8"));
  if (lang === "en") Object.assign(data, entries);
  if (lang === "hil")
    Object.assign(data, {
      tariffTab: "Mga plete sang tricycle",
      tripTab: "Banabana sang biyahe",
      tariffTitle: "Hibalua antes magsakay",
      routeArea: "Lugar sang ruta",
      chooseOrigin: "Pilia ang ginhalinan",
      chooseDestination: "Pilia ang kadtuan",
      fuelBand: "Presyo sang krudo (₱/litro)",
      chooseFuel: "Pilia ang sakto nga presyo sang krudo",
      listedFare: "Plete sa gin hatag nga lista",
      missingTariff:
        "Wala ini nga fuel band sa gin hatag nga reference. Wala sang gin banabana nga plete.",
      allBands: "Tanan nga fuel band",
      discounted: "Senior / PWD / estudyante",
      downloadTariffs: "I-download ang lista sang plete",
    });
  if (lang === "fil")
    Object.assign(data, {
      tariffTab: "Mga pamasahe sa tricycle",
      tripTab: "Tantiya sa biyahe",
      tariffTitle: "Alamin bago sumakay",
      routeArea: "Lugar ng ruta",
      chooseOrigin: "Piliin ang pinanggalingan",
      chooseDestination: "Piliin ang pupuntahan",
      fuelBand: "Presyo ng gasolina (₱/litro)",
      chooseFuel: "Piliin ang naaangkop na presyo ng gasolina",
      listedFare: "Pamasahe sa ibinigay na talaan",
      missingTariff:
        "Wala ang fuel band na ito sa ibinigay na reference. Walang hinulaang pamasahe.",
      allBands: "Lahat ng fuel band",
      discounted: "Senior / PWD / estudyante",
      downloadTariffs: "I-download ang talaan ng pamasahe",
    });
  await fs.writeFile(file, JSON.stringify(data, null, 2) + "\n");
}
await fs.mkdir("public/fonts", { recursive: true });
try {
  await fs.access("public/fonts/inter.woff2");
} catch {
  const res = await fetch(
    "https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap",
    { headers: { "User-Agent": "Mozilla/5.0" } },
  );
  const css = await res.text();
  const urls = [...css.matchAll(/url\((https:[^)]+)\)/g)].map((m) => m[1]);
  if (!urls.length) throw new Error("Font unavailable");
  const font = await fetch(urls.at(-1));
  if (!font.ok) throw new Error("Font unavailable");
  await fs.writeFile(
    "public/fonts/inter.woff2",
    new Uint8Array(await font.arrayBuffer()),
  );
}
