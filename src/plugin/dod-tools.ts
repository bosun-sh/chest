import { type Ohtools, jsonSchema } from "@bosun-sh/ohtools";
import { chestInputSchemas } from "./public-schemas";
import { loadCollection, upsertRecord } from "./record-store";
import type { DoDCriterion } from "../dod/schema";
import { ok } from "../shared/result";

export const registerDoDTools = (app: Ohtools): Ohtools =>
  app
    .tool("chest.dod.list", {
      description: "List all Definition of Done criteria.",
      input: jsonSchema(chestInputSchemas.emptyObject),
      run: async () => {
        const result = await loadCollection<DoDCriterion>(process.cwd(), "dod");
        return result.ok ? ok({ items: result.data }) : result;
      },
    })
    .tool("chest.dod.upsert", {
      description: "Insert or update a Definition of Done criterion.",
      input: jsonSchema(chestInputSchemas.criterion),
      run: async (record: DoDCriterion) => upsertRecord(process.cwd(), "dod", record),
    });
