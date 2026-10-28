import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  rm,
  symlink,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  assertStagingPath,
  importGeoLeads,
  stageGeoLeads,
} from "./import-geoleads.mjs";

const date = "2026-10-28";
const row = {
  title: "Example Hotel",
  address: "Guanzon Street, Kabankalan City",
  categories: "Hotel",
  maps_url: "https://www.google.com/maps?cid=123",
  website: "https://hotel.example.org/",
  latitude: 9.99,
  longitude: 122.81,
};
const stage = (rows) => stageGeoLeads(rows, { collectedAt: date });

test("stages exact upstream business fields and source/date, dropping reviews, people, photos and enrichment", () => {
  const result = stage([
    {
      ...row,
      author_name: "Private Person",
      author_photo: "https://example.org/avatar",
      photos: 12,
      rating: 4.9,
      review_count: 88,
      opening_hours: "24 hours",
      phone: "123",
      email: "person@example.org",
      socials: "https://example.org/profile",
      arbitrary: "untrusted",
      __proto__: { injected: true },
    },
  ]);
  assert.equal(result.candidates.length, 1);
  assert.deepEqual(Object.keys(result.candidates[0]), [
    "rowNumber",
    "status",
    "name",
    "address",
    "category",
    "website",
    "sourceUrl",
    "collectedAt",
    "lat",
    "lng",
    "locationReviewRequired",
    "match",
    "warnings",
  ]);
  assert.equal(result.candidates[0].sourceUrl, row.maps_url);
  assert.equal(result.candidates[0].collectedAt, date);
  assert.equal(result.candidates[0].status, "needs-review");
});

test("rejects invalid source URLs, private website targets, credentials and protocols", () => {
  for (const maps_url of [
    "javascript:alert(1)",
    "https://google.com.evil.test/maps",
    "https://www.google.com/search?q=hotel",
    "https://user:password@www.google.com/maps?cid=1",
    "https://127.0.0.1/maps",
    "https://www.google.com:8443/maps",
  ])
    assert.equal(stage([{ ...row, maps_url }]).rejected.length, 1);
  for (const website of [
    "http://localhost/",
    "http://192.168.1.1/",
    "http://[::1]/",
    "http://company.local/",
    "https://user:password@example.org/",
    "file:///C:/secret",
    "https://example.org\n",
  ])
    assert.equal(stage([{ ...row, website }]).rejected.length, 1);
});

test("requires explicit Kabankalan address and valid coordinates without guessing missing pins", () => {
  for (const bad of [
    { address: "Bacolod City" },
    { latitude: 91 },
    { longitude: Infinity },
    { latitude: "9.99" },
    { longitude: undefined },
  ])
    assert.equal(stage([{ ...row, ...bad }]).rejected.length, 1);
  const missing = stage([{ ...row, latitude: undefined, longitude: undefined }])
    .candidates[0];
  assert.equal(missing.lat, null);
  assert.equal(missing.lng, null);
  const remote = stage([{ ...row, latitude: 9.8, longitude: 123.01 }])
    .candidates[0];
  assert.equal(remote.lat, null);
  assert.equal(remote.lng, null);
  assert.match(remote.warnings[0], /not the municipal boundary/);
});

test("matches existing IDs conservatively and flags conflicting exact source matches", () => {
  const existing = [
    {
      id: "known",
      name: "Different",
      address: "Other",
      googleMapsUrl: row.maps_url,
    },
    { id: "conflict", googleMapsUrl: row.maps_url },
  ];
  const exact = stageGeoLeads([row], { collectedAt: date, existing })
    .candidates[0];
  assert.deepEqual(exact.match, {
    method: "exact-source-url",
    existingIds: ["known", "conflict"],
  });
  const named = stageGeoLeads([row], {
    collectedAt: date,
    existing: [
      {
        id: "named",
        name: "EXAMPLE HOTEL",
        address: "Guanzon Street Kabankalan City",
        googleMapsUrl: "https://www.google.com/maps?cid=456",
      },
    ],
  }).candidates[0];
  assert.deepEqual(named.match, {
    method: "normalized-name-and-address",
    existingIds: ["named"],
  });
  const different = stageGeoLeads([row], {
    collectedAt: date,
    existing: [
      {
        id: "other-branch",
        name: row.title,
        address: "Another street, Kabankalan City",
      },
    ],
  }).candidates[0];
  assert.equal(different.match.method, "none");
});

test("deduplicates within an export by exact URL or normalized name AND address", () => {
  const result = stage([
    row,
    { ...row, title: "Other" },
    {
      ...row,
      maps_url: "https://www.google.com/maps?cid=456",
      title: "EXAMPLE HOTEL",
    },
  ]);
  assert.equal(result.candidates.length, 1);
  assert.deepEqual(result.duplicates, [
    { rowNumber: 2, duplicateOfRow: 1 },
    { rowNumber: 3, duplicateOfRow: 1 },
  ]);
});

test("requires a real explicit collection date and bounded JSON array", () => {
  for (const collectedAt of [undefined, "today", "2026-02-30", "2026-1-01"])
    assert.throws(
      () => stageGeoLeads([row], { collectedAt }),
      /collection date/,
    );
  assert.throws(() => stage({ data: [row] }), /JSON array/);
  assert.throws(() => stage(new Array(10001).fill(row)), /10000/);
  assert.equal(stage([{ ...row, title: "x".repeat(251) }]).rejected.length, 1);
  assert.equal(
    stage([
      { author_name: "Reviewer", photos: "https://example.org/review.jpg" },
    ]).rejected.length,
    1,
  );
});

test("writes only new ignored staging JSON, never overwrites public data or previous review", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "kabgo-geoleads-test-"));
  try {
    await mkdir(path.join(root, "public", "data"), { recursive: true });
    const source = JSON.stringify([
      {
        id: "existing",
        name: row.title,
        address: row.address,
        googleMapsUrl: row.maps_url,
      },
    ]);
    await writeFile(path.join(root, "public", "data", "places.json"), source);
    await writeFile(path.join(root, "input.json"), JSON.stringify([row]));
    for (const output of [
      "public/data/places.json",
      "../escape.json",
      ".local/../public/data/new.json",
      ".local",
      ".local/review.txt",
    ])
      await assert.rejects(assertStagingPath(root, output), /\.local/);
    const args = {
      root,
      input: "input.json",
      output: ".local/research/review.json",
      collectedAt: date,
    };
    const result = await importGeoLeads(args);
    assert.equal(result.candidates, 1);
    const review = JSON.parse(await readFile(result.output, "utf8"));
    assert.deepEqual(review.candidates[0].match.existingIds, ["existing"]);
    await assert.rejects(importGeoLeads(args), { code: "EEXIST" });
    assert.equal(
      await readFile(path.join(root, "public", "data", "places.json"), "utf8"),
      source,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects symlink/junction escapes under .local", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "kabgo-geoleads-links-"));
  try {
    await mkdir(path.join(root, ".local"));
    await mkdir(path.join(root, "public"));
    await symlink(
      path.join(root, "public"),
      path.join(root, ".local", "linked"),
      process.platform === "win32" ? "junction" : "dir",
    );
    await assert.rejects(
      assertStagingPath(root, ".local/linked/review.json"),
      /symbolic links or junctions/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
