import { csvInfo, csvToJson, jsonToCsv, csvStats, csvFilter, csvSort, csvDedupe, csvSelect } from "./lib.mjs";
import { licenseStatus } from "./license.mjs";
import { writeFile, readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const t = tmpdir();
const csv = join(t, "vd_in.csv");
const js = join(t, "vd_out.json");
const csv2 = join(t, "vd_from_json.csv");
const filt = join(t, "vd_filt.csv");

let fail = 0;
const ok = (c, m) => { console.log((c ? "PASS" : "FAIL") + " — " + m); if (!c) fail++; };

await writeFile(csv, "name,age,city\nAna,30,Rome\nBeto,25,Lima\nCleo,40,Rome\n");

const info = await csvInfo(csv);
ok(/3 row\(s\), 3 column\(s\)/.test(info), "csv_info: " + info.split("\n")[0]);

await csvToJson(csv, js);
const arr = JSON.parse(await readFile(js, "utf8"));
ok(arr.length === 3 && arr[0].name === "Ana", "csv_to_json produced 3 records");

await jsonToCsv(js, csv2);
const back = await readFile(csv2, "utf8");
ok(/Beto/.test(back) && /city/.test(back), "json_to_csv round-trips");

const stats = await csvStats(csv, "age");
ok(/mean: 31\.6667/.test(stats), "csv_stats numeric mean: " + stats.split("\n")[1].trim());

const statsCat = await csvStats(csv, "city");
ok(/Rome \(2\)/.test(statsCat), "csv_stats categorical top: " + statsCat.split("\n")[1].trim());

await csvFilter(csv, "city", "==", "Rome", filt);
const fr = (await readFile(filt, "utf8")).trim().split("\n");
ok(fr.length === 3, "csv_filter kept 2 Rome rows (+header)");

// --- Pro tools ---
const srt = join(t, "vd_sort.csv"), dd = join(t, "vd_dd.csv"), sel = join(t, "vd_sel.csv");
await csvSort(csv, "age", "desc", srt);
const sr = (await readFile(srt, "utf8")).trim().split("\n");
ok(/Cleo/.test(sr[1]), "csv_sort desc by age -> Cleo(40) first");
await writeFile(join(t, "vd_dup.csv"), "name,age,city\nAna,30,Rome\nAna,30,Rome\nBeto,25,Lima\n");
await csvDedupe(join(t, "vd_dup.csv"), dd);
ok((await readFile(dd, "utf8")).trim().split("\n").length === 3, "csv_dedupe removed 1 dup (2 rows+header)");
await csvSelect(csv, "name,city", sel);
ok(/^name,city/.test((await readFile(sel, "utf8")).trim()), "csv_select kept name,city");

// --- license rail round-trip ---
const b64url = b => Buffer.from(b).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
async function sign(p) {
  const priv = JSON.parse(await readFile("./license_private_key.json", "utf8"));
  const k = await crypto.subtle.importKey("jwk", priv, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const data = new TextEncoder().encode(JSON.stringify(p));
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, k, data);
  return b64url(data) + "." + b64url(new Uint8Array(sig));
}
delete process.env.VAULTDATA_LICENSE;
ok((await licenseStatus()).pro === false, "license: pro=false without env");
process.env.VAULTDATA_LICENSE = await sign({ email: "t@t.io", plan: "pro", iat: Math.floor(Date.now() / 1000) });
ok((await licenseStatus()).pro === true, "license: pro=true with valid key");

for (const f of [csv, js, csv2, filt, srt, dd, sel, join(t, "vd_dup.csv")]) { try { await unlink(f); } catch {} }
console.log(fail ? `\n${fail} FAILED` : "\nALL PASS");
process.exit(fail ? 1 : 0);
