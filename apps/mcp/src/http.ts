import http from "http";
import { createFinancialTools, createAnalysisTools } from "@mf-dashboard/analytics";
import { getDb, getCurrentGroup } from "@mf-dashboard/db";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { ZodObject } from "zod";

async function main() {
  const port = process.env.MCP_HTTP_PORT ? parseInt(process.env.MCP_HTTP_PORT, 10) : 3001;
  const host = process.env.MCP_HTTP_HOST ?? "127.0.0.1";

  const db = getDb();
  const group = await getCurrentGroup(db);

  if (!group) {
    console.error("No current group found in database");
    process.exit(1);
  }

  const server = new McpServer({
    name: "moneyforward-dashboard",
    version: "1.0.0",
  });

  const allTools = {
    ...createFinancialTools(db, group.id),
    ...createAnalysisTools(db, group.id),
  };

  for (const [name, t] of Object.entries(allTools)) {
    const { description, inputSchema, execute } = t as unknown as {
      description: string;
      inputSchema: ZodObject<Record<string, never>>;
      execute: (input: Record<string, unknown>) => Promise<unknown>;
    };

    server.registerTool(name, { description, inputSchema }, async (params) => {
      const result = await execute(params);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    });
  }

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
  });

  await server.connect(transport);

  const httpServer = http.createServer(async (req, res) => {
    if (req.url === "/mcp" || req.url === "/mcp/") {
      try {
        await transport.handleRequest(req, res);
      } catch (err) {
        console.error("handleRequest error:", err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: String(err) }));
      }
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: "Not found" }));
    }
  });

  httpServer.listen(port, host, () => {
    console.log(`MCP HTTP server listening on http://${host}:${port}/mcp`);
    console.log(`Transport: Streamable HTTP (stateless)`);
    console.log(`Tools: ${Object.keys(allTools).length} registered`);
  });

  // Keep process alive
  setInterval(() => {}, 1 << 30);
}

void main();
