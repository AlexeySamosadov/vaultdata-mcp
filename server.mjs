#!/usr/bin/env node
/**
 * VaultData MCP — local CSV/JSON tools for AI agents (Claude, ChatGPT Apps, any MCP host).
 * Data is read and written on the local machine; nothing is uploaded.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { csvInfo, csvToJson, jsonToCsv, csvStats, csvFilter, csvSort, csvDedupe, csvSelect } from "./lib.mjs";
import { licenseStatus, upgradeMessage } from "./license.mjs";

const server = new McpServer({ name: "vaultdata-mcp", version: "0.2.0" });
const text = t => ({ content: [{ type: "text", text: t }] });
const wrap = fn => async (args) => {
  try { return text(await fn(args)); }
  catch (e) { return { isError: true, content: [{ type: "text", text: "Error: " + e.message }] }; }
};
const pro = fn => async (args) => {
  const st = await licenseStatus();
  if (!st.pro) return text(upgradeMessage(st.reason));
  try { return text(await fn(args)); }
  catch (e) { return { isError: true, content: [{ type: "text", text: "Error: " + e.message }] }; }
};

server.registerTool("csv_info", {
  title: "CSV info",
  description: "Return row count, column names and a small sample from a local CSV file.",
  inputSchema: { path: z.string().describe("Absolute path to the CSV file") }
}, wrap(({ path }) => csvInfo(path)));

server.registerTool("csv_to_json", {
  title: "CSV to JSON",
  description: "Convert a local CSV file to a JSON array of objects.",
  inputSchema: {
    input: z.string().describe("Absolute path to the source CSV"),
    output: z.string().describe("Absolute path to write the JSON")
  }
}, wrap(({ input, output }) => csvToJson(input, output)));

server.registerTool("json_to_csv", {
  title: "JSON to CSV",
  description: "Convert a local JSON file (array of objects) to CSV.",
  inputSchema: {
    input: z.string().describe("Absolute path to the source JSON (array of objects)"),
    output: z.string().describe("Absolute path to write the CSV")
  }
}, wrap(({ input, output }) => jsonToCsv(input, output)));

server.registerTool("csv_stats", {
  title: "CSV column stats",
  description: "Summarize a column of a local CSV: sum/mean/min/max for numeric columns, or top value counts for categorical columns.",
  inputSchema: {
    input: z.string().describe("Absolute path to the CSV"),
    column: z.string().describe("Column name to summarize")
  }
}, wrap(({ input, column }) => csvStats(input, column)));

server.registerTool("csv_filter", {
  title: "Filter CSV rows",
  description: "Filter rows of a local CSV where a column matches a condition, and write the result to a new CSV.",
  inputSchema: {
    input: z.string().describe("Absolute path to the source CSV"),
    column: z.string().describe("Column to test"),
    op: z.enum(["==", "!=", "contains", ">", "<", ">=", "<="]).describe("Comparison operator"),
    value: z.string().describe("Value to compare against"),
    output: z.string().describe("Absolute path to write the filtered CSV")
  }
}, wrap(({ input, column, op, value, output }) => csvFilter(input, column, op, value, output)));

/* ---- Pro tools (one-time 9 USDC license; see README) ---- */

server.registerTool("csv_sort", {
  title: "Sort CSV (Pro)",
  description: "Pro: sort a local CSV by a column, ascending or descending (numeric-aware).",
  inputSchema: {
    input: z.string().describe("Absolute path to the source CSV"),
    column: z.string().describe("Column to sort by"),
    order: z.enum(["asc", "desc"]).optional().describe("Sort order (default asc)"),
    output: z.string().describe("Absolute path to write the sorted CSV")
  }
}, pro(({ input, column, order, output }) => csvSort(input, column, order, output)));

server.registerTool("csv_dedupe", {
  title: "Dedupe CSV rows (Pro)",
  description: "Pro: remove fully-duplicate rows from a local CSV.",
  inputSchema: {
    input: z.string().describe("Absolute path to the source CSV"),
    output: z.string().describe("Absolute path to write the deduplicated CSV")
  }
}, pro(({ input, output }) => csvDedupe(input, output)));

server.registerTool("csv_select", {
  title: "Select CSV columns (Pro)",
  description: "Pro: keep only the named columns (comma-separated) of a local CSV.",
  inputSchema: {
    input: z.string().describe("Absolute path to the source CSV"),
    columns: z.string().describe("Comma-separated column names to keep, e.g. 'name,city'"),
    output: z.string().describe("Absolute path to write the result")
  }
}, pro(({ input, columns, output }) => csvSelect(input, columns, output)));

await server.connect(new StdioServerTransport());
