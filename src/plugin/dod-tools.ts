import { defineTool, jsonSchema } from "@bosun-sh/ohtools";
import { chestInputSchemas } from "./public-schemas";
import { loadCollection, upsertRecord } from "./record-store";
import type { DoDCriterion } from "../dod/schema";
import { ok } from "../shared/result";

export const dodListTool = defineTool({
  id: "chest.dod.list",
  description: "List all Definition of Done criteria.",
  input: jsonSchema(chestInputSchemas["chest.dod.list"]),
  run: async () => {
    const result = await loadCollection<DoDCriterion>(process.cwd(), "dod");
    return result.ok ? ok({ items: result.data }) : result;
  },
});

export const dodUpsertTool = defineTool({
  id: "chest.dod.upsert",
  description: "Insert or update a Definition of Done criterion.",
  input: jsonSchema<DoDCriterion>(chestInputSchemas["chest.dod.upsert"]),
  run: async (record: DoDCriterion) => upsertRecord(process.cwd(), "dod", record),
});
