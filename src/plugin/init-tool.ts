import { defineTool, jsonSchema } from "@bosun-sh/ohtools";
import { chestInputSchemas } from "./public-schemas";
import { initWorkspace } from "../workspace/init";

export const initTool = defineTool({
  id: "chest.init",
  description: "Initialize the local Chest governance store.",
  input: jsonSchema<{ dir?: string; force?: boolean }>(chestInputSchemas["chest.init"]),
  run: async (input: { dir?: string; force?: boolean }) => initWorkspace(input),
});
