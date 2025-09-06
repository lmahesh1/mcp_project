
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";

// -------------------------
// Configuration validation
// -------------------------
function validateEnvironment() {
  const requiredVars = ["API_BASE_URL", "API_KEY"];
  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

// -------------------------
// Tool implementation
// -------------------------
// Accepts either (url) or (url, options)
// options can override env-config: { apiBaseUrl, apiKey, apiDomain, timeoutMs }
async function fetchBrandDetails(url, options = {}) {
  if (!url) throw new Error("Missing required input: url");

  try {
    new URL(url); // validate URL
  } catch {
    throw new Error("Invalid URL format provided");
  }

  const base = options.apiBaseUrl || process.env.API_BASE_URL;
  const token = options.apiKey || process.env.API_KEY;
  const domain = options.apiDomain || process.env.API_DOMAIN || "tyedukondalu-brandsnap.com";
  const timeout = Number(options.timeoutMs || process.env.MCP_TOOL_TIMEOUT_MS || "15000");

  try {
    const resp = await axios.post(
      `${base}/api/secure/rivofetch`,
      { url },
      {
        timeout,
        headers: {
          "x-api-key": token,
          Origin: domain,
          Referer: domain,
          Host: domain,
          "Content-Type": "application/json",
          "User-Agent": "BrandService-MCP/1.0.0",
        },
      }
    );

    return {
      success: true,
      data: resp.data,
      url,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    if (err.response) {
      throw new Error(
        `API Error (${err.response.status}): ${err.response.data?.message || err.response.statusText}`
      );
    } else if (err.request) {
      throw new Error(`Network Error: Unable to reach API at ${base}`);
    } else if (err.code === "ECONNABORTED") {
      throw new Error(`Request timeout after ${timeout}ms`);
    } else {
      throw new Error(`Request failed: ${err.message}`);
    }
  }
}

// -------------------------
// Create MCP server
// -------------------------
const server = new Server(
  {
    name: "brandService",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// -------------------------
// Handle ListTools request
// -------------------------
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "fetchBrandDetails",
        description: "Fetch comprehensive brand details and analysis from a website URL.",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "The complete website URL to analyze (must include http:// or https://)",
              pattern: "^https?://.*",
            },
            apiBaseUrl: { type: "string", description: "Override API base URL for this call" },
            apiKey: { type: "string", description: "Override API key for this call" },
            apiDomain: { type: "string", description: "Override domain headers (Origin/Referer/Host)" },
            timeoutMs: { type: "number", description: "Request timeout override in ms" },
          },
          required: ["url"],
        },
      },
    ],
  };
});

// -------------------------
// Handle CallTool request
// -------------------------
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (request.params.name === "fetchBrandDetails") {
      const { url, apiBaseUrl, apiKey, apiDomain, timeoutMs } = request.params.arguments || {};

      if (!url) {
        return { content: [{ type: "text", text: "Error: URL parameter is required" }], isError: true };
      }

      // Pass through per-request overrides if supplied by client (e.g., Claude custom connector)
      const brandData = await fetchBrandDetails(url, { apiBaseUrl, apiKey, apiDomain, timeoutMs });

      const companyName =
        brandData?.data?.Company?.Name ||
        brandData?.data?.Company?.Website ||
        url;

      const colors = (brandData?.data?.Colors || []).map((c) => c.hex).filter(Boolean);
      const fonts = (brandData?.data?.Fonts || []).map((f) => f.name).filter(Boolean);
      const logo = brandData?.data?.Logo?.Logo || brandData?.data?.Logo?.Icon || null;

      let summary = `I found the brand identity for ${companyName}.`;
      if (logo) summary += ` Logo available (${logo}).`;
      if (colors.length) summary += ` Primary colors include ${colors.join(", ")}.`;
      if (fonts.length) summary += ` Fonts used: ${fonts.join(", ")}.`;

      return {
        content: [
          { type: "text", text: `RAW_JSON_START\n${JSON.stringify(brandData)}\nRAW_JSON_END` },
          { type: "text", text: summary },
        ],
      };
    } else {
      return {
        content: [
          { type: "text", text: `Error: Unknown tool '${request.params.name}'. Available tools: fetchBrandDetails` },
        ],
        isError: true,
      };
    }
  } catch (error) {
    return { content: [{ type: "text", text: `Error executing tool: ${error.message}` }], isError: true };
  }
});

// -------------------------
// Error handling
// -------------------------
process.on("uncaughtException", (error) => {
  console.error(error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error(reason);
  process.exit(1);
});

// -------------------------
// Initialize server with selectable transport (stdio | sse)
// -------------------------
async function startServer() {
  try {
    validateEnvironment();

    const transport = (process.env.MCP_TRANSPORT || "sse").toLowerCase();

    if (transport === "stdio") {
      const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");
      server.connect(new StdioServerTransport());
      return;
    }

    if (transport === "sse") {
      const http = await import("http");
      const { SseServerTransport } = await import("@modelcontextprotocol/sdk/server/sse.js");

      const host = process.env.MCP_HOST || "0.0.0.0";
      const port = Number(process.env.MCP_PORT || "8000");
      const path = process.env.MCP_PATH || "/mcp";

      const httpServer = http.createServer();
      const sseTransport = new SseServerTransport({ server: httpServer, path });
      server.connect(sseTransport);

      httpServer.listen(port, host, () => {
        console.log(`✅ MCP SSE server started at http://${host}:${port}${path}`);
      });
      return;
    }

    throw new Error(`Unknown MCP_TRANSPORT: ${transport}`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

startServer();

export { fetchBrandDetails };
