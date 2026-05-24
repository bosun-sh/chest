import { type Ohtools, jsonSchema } from "@bosun-sh/ohtools";
import { chestInputSchemas } from "./public-schemas";
import { loadCollection, readRecord, removeRecord, upsertRecord } from "./record-store";
import type { KPI } from "../kpis/schema";
import { ok } from "../shared/result";
import { runAllKPIs } from "../kpis/run-all";
import { runKPI } from "../kpis/run";

export const registerKpiTools = (app: Ohtools): Ohtools =>
  app
    .tool("chest.kpis.list", {
      description: "List all KPIs from the local Chest store.",
      input: jsonSchema(chestInputSchemas.emptyObject),
      run: async () => {
        const result = await loadCollection<KPI>(process.cwd(), "kpis");
        return result.ok ? ok({ items: result.data }) : result;
      },
    })
    .tool("chest.kpis.get", {
      description: "Get a KPI by id.",
      input: jsonSchema(chestInputSchemas.id),
      run: async ({ id }: { id: string }) => readRecord<KPI>(process.cwd(), "kpis", id),
    })
    .tool("chest.kpis.upsert", {
      description: "Insert or update a KPI record.",
      input: jsonSchema(chestInputSchemas.kpiRecord),
      run: async (record: KPI) => upsertRecord(process.cwd(), "kpis", record),
    })
    .tool("chest.kpis.remove", {
      description: "Remove a KPI record by id.",
      input: jsonSchema(chestInputSchemas.id),
      run: async ({ id }: { id: string }) => removeRecord(process.cwd(), "kpis", id),
    })
    .tool("chest.kpis.run", {
      description: "Run a KPI command check.",
      input: jsonSchema(chestInputSchemas.id),
      run: async ({ id }: { id: string }) => {
        const loaded = await readRecord<KPI>(process.cwd(), "kpis", id);
        if (!loaded.ok) {
          return loaded;
        }

        return ok(await runKPI(loaded.data));
      },
    })
    .tool("chest.kpis.run-all", {
      description: "Run every configured KPI command check.",
      input: jsonSchema(chestInputSchemas.emptyObject),
      run: async () => {
        const loaded = await loadCollection<KPI>(process.cwd(), "kpis");
        if (!loaded.ok) {
          return loaded;
        }

        return ok(await runAllKPIs(loaded.data));
      },
    });
