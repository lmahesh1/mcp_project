// import http from "http";
// import axios from "axios";

// // -------------------------
// // Your tool implementation
// // -------------------------
// async function fetchBrandDetails(url) {
//   console.log("fetchBrandDetails called:", url);

//   if (!url) throw new Error("Missing required input: url");

//   const base = process.env.API_BASE_URL;
//   const token = process.env.API_KEY;
//   const domain = process.env.API_DOMAIN || "tyedukondalu-brandsnap.com";
//   const timeout = Number(process.env.MCP_TOOL_TIMEOUT_MS || "15000");

//   if (!base || !token) throw new Error("API_BASE_URL and API_KEY must be set in env");

//   try {
//     const resp = await axios.post(
//       `${base}/api/secure/rivofetch`,
//       { url },
//       {
//         timeout,
//         headers: {
//           "x-api-key": token,
//           Origin: domain,
//           Referer: domain,
//           Host: domain,
//           "Content-Type": "application/json",
//         },
//       }
//     );
//     return resp.data;
//   } catch (err) {
//     console.error("Error fetching brand details:", err.message);
//     throw err;
//   }
// }

// // -------------------------
// // Simple HTTP server for MCP
// // -------------------------
// const server = http.createServer(async (req, res) => {
//   if (req.method === "POST" && req.url === "/mcp") {
//     let body = "";
//     req.on("data", (chunk) => (body += chunk));
//     req.on("end", async () => {
//       try {
//         const { tool, input } = JSON.parse(body);

//         if (tool === "fetchBrandDetails") {
//           const result = await fetchBrandDetails(input?.url);
//           res.writeHead(200, { "Content-Type": "application/json" });
//           res.end(JSON.stringify({ result }));
//         } else {
//           res.writeHead(400, { "Content-Type": "application/json" });
//           res.end(JSON.stringify({ error: "Unknown tool" }));
//         }
//       } catch (error) {
//         res.writeHead(500, { "Content-Type": "application/json" });
//         res.end(JSON.stringify({ error: error.message }));
//       }
//     });
//   } else {
//     res.writeHead(404, { "Content-Type": "application/json" });
//     res.end(JSON.stringify({ error: "Not Found" }));
//   }
// });

// const PORT = process.env.MCP_PORT || 8081;
// server.listen(PORT, () => {
//   console.log(`MCP brand service running on http://localhost:${PORT}`);
// });

// // -------------------------
// // Optional CLI test
// // -------------------------
// if (process.argv[1] && process.argv[1].endsWith("mcp-brand-service.js")) {
//   const testUrl = process.env.TEST_URL || "https://akclinics.com";
//   fetchBrandDetails(testUrl)
//     .then((data) => {
//       console.log("Test call result:", JSON.stringify(data, null, 2));
//       process.exit(0);
//     })
//     .catch((e) => {
//       console.error("Test call error:", e);
//       process.exit(1);
//     });
// }

// // 👇 Export for other modules (like test-call.js)
// export { fetchBrandDetails };

// import { Server } from "@modelcontextprotocol/sdk/server/index.js";
// import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
// import axios from "axios";

// // -------------------------
// // Configuration validation
// // -------------------------
// function validateEnvironment() {
//   const requiredVars = ['API_BASE_URL', 'API_KEY'];
//   const missing = requiredVars.filter(varName => !process.env[varName]);
  
//   if (missing.length > 0) {
//     throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
//   }
// }

// // -------------------------
// // Tool implementation
// // -------------------------
// async function fetchBrandDetails(url) {
//   console.log("fetchBrandDetails called:", url);
  
//   if (!url) {
//     throw new Error("Missing required input: url");
//   }

//   // Validate URL format
//   try {
//     new URL(url);
//   } catch (error) {
//     throw new Error("Invalid URL format provided");
//   }

//   const base = process.env.API_BASE_URL;
//   const token = process.env.API_KEY;
//   const domain = process.env.API_DOMAIN || "tyedukondalu-brandsnap.com";
//   const timeout = Number(process.env.MCP_TOOL_TIMEOUT_MS || "15000");

//   try {
//     console.log(`Making request to: ${base}/api/secure/rivofetch`);
    
//     const resp = await axios.post(
//       `${base}/api/secure/rivofetch`,
//       { url },
//       {
//         timeout,
//         headers: {
//           "x-api-key": token,
//           "Origin": domain,
//           "Referer": domain,
//           "Host": domain,
//           "Content-Type": "application/json",
//           "User-Agent": "BrandService-MCP/1.0.0",
//         },
//       }
//     );

//     console.log("API response received successfully");
//     return {
//       success: true,
//       data: resp.data,
//       url: url,
//       timestamp: new Date().toISOString()
//     };

//   } catch (err) {
//     console.error("Error fetching brand details:", err.message);
    
//     // Enhanced error details
//     if (err.response) {
//       // Server responded with error status
//       throw new Error(`API Error (${err.response.status}): ${err.response.data?.message || err.response.statusText}`);
//     } else if (err.request) {
//       // Network error
//       throw new Error(`Network Error: Unable to reach API at ${base}`);
//     } else if (err.code === 'ECONNABORTED') {
//       // Timeout error
//       throw new Error(`Request timeout after ${timeout}ms`);
//     } else {
//       // Other errors
//       throw new Error(`Request failed: ${err.message}`);
//     }
//   }
// }

// // -------------------------
// // Create MCP server
// // -------------------------
// const server = new Server(
//   {
//     name: "brandService",
//     version: "1.0.0",
//   },
//   {
//     capabilities: {
//       tools: {},
//     },
//   }
// );

// // -------------------------
// // Handle ListTools request
// // -------------------------
// server.setRequestHandler(ListToolsRequestSchema, async () => {
//   console.log("ListTools request received");
  
//   return {
//     tools: [
//       {
//         name: "fetchBrandDetails",
//         description: "Fetch comprehensive brand details and analysis from a website URL. Returns brand information, visual elements, content analysis, and marketing insights.",
//         inputSchema: {
//           type: "object",
//           properties: {
//             url: {
//               type: "string",
//               description: "The complete website URL to analyze (must include http:// or https://)",
//               pattern: "^https?://.*",
//             },
//           },
//           required: ["url"],
//         },
//       },
//     ],
//   };
// });

// // -------------------------
// // Handle CallTool request
// // -------------------------
// server.setRequestHandler(CallToolRequestSchema, async (request) => {
//   console.log(`CallTool request received: ${request.params.name}`);
  
//   try {
//     if (request.params.name === "fetchBrandDetails") {
//       const { url } = request.params.arguments || {};
      
//       if (!url) {
//         return {
//           content: [
//             {
//               type: "text",
//               text: "Error: URL parameter is required",
//             },
//           ],
//           isError: true,
//         };
//       }

//       console.log(`Processing brand analysis for: ${url}`);
//       const brandData = await fetchBrandDetails(url);
      
//       return {
//         content: [
//           {
//             type: "text",
//             text: JSON.stringify(brandData, null, 2),
//           },
//         ],
//       };
      
//     } else {
//       return {
//         content: [
//           {
//             type: "text",
//             text: `Error: Unknown tool '${request.params.name}'. Available tools: fetchBrandDetails`,
//           },
//         ],
//         isError: true,
//       };
//     }
    
//   } catch (error) {
//     console.error("Tool execution error:", error.message);
    
//     return {
//       content: [
//         {
//           type: "text",
//           text: `Error executing tool: ${error.message}`,
//         },
//       ],
//       isError: true,
//     };
//   }
// });

// // -------------------------
// // Error handling and startup
// // -------------------------
// process.on('uncaughtException', (error) => {
//   console.error('Uncaught Exception:', error);
//   process.exit(1);
// });

// process.on('unhandledRejection', (reason, promise) => {
//   console.error('Unhandled Rejection at:', promise, 'reason:', reason);
//   process.exit(1);
// });

// // -------------------------
// // Initialize server
// // -------------------------
// async function startServer() {
//   try {
//     console.log("Starting Brand Service MCP Server...");
    
//     // Validate environment
//     validateEnvironment();
//     console.log("Environment validation passed");
    
//     // Start listening over stdio
//     await server.listen();
//     console.log("Brand Service MCP Server is running and listening on stdio");
    
//   } catch (error) {
//     console.error("Failed to start server:", error.message);
//     process.exit(1);
//   }
// }

// // Start the server
// startServer();

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
async function fetchBrandDetails(url) {
  if (!url) {
    throw new Error("Missing required input: url");
  }

  try {
    new URL(url); // validate URL
  } catch {
    throw new Error("Invalid URL format provided");
  }

  const base = process.env.API_BASE_URL;
  const token = process.env.API_KEY;
  const domain = process.env.API_DOMAIN || "tyedukondalu-brandsnap.com";
  const timeout = Number(process.env.MCP_TOOL_TIMEOUT_MS || "15000");

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
      url: url,
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
        description:
          "Fetch comprehensive brand details and analysis from a website URL.",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "The complete website URL to analyze (must include http:// or https://)",
              pattern: "^https?://.*",
            },
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
      const { url } = request.params.arguments || {};

      if (!url) {
        return {
          content: [{ type: "text", text: "Error: URL parameter is required" }],
          isError: true,
        };
      }

      const brandData = await fetchBrandDetails(url);

      // Extract key fields
      const companyName =
        brandData?.data?.Company?.Name ||
        brandData?.data?.Company?.Website ||
        url;

      const colors = (brandData?.data?.Colors || [])
        .map((c) => c.hex)
        .filter(Boolean);

      const fonts = (brandData?.data?.Fonts || [])
        .map((f) => f.name)
        .filter(Boolean);

      const logo =
        brandData?.data?.Logo?.Logo ||
        brandData?.data?.Logo?.Icon ||
        null;

      // Build summary
      let summary = `I found the brand identity for ${companyName}.`;
      if (logo) summary += ` Logo available (${logo}).`;
      if (colors.length) summary += ` Primary colors include ${colors.join(", ")}.`;
      if (fonts.length) summary += ` Fonts used: ${fonts.join(", ")}.`;

      // Return: raw (hidden-ish) + summary
      return {
        content: [
          {
            type: "text",
            // Encoded raw JSON for agent reasoning (not for user)
            text: `RAW_JSON_START\n${JSON.stringify(brandData)}\nRAW_JSON_END`,
          },
          {
            type: "text",
            // User-facing summary
            text: summary,
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: "text",
            text: `Error: Unknown tool '${request.params.name}'. Available tools: fetchBrandDetails`,
          },
        ],
        isError: true,
      };
    }
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error executing tool: ${error.message}` }],
      isError: true,
    };
  }
});

// -------------------------
// Error handling and startup
// -------------------------
process.on("uncaughtException", (error) => {
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  process.exit(1);
});

// -------------------------
// Initialize server
// -------------------------
async function startServer() {
  try {
    validateEnvironment();
    const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");
    server.connect(new StdioServerTransport());
  } catch (error) {
    process.exit(1);
  }
}

startServer();
export { fetchBrandDetails };