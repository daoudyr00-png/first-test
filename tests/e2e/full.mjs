// Full end-to-end workflow across every module.
// Usage: BASE_URL=http://localhost:3000 node tests/e2e/full.mjs [screenshotDir]
import { createRequire } from "node:module";
import assert from "node:assert/strict";
import fs from "node:fs";
const { chromium } = createRequire(import.meta.url)("playwright");

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const SHOTS = process.argv[2];
const browser = await chromium.launch();
const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
const shot = async (name) => SHOTS && page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
const dialog = (name) => page.getByRole("dialog", { name });
const step = (s) => console.log("•", s);

async function readDownload(trigger) {
  const [dl] = await Promise.all([page.waitForEvent("download"), trigger()]);
  return { name: dl.suggestedFilename(), text: fs.readFileSync(await dl.path(), "utf8") };
}

try {
await page.goto(`${BASE}/`);
await page.getByText("Build your evidence base").waitFor();
await shot("01-dashboard-empty");

step("Niche");
await page.goto(`${BASE}/niches`);
await page.getByRole("button", { name: "New niche" }).click();
await page.getByLabel("Niche name").fill("Homeschool planning");
await page.getByRole("textbox", { name: "Target audiences" }).fill("First-year homeschool parents");
await page.keyboard.press("Enter");
await page.getByRole("button", { name: "Create niche" }).click();
await dialog("Homeschool planning").getByRole("button", { name: "Add observation" }).click();
await dialog("Homeschool planning").getByLabel("Observation").fill("Reviews ask for undated layouts.");
await dialog("Homeschool planning").getByRole("button", { name: "Add observation" }).click();
await page.keyboard.press("Escape");

step("Problem");
await page.goto(`${BASE}/problems`);
await page.getByText("No problems logged yet").waitFor();
await page.getByRole("button", { name: "Log problem" }).click();
const pf = dialog("Log a problem");
await pf.getByLabel("Problem title").fill("Planning lessons for multiple kids");
await pf.getByLabel("Niche").selectOption({ label: "Homeschool planning" });
await pf.getByLabel("Target audience").fill("Parents of 3+ kids");
await pf.getByRole("radiogroup", { name: "Pain level" }).getByRole("radio", { name: "5" }).click();
await pf.getByText("Urgent / severe").waitFor();
await pf.getByRole("radiogroup", { name: "Willingness to pay" }).getByRole("radio", { name: "4" }).click();
await pf.getByLabel("Evidence").fill('"I spend every Sunday juggling three planners"');
await pf.getByRole("textbox", { name: "Source URLs" }).fill("https://www.reddit.com/r/homeschool/example");
await pf.getByRole("button", { name: "Add source urls" }).click();
await pf.getByRole("button", { name: "Save problem" }).click();
await page.getByRole("cell", { name: /Planning lessons for multiple kids/ }).first().waitFor();
// second problem without sources, then filter
await page.getByRole("button", { name: "Log problem" }).click();
await dialog("Log a problem").getByLabel("Problem title").fill("Low-priority annoyance");
await dialog("Log a problem").getByRole("button", { name: "Save problem" }).click();
await page.getByText("2 records").waitFor();
await page.locator("select").filter({ hasText: "Sources: All" }).selectOption("yes");
await page.getByText("1 of 2").waitFor();
await page.locator("select").filter({ hasText: "Sources:" }).selectOption("");
// sorting by pain toggles order
await page.getByRole("button", { name: "Pain" }).click();
let first = await page.locator("tbody tr").first().innerText();
assert.match(first, /Low-priority/);
await page.getByRole("button", { name: "Pain" }).click();
first = await page.locator("tbody tr").first().innerText();
assert.match(first, /Planning lessons/);
// edit via row action
await page.getByRole("button", { name: "Edit Low-priority annoyance" }).click();
await dialog("Edit problem").getByLabel("Problem title").fill("Minor annoyance (edited)");
await dialog("Edit problem").getByRole("button", { name: "Save changes" }).click();
await page.getByText("Minor annoyance (edited)").waitFor();
await shot("02-problems");

step("Competitor");
await page.goto(`${BASE}/competitors`);
await page.getByRole("button", { name: "Add competitor" }).click();
const cf = dialog("Add competitor");
await cf.getByLabel("Competitor (shop / brand)").fill("PlannerShop");
await cf.getByLabel("Product name").fill("Family Homeschool Planner");
await cf.getByLabel("Price (USD)").fill("abc");
await cf.getByRole("button", { name: "Save competitor" }).click();
await cf.getByText("Enter a valid price").waitFor();
await cf.getByLabel("Price (USD)").fill("12.50");
await cf.getByLabel("Niche").selectOption({ label: "Homeschool planning" });
await cf.getByLabel("Differentiation opportunities").fill("Undated, per-child tabs");
await cf.getByRole("button", { name: "Save competitor" }).click();
await page.getByText("$12.50").first().waitFor();
await page.getByRole("button", { name: "Add competitor" }).click();
await dialog("Add competitor").getByLabel("Competitor (shop / brand)").fill("Other");
await dialog("Add competitor").getByLabel("Product name").fill("Budget planner");
await dialog("Add competitor").getByLabel("Price (USD)").fill("4");
await dialog("Add competitor").getByRole("button", { name: "Save competitor" }).click();
await page.getByText("$8.25").waitFor(); // median of 4 and 12.50
await shot("03-competitors");

step("Keyword");
await page.goto(`${BASE}/keywords`);
await page.getByRole("button", { name: "Add keyword" }).click();
await dialog("Add keyword").getByLabel("Keyword").fill("homeschool planner printable");
await dialog("Add keyword").getByLabel("Competition (your assessment)").selectOption("medium");
await dialog("Add keyword").getByLabel("Niche").selectOption({ label: "Homeschool planning" });
await dialog("Add keyword").getByRole("button", { name: "Save keyword" }).click();
await page.getByRole("button", { name: "Add keyword" }).click();
await dialog("Add keyword").getByLabel("Keyword").fill("Homeschool Planner Printable ");
await dialog("Add keyword").getByLabel("Niche").selectOption({ label: "Homeschool planning" });
await dialog("Add keyword").getByText("already logged").waitFor();
await page.keyboard.press("Escape");
await page.getByText("1 record").waitFor();

step("Scoring (from problem deep link)");
await page.goto(`${BASE}/problems`);
await page.getByRole("cell", { name: /Planning lessons for multiple kids/ }).first().click();
await dialog("Planning lessons for multiple kids").getByRole("link", { name: "Score this problem" }).click();
const of = dialog("Score an opportunity");
await of.waitFor();
assert.equal(await of.getByLabel("Opportunity").inputValue(), "Planning lessons for multiple kids");
// research context is shown from real records
await of.getByText("Problem “Planning lessons for multiple kids”: pain 5/5").waitFor();
await of.getByText("1 competitor product(s) logged in this niche").waitFor();
await of.getByText("1 competitor(s) with a noted differentiation opportunity").waitFor();
await of.getByText("Competitor prices you recorded: 1 listing(s)").waitFor();
const rate = async (label, n) => of.getByRole("radiogroup", { name: "Rating" }).nth(label).getByRole("radio", { name: String(n), exact: true }).click();
await rate(0, 4); // demand 4 -> 20
await rate(1, 4); // pain 4 -> 16
await rate(2, 3); // competition 3 -> 12
await rate(3, 3); // wtp 3 -> 12
await of.getByText("4 of 5 criteria rated").waitFor();
await rate(4, 5); // feasibility 5 -> 15
await of.getByLabel("Reasoning").first().fill("Reddit threads + reviews");
await of.getByText("4 rating(s) without reasoning").waitFor();
await shot("04-scoring-form");
await of.getByRole("button", { name: "Save score" }).click();
const od = dialog("Planning lessons for multiple kids");
await od.getByText("Total opportunity score").waitFor();
assert.match(await od.locator("tfoot").innerText(), /75/);
await shot("05-scoring-detail");

step("Product idea (from opportunity deep link)");
await od.getByRole("link", { name: "Create product idea" }).click();
const idf = dialog("New product idea");
await idf.waitFor();
assert.equal(await idf.getByLabel("Product name").inputValue(), "Planning lessons for multiple kids");
assert.equal(await idf.getByLabel("Target customer").inputValue(), "Parents of 3+ kids");
await idf.getByLabel("Product name").fill("Multi-Child Undated Planner");
await idf.getByLabel("Unique selling proposition").fill("One spread per child, undated");
await idf.getByRole("button", { name: "Save idea" }).click();
await page.getByRole("cell", { name: /Multi-Child Undated Planner/ }).first().waitFor();
await page.getByRole("row", { name: /Multi-Child/ }).getByText("75").waitFor();
await page.getByRole("button", { name: "Board" }).click();
await page.getByLabel("Move Multi-Child Undated Planner").selectOption("validating");
await page.getByRole("region", { name: "Validating" }).getByText("Multi-Child Undated Planner").waitFor();
await shot("06-ideas-board");
await page.reload();
await page.getByRole("region", { name: "Validating" }).getByText("Multi-Child Undated Planner").waitFor(); // view + data persisted

step("Score sync: editing the opportunity updates the idea");
await page.goto(`${BASE}/scoring`);
await page.getByRole("button", { name: "Edit Planning lessons for multiple kids" }).click();
await dialog("Edit opportunity score").getByRole("radiogroup", { name: "Rating" }).nth(4).getByRole("radio", { name: "0", exact: true }).click();
await dialog("Edit opportunity score").getByRole("button", { name: "Save changes" }).click();
await page.getByRole("row", { name: /Planning lessons/ }).getByText("60").waitFor();
await page.goto(`${BASE}/ideas`);
await page.getByRole("region", { name: "Validating" }).getByText("60").waitFor();

step("Dashboard");
await page.goto(`${BASE}/`);
await page.getByText("Best opportunities").waitFor();
await page.getByRole("link", { name: "Planning lessons for multiple kids" }).first().waitFor();
await page.getByText("Idea pipeline").waitFor();
await page.getByText("Average score 60").waitFor();
await shot("07-dashboard");

step("CSV + JSON export");
await page.goto(`${BASE}/problems`);
await page.getByRole("button", { name: "Export" }).click();
const csv = await readDownload(() => page.getByRole("menuitem", { name: "Export as CSV" }).click());
assert.match(csv.name, /^problems-\d{4}-\d{2}-\d{2}\.csv$/);
assert.match(csv.text, /Planning lessons for multiple kids,Homeschool planning,Parents of 3\+ kids/);
assert.match(csv.text, /"""I spend every Sunday juggling three planners"""/);
await page.getByRole("button", { name: "Export" }).click();
const json = await readDownload(() => page.getByRole("menuitem", { name: "Export as JSON" }).click());
assert.equal(JSON.parse(json.text).length, 2);
await page.goto(`${BASE}/scoring`);
await page.getByRole("button", { name: "Export" }).click();
const scsv = await readDownload(() => page.getByRole("menuitem", { name: "Export as CSV" }).click());
assert.match(scsv.text, /Demand evidence reasoning/);
assert.match(scsv.text, /,60,Moderate,5\/5,/);

step("Backup, clear, restore");
await page.goto(`${BASE}/data`);
const backup = await readDownload(() => page.getByRole("button", { name: "Download backup" }).click());
const backupPath = `${process.env.TMPDIR ?? "/tmp"}/pof-backup-test.json`;
fs.writeFileSync(backupPath, backup.text);
await page.getByRole("button", { name: "Clear all data" }).click();
await dialog("Clear all data?").getByRole("button", { name: "Delete everything" }).click();
await page.getByText("All data cleared.").waitFor();
await page.goto(`${BASE}/problems`);
await page.getByText("No problems logged yet").waitFor();
await page.goto(`${BASE}/data`);
await page.getByLabel("Backup file").setInputFiles(backupPath);
await dialog("Replace all data?").getByRole("button", { name: "Replace data" }).click();
await page.getByText(/Restored \d+ records/).waitFor();
await page.reload();
await page.goto(`${BASE}/ideas`);
await page.getByText("Multi-Child Undated Planner").waitFor();
// invalid import
await page.goto(`${BASE}/data`);
fs.writeFileSync(backupPath, "{\"hello\":1}");
await page.getByLabel("Backup file").setInputFiles(backupPath);
await page.getByText(/Couldn't import/).waitFor();
fs.unlinkSync(backupPath);

step("Cascade: deleting a niche unlinks, keeps children");
await page.goto(`${BASE}/niches`);
await page.getByRole("button", { name: /Homeschool planning/ }).click();
await dialog("Homeschool planning").getByRole("button", { name: "Delete", exact: true }).click();
await dialog("Delete niche?").getByText(/linked record\(s\) will be kept/).waitFor();
await dialog("Delete niche?").getByRole("button", { name: "Delete", exact: true }).click();
await page.goto(`${BASE}/problems`);
await page.getByText("2 records").waitFor();
const db = await page.evaluate(() => JSON.parse(localStorage.getItem("pof:v1:problems")));
assert.ok(db.every((p) => p.nicheId === null));

step("Delete via row action");
await page.getByRole("button", { name: "Delete Minor annoyance (edited)" }).click();
await dialog("Delete problem?").getByRole("button", { name: "Delete", exact: true }).click();
await page.getByText("1 record").waitFor();

step("Mobile layout");
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const m = await mobile.newPage();
m.on("pageerror", (e) => errors.push(e.message));
await m.goto(`${BASE}/`);
for (const p of ["/", "/niches", "/problems", "/competitors", "/keywords", "/scoring", "/ideas", "/data"]) {
  await m.goto(`${BASE}${p}`);
  await m.waitForLoadState("networkidle");
  const overflow = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(overflow <= 0, `horizontal page overflow on ${p}: ${overflow}px`);
}
await m.getByRole("button", { name: "Open navigation" }).click();
await m.getByRole("link", { name: /Keyword Research/ }).click();
await m.waitForURL(/\/keywords/);
if (SHOTS) await m.screenshot({ path: `${SHOTS}/08-mobile-keywords.png`, fullPage: true });
await m.goto(`${BASE}/`);
if (SHOTS) await m.screenshot({ path: `${SHOTS}/09-mobile-dashboard.png`, fullPage: true });
await mobile.close();

} catch (e) {
  await page.screenshot({ path: `${SHOTS ?? "."}/failure.png`, fullPage: true }).catch(() => {});
  console.error("Console errors so far:", errors);
  throw e;
}

assert.deepEqual(errors, [], "console errors:\n" + errors.join("\n"));
console.log("full e2e: OK");
await browser.close();
