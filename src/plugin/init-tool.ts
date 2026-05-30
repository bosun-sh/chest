import { defineTool, jsonSchema } from "@bosun-sh/ohtools";
import { initWorkspace } from "../workspace/init";
import { chestInputSchemas } from "./public-schemas";

export const initTool = defineTool({
  id: "chest.init",
  description: "Initialize the local Chest governance store.",
  input: jsonSchema<{ dir?: string; force?: boolean }>(chestInputSchemas["chest.init"]),
  run: async (input: { dir?: string; force?: boolean }) => initWorkspace(input),
});
