import { type Ohtools, jsonSchema } from "@bosun-sh/ohtools";
import { chestInputSchemas } from "./public-schemas";
import { loadCollection, upsertRecord } from "./record-store";
import type { DoRCriterion } from "../dor/schema";
import { ok } from "../shared/result";

export const registerDoRTools = (app: Ohtools): Ohtools =>
  app
    .tool("chest.dor.list", {
      description: "List all Definition of Ready criteria.",
      input: jsonSchema(chestInputSchemas.emptyObject),
      run: async () => {
        const result = await loadCollection<DoRCriterion>(process.cwd(), "dor");
        return result.ok ? ok({ items: result.data }) : result;
      },
    })
    .tool("chest.dor.upsert", {
      description: "Insert or update a Definition of Ready criterion.",
      input: jsonSchema(chestInputSchemas.criterion),
      run: async (record: DoRCriterion) => upsertRecord(process.cwd(), "dor", record),
    });
