// End-to-end check for Niche Explorer: create, observe, edit, search, persist, delete.
// Usage: BASE_URL=http://localhost:3000 node tests/e2e/niches.mjs
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
import assert from "node:assert/strict";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

await page.goto(`${BASE}/niches`);
await page.getByText("No niches yet").waitFor();

// Create
await page.getByRole("button", { name: "Create your first niche" }).click();
await page.getByRole("button", { name: "Create niche" }).click();
await page.getByText("Give the niche a name").waitFor(); // validation
await page.getByLabel("Niche name").fill("Homeschool planning");
await page.getByLabel("Description").fill("Planners for parents who homeschool.");
await page.getByRole("textbox", { name: "Sub-niches" }).fill("Charlotte Mason");
await page.keyboard.press("Enter");
await page.getByRole("textbox", { name: "Target audiences" }).fill("First-year homeschool parents");
await page.getByRole("button", { name: "Create niche" }).click();

// Detail opens; add an observation
const detail = page.getByRole("dialog", { name: "Homeschool planning" });
await detail.waitFor();
await detail.getByRole("button", { name: "Add observation" }).first().click();
await detail.getByLabel("Observation").fill("Top listings get complaints about dated layouts.");
await detail.getByLabel("Source URL").fill("not a url");
await detail.getByText("Enter a full URL").waitFor();
await detail.getByLabel("Source URL").fill("https://example.com/listing");
await detail.getByRole("button", { name: "Add observation" }).click();
await detail.getByText("Top listings get complaints").waitFor();
await detail.getByText("example.com").waitFor();

// Edit
await detail.getByRole("button", { name: "Edit niche" }).click();
await page.getByRole("dialog", { name: "Edit niche" }).getByLabel("Status").selectOption("promising");
await page.getByRole("button", { name: "Save changes" }).click();
await detail.getByText("Promising").waitFor();
await page.keyboard.press("Escape");
await detail.waitFor({ state: "detached" });

// Second niche, then search + filter
await page.getByRole("button", { name: "New niche" }).click();
await page.getByLabel("Niche name").fill("Wedding printables");
await page.getByRole("button", { name: "Create niche" }).click();
await page.keyboard.press("Escape");
await page.getByText("2 records").waitFor();
await page.getByRole("searchbox").fill("charlotte");
await page.getByText("1 of 2").waitFor();
await page.getByRole("searchbox").fill("");
await page.locator("select").filter({ hasText: "Status: All" }).selectOption("promising");
await page.getByText("1 of 2").waitFor();

// Persistence
await page.reload();
await page.getByText("2 records").waitFor();
await page.getByRole("button", { name: /Homeschool planning/ }).click();
await page.getByText("Top listings get complaints").waitFor();

// Delete
await page.getByRole("dialog", { name: "Homeschool planning" }).getByRole("button", { name: "Delete", exact: true }).click();
await page.getByRole("dialog", { name: "Delete niche?" }).getByRole("button", { name: "Delete", exact: true }).click();
await page.getByText("1 record").waitFor();
await page.reload();
await page.getByText("1 record").waitFor();
assert.equal(await page.getByText("Homeschool planning").count(), 0);

// Sidebar count + dashboard
await page.goto(`${BASE}/`);
await page.getByText("Researched niches").waitFor();
await page.getByText("Recent research").waitFor();

assert.deepEqual(errors, [], "console errors: " + errors.join("\n"));
console.log("niches e2e: OK");
await browser.close();
