import { defineTool, jsonSchema } from "@bosun-sh/ohtools";
import { chestInputSchemas } from "./public-schemas";
import { loadCollection, readRecord, removeRecord, upsertRecord } from "./record-store";
import type { OKR } from "../okrs/schema";
import { ok } from "../shared/result";

export const okrsListTool = defineTool({
  id: "chest.okrs.list",
  description: "List all OKRs from the local Chest store.",
  input: jsonSchema(chestInputSchemas["chest.okrs.list"]),
  run: async () => {
    const result = await loadCollection<OKR>(process.cwd(), "okrs");
    return result.ok ? ok({ items: result.data }) : result;
  },
});

export const okrsGetTool = defineTool({
  id: "chest.okrs.get",
  description: "Get a single OKR by id.",
  input: jsonSchema<{ id: string }>(chestInputSchemas["chest.okrs.get"]),
  run: async ({ id }: { id: string }) => readRecord<OKR>(process.cwd(), "okrs", id),
});

export const okrsUpsertTool = defineTool({
  id: "chest.okrs.upsert",
  description: "Insert or update an OKR record.",
  input: jsonSchema<OKR>(chestInputSchemas["chest.okrs.upsert"]),
  run: async (record: OKR) => upsertRecord(process.cwd(), "okrs", record),
});

export const okrsRemoveTool = defineTool({
  id: "chest.okrs.remove",
  description: "Remove an OKR record by id.",
  input: jsonSchema<{ id: string }>(chestInputSchemas["chest.okrs.remove"]),
  run: async ({ id }: { id: string }) => removeRecord(process.cwd(), "okrs", id),
});
