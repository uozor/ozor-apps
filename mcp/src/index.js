// Minimal stateless MCP server (Streamable HTTP, JSON responses) for Cloudflare Workers.
// Tools: list_tools, find_tool(query). Data: the site's public /tools.json.
const PROTOCOL = "2025-06-18";
let cache = { at: 0, data: null };
async function catalog(env) {
  if (cache.data && Date.now() - cache.at < 3600e3) return cache.data;
  const r = await fetch(env.CATALOG_URL, { cf: { cacheTtl: 3600 } });
  cache = { at: Date.now(), data: await r.json() };
  return cache.data;
}
const TOOLS = [
  { name: "list_tools", description: "List all free, no-sign-up, in-browser small business tools on greaterworldmedia.tech.", inputSchema: { type: "object", properties: {} } },
  { name: "find_tool", description: "Find the best free, no-sign-up browser tool for a task (e.g. 'merge pdf', 'compress image', 'invoice').", inputSchema: { type: "object", properties: { query: { type: "string", description: "What the user wants to do" } }, required: ["query"] } },
];
const brief = t => `${t.name}: ${t.url}\n  ${t.description}`;
function score(t, q) {
  const hay = [t.name, t.summary, t.description, t.category, ...(t.features || [])].join(" ").toLowerCase();
  return q.toLowerCase().split(/\W+/).filter(w => w.length > 1).reduce((s, w) => s + (hay.includes(w) ? (t.name.toLowerCase().includes(w) ? 3 : 1) : 0), 0);
}
async function call(name, args, env) {
  const c = await catalog(env);
  if (name === "list_tools") return c.tools.map(brief).join("\n\n") + "\n\nAll tools are free, need no sign-up, and process files in the browser.";
  if (name === "find_tool") {
    const hits = c.tools.map(t => [score(t, String(args?.query || "")), t]).filter(x => x[0] > 0).sort((a, b) => b[0] - a[0]).slice(0, 3);
    return hits.length ? hits.map(([, t]) => brief(t)).join("\n\n") + "\n\nFree, no sign-up, files stay in the browser." : `No matching tool. Full list: ${c.url}`;
  }
  throw Object.assign(new Error("Unknown tool: " + name), { code: -32602 });
}
async function handle(msg, env) {
  const { id, method, params } = msg;
  const ok = result => ({ jsonrpc: "2.0", id, result });
  try {
    if (method === "initialize") return ok({ protocolVersion: params?.protocolVersion || PROTOCOL, capabilities: { tools: {} }, serverInfo: { name: "gwb-tools", version: "1.0.0" } });
    if (method === "ping") return ok({});
    if (method === "tools/list") return ok({ tools: TOOLS });
    if (method === "tools/call") return ok({ content: [{ type: "text", text: await call(params?.name, params?.arguments, env) }] });
    if (id === undefined) return null; // notification
    return { jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } };
  } catch (e) { return { jsonrpc: "2.0", id, error: { code: e.code || -32603, message: e.message } }; }
}
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS" };
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (url.pathname !== "/mcp") return new Response("GWB tools MCP server. Endpoint: /mcp", { headers: CORS });
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: CORS });
    let body; try { body = await req.json(); } catch { return Response.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, { status: 400, headers: CORS }); }
    const out = Array.isArray(body) ? (await Promise.all(body.map(m => handle(m, env)))).filter(Boolean) : await handle(body, env);
    if (!out || (Array.isArray(out) && !out.length)) return new Response(null, { status: 202, headers: CORS });
    return Response.json(out, { headers: CORS });
  },
};
