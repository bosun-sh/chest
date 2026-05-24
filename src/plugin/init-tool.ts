import { type Ohtools, jsonSchema } from "@bosun-sh/ohtools";
import { chestInputSchemas } from "./public-schemas";
import { initWorkspace } from "../workspace/init";

export const registerInitTool = (app: Ohtools): Ohtools =>
  app.tool("chest.init", {
    description: "Initialize the local Chest governance store.",
    input: jsonSchema(chestInputSchemas.init),
    run: async (input: { dir?: string; force?: boolean }) => initWorkspace(input),
  });
