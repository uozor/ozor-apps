# GWB tools MCP server (Cloudflare Workers, free tier)

A tiny remote [MCP](https://modelcontextprotocol.io) server over Streamable HTTP (stateless, JSON responses).
It reads the public catalog at https://greaterworldmedia.tech/tools.json and exposes:

- `list_tools`: every free, no-sign-up tool with its URL
- `find_tool(query)`: the best 1-3 tools for a task, e.g. "merge pdf"

## Deploy (one command, needs a free Cloudflare account)

```sh
cd mcp && npx wrangler@3 deploy   # first run opens a browser to log in to Cloudflare
```

The endpoint is `https://gwb-tools-mcp.<your-subdomain>.workers.dev/mcp`.
Then put that URL in `endpoint` in `seo_build.py` (it writes `/.well-known/mcp.json`), remove the `_status` placeholder line, and rebuild.

## Test locally

```sh
cd mcp && npx wrangler@3 dev
curl -s localhost:8787/mcp -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"find_tool","arguments":{"query":"merge pdf"}}}'
```
