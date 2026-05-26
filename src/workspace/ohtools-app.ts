import { Ohtools } from "@bosun-sh/ohtools";
import { mcpAdapter } from "@bosun-sh/ohtools/adapters/mcp";
import { chestPlugins } from "../plugin/registry";

export const createChestApp = (): Ohtools => {
  const app = new Ohtools({ name: "chest" });

  for (const chestPlugin of chestPlugins) {
    app.use(chestPlugin);
  }

  return app.adapter(mcpAdapter());
};

export default createChestApp();
