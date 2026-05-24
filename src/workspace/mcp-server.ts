import { Ohtools, normalizeError } from "@bosun-sh/ohtools";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Effect } from "effect";
import { z } from "zod";
import { chestPlugins } from "../plugin/registry";

type JsonSchema = Readonly<Record<string, unknown>>;

const toZodSchema = (schema: JsonSchema): z.ZodTypeAny => {
  if (schema.$ref) {
    throw new Error("MCP bridge does not support $ref schemas.");
  }

  switch (schema.type) {
    case "string":
      return z.string();
    case "number":
      return z.number();
    case "boolean":
      return z.boolean();
    case "array": {
      const items = schema.items && typeof schema.items === "object" ? (schema.items as JsonSchema) : {};
      return z.array(toZodSchema(items));
    }
    default: {
      const properties = schema.properties && typeof schema.properties === "object" ? (schema.properties as Record<string, JsonSchema>) : {};
      const required = new Set(Array.isArray(schema.required) ? schema.required.filter((value): value is string => typeof value === "string") : []);
      const shape: Record<string, z.ZodTypeAny> = {};

      for (const [key, value] of Object.entries(properties)) {
        const child = toZodSchema(value);
        shape[key] = required.has(key) ? child : child.optional();
      }

      let objectSchema = z.object(shape);
      if (schema.additionalProperties === false) {
        objectSchema = objectSchema.strict();
      } else {
        objectSchema = objectSchema.passthrough();
      }

      return objectSchema;
    }
  }
};

const chestMcpAdapter = {
  id: "mcp",
  kind: "mcp",
  attach(app: { registry: ReturnType<Ohtools["build"]>; runtime: Ohtools["runtime"] }) {
    let server: McpServer | undefined;
    let started = false;

    return {
      async start() {
        if (started) {
          return;
        }

        started = true;

        const mcp = new McpServer({
          name: "ohtools",
          version: "0.1.0",
        });

        for (const tool of app.registry.tools.values()) {
          if (tool.mode === "explore") {
            continue;
          }

          const inputSchema = tool.input?.jsonSchema ? toZodSchema(tool.input.jsonSchema as JsonSchema) : z.object({}).strict();

          mcp.registerTool(
            tool.id,
            {
              description: tool.description,
              inputSchema,
            },
            async (input) => {
              try {
                const result = await Effect.runPromise(app.runtime().run({ toolId: tool.id, input }));
                return { content: [{ type: "text", text: JSON.stringify(result.output) }] };
              } catch (cause) {
                return {
                  isError: true,
                  content: [
                    {
                      type: "text",
                      text: JSON.stringify({ ok: false, error: normalizeError(cause, "OHTOOLS_HANDLER_ERROR") }),
                    },
                  ],
                };
              }
            },
          );
        }

        server = mcp;
        await mcp.connect(new StdioServerTransport());
      },
      async stop() {
        if (server && typeof server.close === "function") {
          await server.close();
        }
        server = undefined;
        started = false;
      },
    };
  },
};

const createChestMcpApp = () => {
  const app = new Ohtools({ name: "chest" });

  for (const chestPlugin of chestPlugins) {
    app.use(chestPlugin);
  }

  return app.adapter(chestMcpAdapter);
};

export const chestMcpApp = createChestMcpApp();
