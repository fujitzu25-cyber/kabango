import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const directory = ["restaurants", "tourist-spots", "services"].flatMap((name) =>
  JSON.parse(readFileSync(`public/data/${name}.json`, "utf8")),
) as {
  kind: string;
  slug: string;
  name: string;
  secondaryKinds?: string[];
  photos: string[];
  photoSourceUrl?: string;
}[];
test("unavailable publisher photos show an honest placeholder", async ({
  page,
}) => {
  await page.route(
    /https:\/\/(images\.deliveryhero\.io|foodpanda\.dhmedia\.io)\//,
    (r) => r.abort(),
  );
  await page.goto("/?q=Organiko");
  await expect(page.locator(".place-placeholder").first()).toContainText(
    "Photo not available",
  );
  await expect(
    page.getByRole("heading", {
      name: "Organiko Coffee & Cocktails - Milza Homes Subdivision",
      exact: true,
    }),
  ).toBeVisible();
});
test("tourist browsing, autocomplete keyboard and browser Back stay in sync", async ({
  page,
}) => {
  await page.goto("/attractions");
  await expect(page.getByTestId("restaurant-card")).toHaveCount(12);
  await page.getByRole("button", { name: "All places", exact: true }).click();
  await expect(page.getByTestId("restaurant-card")).toHaveCount(
    directory.length,
  );
  const input = page.getByRole("combobox", {
    name: "Search places, food or barangays",
  });
  await input.fill("Mag-a");
  await expect(
    page.getByRole("option", { name: "Mag-aso Falls", exact: true }),
  ).toBeVisible();
  await input.press("ArrowDown");
  await input.press("Enter");
  await expect(page).toHaveURL(/q=Mag-aso/);
  await expect(input).toHaveValue("Mag-aso Falls");
  await page
    .getByRole("heading", { name: "Mag-aso Falls", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Plan your visit", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "On the menu" })).toHaveCount(
    0,
  );
  await page.goBack();
  await expect(input).toHaveValue("Mag-aso Falls");
  await page.goBack();
  await expect(input).toHaveValue("");
});
test("hotel and fuel tabs show appropriate details and external public reviews", async ({
  page,
}) => {
  await page.goto("/");
  for (const [kind, label] of [
    ["hotel", "Hotels"],
    ["fuel", "Fuel stations"],
  ]) {
    const items = directory.filter(
      (r) => r.kind === kind || r.secondaryKinds?.includes(kind),
    );
    expect(items.length).toBeGreaterThan(0);
    await page.getByRole("button", { name: label, exact: true }).click();
    await expect(page.getByTestId("restaurant-card")).toHaveCount(items.length);
    await page.goto(`/place/${items[0].slug}`);
    await expect(
      page.getByRole("heading", { name: "On the menu", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Public reviews", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", {
        name: /Find place & reviews on Google Maps|Open this place on Google Maps/,
      }),
    ).toHaveAttribute("href", /https:\/\/(?:www\.)?google\.com\/maps/);
    await expect(
      page.getByRole("heading", { name: "Plan your visit", exact: true }),
    ).toBeVisible();
    await page.goto("/");
  }
});
test("unembedded venue photos link to the actual publisher gallery", async ({
  page,
}) => {
  const place = directory.find((r) => r.photoSourceUrl && !r.photos.length);
  expect(place).toBeTruthy();
  await page.goto(`/place/${place!.slug}`);
  await expect(
    page.getByRole("link", {
      name: "View publisher photo gallery ↗",
      exact: true,
    }),
  ).toHaveAttribute("href", place!.photoSourceUrl!);
  await expect(page.locator(".gallery .place-placeholder")).toBeVisible();
});
test("saving supports Undo and shared links ignore unknown IDs", async ({
  page,
}) => {
  await page.goto("/place/mag-aso-falls");
  const save = page.getByRole("button", {
    name: "Save Mag-aso Falls",
    exact: true,
  });
  await save.click();
  await expect(
    page.getByRole("button", { name: "Unsave Mag-aso Falls", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(save).toBeVisible();
  await page.goto("/saved?ids=visit-mag-aso-falls,not-a-place");
  await expect(page.getByTestId("restaurant-card")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "A shared Kabankalan adventure." }),
  ).toBeVisible();
  await expect(page.getByLabel("Private note · this device only")).toHaveCount(
    0,
  );
});
test("chat panel keeps browsing location and closes with Escape", async ({
  page,
}) => {
  await page.goto("/attractions");
  await page
    .locator(".desktop-nav")
    .getByRole("link", { name: /Ask KabGo/ })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("heading", { name: "Where shall we go?" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/attractions$/);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});
test("place suggestions are private drafts and script-like text stays inert", async ({
  page,
}) => {
  let posted = false;
  page.on("request", (r) => {
    if (r.method() === "POST") posted = true;
  });
  await page.goto("/community");
  await page
    .getByLabel("Place name", { exact: true })
    .fill("<img src=x onerror=alert(1)>");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByLabel("Barangay / address").fill("Poblacion, Kabankalan");
  await page
    .getByLabel("Details, address, and what we should know")
    .fill("A proposed place. Please check this information before adding it.");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "<img src=x onerror=alert(1)>",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".draft-summary img")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Save local draft", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Draft saved on this device" }),
  ).toBeVisible();
  expect(posted).toBe(false);
});
