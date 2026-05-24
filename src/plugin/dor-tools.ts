import { defineTool, jsonSchema } from "@bosun-sh/ohtools";
import { chestInputSchemas } from "./public-schemas";
import { loadCollection, upsertRecord } from "./record-store";
import type { DoRCriterion } from "../dor/schema";
import { ok } from "../shared/result";

export const dorListTool = defineTool({
  id: "chest.dor.list",
  description: "List all Definition of Ready criteria.",
  input: jsonSchema(chestInputSchemas["chest.dor.list"]),
  run: async () => {
    const result = await loadCollection<DoRCriterion>(process.cwd(), "dor");
    return result.ok ? ok({ items: result.data }) : result;
  },
});

export const dorUpsertTool = defineTool({
  id: "chest.dor.upsert",
  description: "Insert or update a Definition of Ready criterion.",
  input: jsonSchema<DoRCriterion>(chestInputSchemas["chest.dor.upsert"]),
  run: async (record: DoRCriterion) => upsertRecord(process.cwd(), "dor", record),
});
