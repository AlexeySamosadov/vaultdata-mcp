import { csvInfo, csvToJson, jsonToCsv, csvStats, csvFilter } from "./lib.mjs";
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

for (const f of [csv, js, csv2, filt]) { try { await unlink(f); } catch {} }
console.log(fail ? `\n${fail} FAILED` : "\nALL PASS");
process.exit(fail ? 1 : 0);
