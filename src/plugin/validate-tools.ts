import { defineTool, jsonSchema } from "@bosun-sh/ohtools";
import { chestInputSchemas } from "./public-schemas";
import { validateReady } from "../validation/ready";
import { validateDone } from "../validation/done";
import { loadCollection } from "./record-store";
import { validateDoR } from "../dor/schema";
import { validateDoD } from "../dod/schema";
import { validateOKRs } from "../okrs/schema";
import { validateKPIs } from "../kpis/schema";
import { runKPI } from "../kpis/run";
import type { DoRCriterion } from "../dor/schema";
import type { DoDCriterion } from "../dod/schema";
import type { KPI, KPIEvidence } from "../kpis/schema";
import type { OKR } from "../okrs/schema";
import { writeReportFile } from "./record-store";
import { ERR_CHEST_02, ERR_CHEST_03, ERR_CHEST_06 } from "../shared/error-codes";
import { ok, fail, type ToolResult } from "../shared/result";
import type { ValidationReport } from "../validation/schema";

type ValidateReadyInput = { plan: string; ref?: string };
type ValidateDoneInput = { work_evidence: string; plan_ref?: string; kpi_results?: KPIEvidence[] };

type LoadResult<T extends { id: string }> = Promise<ToolResult<T[]>>;
const governanceFiles = {
  dor: "definition-of-ready.yaml",
  dod: "definition-of-done.yaml",
  okrs: "okrs.yaml",
  kpis: "kpis.yaml",
} as const;

const loadRequiredCollection = async <T extends { id: string }>(
  root: string,
  collection: "dor" | "dod" | "okrs" | "kpis",
  validator: (value: unknown) => { ok: true; data: T[] } | { ok: false; violations: unknown[] },
  optional = false,
): Promise<ToolResult<T[]>> => {
  const loaded = await loadCollection<T>(root, collection);
  if (!loaded.ok) {
    if (optional && loaded.error.code === ERR_CHEST_03) {
      return ok([]);
    }

    return loaded as ToolResult<T[]>;
  }

  const validated = validator(loaded.data);
  if (!validated.ok) {
    return fail(
      ERR_CHEST_02,
      `Governance file at ${root}/.chest/${governanceFiles[collection]} failed schema validation.`,
      validated.violations,
    );
  }

  return ok(validated.data);
};

const loadOkrs = (root: string): LoadResult<OKR> => loadRequiredCollection(root, "okrs", validateOKRs, true);
const loadDor = (root: string): LoadResult<DoRCriterion> => loadRequiredCollection(root, "dor", validateDoR);
const loadDod = (root: string): LoadResult<DoDCriterion> => loadRequiredCollection(root, "dod", validateDoD);
const loadKpis = (root: string): LoadResult<KPI> => loadRequiredCollection(root, "kpis", validateKPIs);

const persistReport = async (root: string, report: ValidationReport): Promise<ToolResult<ValidationReport>> => {
  const saved = await writeReportFile(root, report);
  return saved.ok ? ok(report) : saved;
};

const runRequiredKpis = async (root: string, dod: DoDCriterion[]): Promise<ToolResult<KPIEvidence[]>> => {
  const requiredIds = [...new Set(dod.flatMap((criterion) => (criterion.requiresKpi ? [criterion.requiresKpi] : [])))];
  if (requiredIds.length === 0) {
    return ok([]);
  }

  const loaded = await loadKpis(root);
  if (!loaded.ok) {
    return loaded as ToolResult<KPIEvidence[]>;
  }

  const evidence: KPIEvidence[] = [];
  for (const id of requiredIds) {
    const kpi = loaded.data.find((record) => record.id === id);
    if (!kpi) {
      return fail(ERR_CHEST_02, `KPI with id '${id}' not found.`);
    }

    try {
      evidence.push(await runKPI(kpi));
    } catch (error) {
      if (error && typeof error === "object" && (error as { _tag?: string })._tag === "command_not_found") {
        return fail(
          ERR_CHEST_06,
          `KPI command not found: ${(error as { command?: string }).command ?? kpi.command[0] ?? ""}`,
        );
      }

      throw error;
    }
  }

  return ok(evidence);
};

export const validateReadyTool = defineTool({
  id: "chest.validate.ready",
  description: "Validate a plan against Definition of Ready criteria.",
  input: jsonSchema<ValidateReadyInput>(chestInputSchemas["chest.validate.ready"]),
  run: async ({ plan }: ValidateReadyInput) => {
    const root = process.cwd();

    const dor = await loadDor(root);
    if (!dor.ok) {
      return dor as ToolResult<ValidationReport>;
    }

    const okrs = await loadOkrs(root);
    if (!okrs.ok) {
      return okrs as ToolResult<ValidationReport>;
    }

    const report = await validateReady(plan, dor.data, okrs.data);
    return persistReport(root, report);
  },
});

export const validateDoneTool = defineTool({
  id: "chest.validate.done",
  description: "Validate completed work against Definition of Done criteria.",
  input: jsonSchema<ValidateDoneInput>(chestInputSchemas["chest.validate.done"]),
  run: async ({ work_evidence, plan_ref: _plan_ref, kpi_results }: ValidateDoneInput) => {
    const root = process.cwd();

    const dod = await loadDod(root);
    if (!dod.ok) {
      return dod as ToolResult<ValidationReport>;
    }

    const okrs = await loadOkrs(root);
    if (!okrs.ok) {
      return okrs as ToolResult<ValidationReport>;
    }

    let kpiEvidence = kpi_results;
    if (!kpiEvidence) {
      const required = await runRequiredKpis(root, dod.data);
      if (!required.ok) {
        return required as ToolResult<ValidationReport>;
      }

      kpiEvidence = required.data;
    }

    const report = await validateDone(work_evidence, dod.data, okrs.data, kpiEvidence);
    return persistReport(root, report);
  },
});
