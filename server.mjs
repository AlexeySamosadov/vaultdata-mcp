#!/usr/bin/env node
/**
 * VaultData MCP — local CSV/JSON tools for AI agents (Claude, ChatGPT Apps, any MCP host).
 * Data is read and written on the local machine; nothing is uploaded.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { csvInfo, csvToJson, jsonToCsv, csvStats, csvFilter } from "./lib.mjs";

const server = new McpServer({ name: "vaultdata-mcp", version: "0.1.0" });
const text = t => ({ content: [{ type: "text", text: t }] });
const wrap = fn => async (args) => {
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

await server.connect(new StdioServerTransport());
