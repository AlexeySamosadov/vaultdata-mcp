# VaultData MCP 🔒

**Local CSV/JSON tools for AI agents.** An [MCP](https://modelcontextprotocol.io) server that lets Claude, ChatGPT Apps, or any MCP host inspect and transform data files **on the user's own machine** — data is never uploaded.

Part of the VaultPDF / VaultImage / VaultData family of privacy-first agent tools, built for the fast-growing, still-uncrowded MCP / agent-app ecosystem.

## Tools
| tool | what it does |
|---|---|
| `csv_info` | row count, column names and a small sample of a CSV |
| `csv_to_json` | convert a CSV to a JSON array of objects |
| `json_to_csv` | convert a JSON array of objects to CSV |
| `csv_stats` | summarize a column — sum/mean/min/max (numeric) or top counts (categorical) |
| `csv_filter` | keep rows where a column matches a condition (`==`, `!=`, `contains`, `>`, `<`, `>=`, `<=`) |

All operations run locally via [`papaparse`](https://www.papaparse.com/) (pure JavaScript). Nothing leaves the machine.

## Run
```bash
# straight from GitHub, no install:
npx github:AlexeySamosadov/vaultdata-mcp
```

## Use in Claude Desktop
Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "vaultdata": { "command": "npx", "args": ["github:AlexeySamosadov/vaultdata-mcp"] }
  }
}
```

## Why
Agents constantly receive CSV exports and JSON blobs and need to peek at them, convert between formats, compute quick stats, or filter rows — without round-tripping private data through a cloud service. VaultData keeps it all local. No server, no account, no upload.

MIT licensed.
