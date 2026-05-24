import { Context } from "effect";
import type { KPI, KPIEvidence } from "./schema";

export type KPIRepositoryError =
  | { _tag: "missing_file"; path: string }
  | { _tag: "invalid_yaml"; path: string; message: string }
  | { _tag: "schema_violation"; path: string; message: string }
  | { _tag: "not_found"; id: string }
  | { _tag: "conflict"; path: string };

export type KPIRunnerError = { _tag: "command_not_found"; command: string };

export interface KPIRepository {
  list(): Promise<KPI[]>;
  findById(id: string): Promise<KPI | undefined>;
  save(record: KPI): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface KPIRunner {
  run(kpi: KPI): Promise<KPIEvidence>;
  runAll(kpis: KPI[]): Promise<KPIEvidence[]>;
}

export const KPIRepository = Context.GenericTag<KPIRepository>("KPIRepository");
export const KPIRunner = Context.GenericTag<KPIRunner>("KPIRunner");
