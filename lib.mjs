import { readFile, writeFile } from "node:fs/promises";
import Papa from "papaparse";

async function readCsv(path) {
  const txt = await readFile(path, "utf8");
  const res = Papa.parse(txt.trim(), { header: true, skipEmptyLines: true });
  return res;
}

export async function csvInfo(path) {
  const res = await readCsv(path);
  const fields = res.meta.fields || [];
  const sample = res.data.slice(0, 3);
  return [
    `${res.data.length} row(s), ${fields.length} column(s)`,
    `columns: ${fields.join(", ")}`,
    `sample (first ${sample.length}): ${JSON.stringify(sample)}`
  ].join("\n");
}

export async function csvToJson(input, output) {
  const res = await readCsv(input);
  await writeFile(output, JSON.stringify(res.data, null, 2));
  return `Wrote ${res.data.length} record(s) → ${output}`;
}

export async function jsonToCsv(input, output) {
  const arr = JSON.parse(await readFile(input, "utf8"));
  if (!Array.isArray(arr)) throw new Error("Input JSON must be an array of objects");
  await writeFile(output, Papa.unparse(arr));
  return `Wrote ${arr.length} row(s) → ${output}`;
}

export async function csvStats(input, column) {
  const res = await readCsv(input);
  const fields = res.meta.fields || [];
  if (!fields.includes(column)) throw new Error(`Column "${column}" not found. Columns: ${fields.join(", ")}`);
  const vals = res.data.map(r => r[column]).filter(v => v !== undefined && v !== null && v !== "");
  const nums = vals.map(Number).filter(v => !Number.isNaN(v));
  if (nums.length && nums.length === vals.length) {
    const sum = nums.reduce((a, b) => a + b, 0);
    return [
      `column "${column}" — numeric, ${nums.length} value(s)`,
      `  sum:  ${sum}`,
      `  mean: ${(sum / nums.length).toFixed(4)}`,
      `  min:  ${Math.min(...nums)}`,
      `  max:  ${Math.max(...nums)}`
    ].join("\n");
  }
  const counts = {};
  for (const v of vals) counts[v] = (counts[v] || 0) + 1;
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  return [
    `column "${column}" — categorical, ${vals.length} value(s), ${Object.keys(counts).length} unique`,
    `  top: ${top.map(([k, c]) => `${k} (${c})`).join(", ")}`
  ].join("\n");
}

export async function csvFilter(input, column, op, value, output) {
  const res = await readCsv(input);
  const fields = res.meta.fields || [];
  if (!fields.includes(column)) throw new Error(`Column "${column}" not found. Columns: ${fields.join(", ")}`);
  const test = (cell) => {
    const c = cell == null ? "" : String(cell);
    switch (op) {
      case "==": return c === String(value);
      case "!=": return c !== String(value);
      case "contains": return c.includes(String(value));
      case ">": return Number(c) > Number(value);
      case "<": return Number(c) < Number(value);
      case ">=": return Number(c) >= Number(value);
      case "<=": return Number(c) <= Number(value);
      default: throw new Error("op must be one of: ==, !=, contains, >, <, >=, <=");
    }
  };
  const kept = res.data.filter(r => test(r[column]));
  await writeFile(output, Papa.unparse(kept));
  return `Filtered ${res.data.length} → ${kept.length} row(s) where ${column} ${op} ${value} → ${output}`;
}
