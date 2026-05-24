import { type Ohtools, jsonSchema } from "@bosun-sh/ohtools";
import { chestInputSchemas } from "./public-schemas";
import { loadCollection, readRecord, removeRecord, upsertRecord } from "./record-store";
import type { OKR } from "../okrs/schema";
import { ok } from "../shared/result";

export const registerOKRTools = (app: Ohtools): Ohtools =>
  app
    .tool("chest.okrs.list", {
      description: "List all OKRs from the local Chest store.",
      input: jsonSchema(chestInputSchemas.emptyObject),
      run: async () => {
        const result = await loadCollection<OKR>(process.cwd(), "okrs");
        return result.ok ? ok({ items: result.data }) : result;
      },
    })
    .tool("chest.okrs.get", {
      description: "Get a single OKR by id.",
      input: jsonSchema(chestInputSchemas.id),
      run: async ({ id }: { id: string }) => readRecord<OKR>(process.cwd(), "okrs", id),
    })
    .tool("chest.okrs.upsert", {
      description: "Insert or update an OKR record.",
      input: jsonSchema(chestInputSchemas.okrRecord),
      run: async (record: OKR) => upsertRecord(process.cwd(), "okrs", record),
    })
    .tool("chest.okrs.remove", {
      description: "Remove an OKR record by id.",
      input: jsonSchema(chestInputSchemas.id),
      run: async ({ id }: { id: string }) => removeRecord(process.cwd(), "okrs", id),
    });
