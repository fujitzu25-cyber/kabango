import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const placeCount = ["restaurants", "tourist-spots", "services"].reduce(
  (count, name) =>
    count + JSON.parse(readFileSync(`public/data/${name}.json`, "utf8")).length,
  0,
);
test("unmapped destinations do not silently route to a different restaurant", async ({
  page,
}) => {
  await page.goto("/fare?trip=1&to=ayahay-bistro");
  await expect(
    page.getByRole("heading", { name: "Map pin unconfirmed" }),
  ).toBeVisible();
  await expect(page.locator(".fare-amount")).toHaveCount(0);
});
test("search, save and details persist locally", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /A little closer/ }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Search places, food or barangays" })
    .fill("Organiko");
  await expect(page.getByTestId("restaurant-card")).toHaveCount(1);
  await expect(page.locator(".card-photo img")).toHaveAttribute(
    "src",
    /foodpanda|deliveryhero/,
  );
  await page
    .getByRole("button", {
      name: "Save Organiko Coffee & Cocktails - Milza Homes Subdivision",
      exact: true,
    })
    .click();
  await page
    .getByRole("heading", {
      name: "Organiko Coffee & Cocktails - Milza Homes Subdivision",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "On the menu" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Published photos & sources" }),
  ).toBeVisible();
  await expect(page.locator(".status-pill")).toHaveText("Hours unconfirmed");
  await expect(
    page.getByRole("link", { name: "View published menu ↗" }),
  ).toHaveAttribute("href", /foodpanda/);
  await page.goto("/saved");
  await expect(
    page.getByRole("heading", {
      name: "Organiko Coffee & Cocktails - Milza Homes Subdivision",
    }),
  ).toBeVisible();
});
test("surprise picker can reroll and opens real detail", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Surprise me", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const first = await dialog.getByRole("heading", { level: 3 }).textContent();
  await dialog.getByRole("button", { name: "Pick another" }).click();
  await expect(dialog.getByRole("heading", { level: 3 })).not.toHaveText(
    first!,
  );
  await dialog.getByRole("link", { name: "View details", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Opening hours" }),
  ).toBeVisible();
});
test("reference fares use selected fuel band and missing values stay blank", async ({
  page,
}) => {
  await page.goto("/fare");
  await page.getByLabel("Route area").selectOption("Hilamonan");
  await page
    .getByRole("combobox", { name: "Starting from", exact: true })
    .selectOption("CCPA");
  await page
    .getByRole("combobox", { name: "Heading to", exact: true })
    .selectOption("hilamonan");
  await expect(page.locator(".fare-amount")).toHaveText("—");
  await page.getByLabel("Fuel price band (₱/liter)").selectOption("80to110");
  await expect(page.locator(".fare-amount")).toHaveText("₱28");
  await page.getByLabel("Passenger type").selectOption("student");
  await expect(page.locator(".fare-amount")).toHaveText("₱22");
});
test("assistant remains useful when cloud endpoint fails", async ({ page }) => {
  let called = false;
  await page.route("**/api/chat", (route) => {
    called = true;
    return route.fulfill({ status: 503, body: "unavailable" });
  });
  await page.goto("/ask");
  await page
    .getByRole("textbox", { name: "A coffee stop or a nature escape…" })
    .fill("Find a cafe");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.locator(".message.assistant")).toContainText(
    "source links",
  );
  await expect(page.locator(".chat-result")).toHaveCount(3);
  await expect(page.locator(".mode-badge")).toContainText("Local smart mode");
  expect(called).toBe(true);
});
test("production service worker supports offline reload, data and assistant", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.getByTestId("restaurant-card")).toHaveCount(placeCount);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId("restaurant-card")).toHaveCount(placeCount);
  await page.goto("/ask");
  await page
    .getByRole("textbox", { name: "A coffee stop or a nature escape…" })
    .fill("Find a cafe");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.locator(".message.assistant")).toContainText(
    "source links",
  );
  await context.setOffline(false);
});
test("mobile navigation fits without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".bottom-nav")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: ".local/mobile.png", fullPage: true });
});
