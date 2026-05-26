import { defineTool, jsonSchema } from "@bosun-sh/ohtools";
import { chestInputSchemas } from "./public-schemas";
import { loadCollection, removeRecord, upsertRecord } from "./record-store";
import type { KPI } from "../kpis/schema";
import { validateKPIs } from "../kpis/schema";
import { ok, fail } from "../shared/result";
import { ERR_CHEST_02, ERR_CHEST_06 } from "../shared/error-codes";
import { runAllKPIs } from "../kpis/run-all";
import { runKPI } from "../kpis/run";

const loadValidatedKpis = async (root: string) => {
  const result = await loadCollection<KPI>(root, "kpis");
  if (!result.ok) {
    return result;
  }

  const validation = validateKPIs(result.data);
  if (!validation.ok) {
    return fail(ERR_CHEST_02, `Governance file at ${root}/.chest/kpis.yaml failed schema validation.`, validation.violations);
  }

  return ok(validation.data);
};

export const kpisListTool = defineTool({
  id: "chest.kpis.list",
  description: "List all KPIs from the local Chest store.",
  input: jsonSchema(chestInputSchemas["chest.kpis.list"]),
  run: async () => {
    const result = await loadValidatedKpis(process.cwd());
    return result.ok ? ok({ items: result.data }) : result;
  },
});

export const kpisGetTool = defineTool({
  id: "chest.kpis.get",
  description: "Get a KPI by id.",
  input: jsonSchema<{ id: string }>(chestInputSchemas["chest.kpis.get"]),
  run: async ({ id }: { id: string }) => {
    const result = await loadValidatedKpis(process.cwd());
    if (!result.ok) {
      return result;
    }

    const record = result.data.find((item) => item.id === id);
    return record ? ok(record) : fail(ERR_CHEST_02, `KPI with id '${id}' not found.`);
  },
});

export const kpisUpsertTool = defineTool({
  id: "chest.kpis.upsert",
  description: "Insert or update a KPI record.",
  input: jsonSchema<KPI>(chestInputSchemas["chest.kpis.upsert"]),
  run: async (record: KPI) => upsertRecord(process.cwd(), "kpis", record),
});

export const kpisRemoveTool = defineTool({
  id: "chest.kpis.remove",
  description: "Remove a KPI record by id.",
  input: jsonSchema<{ id: string }>(chestInputSchemas["chest.kpis.remove"]),
  run: async ({ id }: { id: string }) => removeRecord(process.cwd(), "kpis", id),
});

export const kpisRunTool = defineTool({
  id: "chest.kpis.run",
  description: "Run a KPI command check.",
  input: jsonSchema<{ id: string }>(chestInputSchemas["chest.kpis.run"]),
  run: async ({ id }: { id: string }) => {
    const loaded = await loadValidatedKpis(process.cwd());
    if (!loaded.ok) {
      return loaded;
    }

    const kpi = loaded.data.find((item) => item.id === id);
    if (!kpi) {
      return fail(ERR_CHEST_02, `KPI with id '${id}' not found.`);
    }

    try {
      return ok(await runKPI(kpi));
    } catch (error) {
      if (error && typeof error === "object" && (error as { _tag?: string })._tag === "command_not_found") {
        return fail(
          ERR_CHEST_06,
          `KPI command not found: ${(error as { command?: string }).command ?? kpi.command[0] ?? ""}`,
        );
      }

      throw error;
    }
  },
});

export const kpisRunAllTool = defineTool({
  id: "chest.kpis.run-all",
  description: "Run every configured KPI command check.",
  input: jsonSchema(chestInputSchemas["chest.kpis.run-all"]),
  run: async () => {
    const loaded = await loadValidatedKpis(process.cwd());
    if (!loaded.ok) {
      return loaded;
    }

    try {
      return ok({ results: await runAllKPIs(loaded.data) });
    } catch (error) {
      if (error && typeof error === "object" && (error as { _tag?: string })._tag === "command_not_found") {
        return fail(
          ERR_CHEST_06,
          `KPI command not found: ${(error as { command?: string }).command ?? ""}`,
        );
      }

      throw error;
    }
  },
});
