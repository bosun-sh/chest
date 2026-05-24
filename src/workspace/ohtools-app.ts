import { Ohtools } from "@bosun-sh/ohtools";
import { mcpAdapter } from "@bosun-sh/ohtools/adapters/mcp";
import { registerChestTools } from "../plugin/tool-registry";

export const createChestApp = (): Ohtools => registerChestTools(new Ohtools().adapter(mcpAdapter()));

export default createChestApp();
