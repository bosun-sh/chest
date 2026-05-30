import { Context } from "effect";
import type { ReportSummary, ValidationReport } from "./schema";

export type ReportRepositoryError =
  | { _tag: "not_found"; id: string }
  | { _tag: "missing_dir"; path: string };

export interface ReportRepository {
  list(filter?: { workflow?: string; since?: string }): Promise<ReportSummary[]>;
  findById(id: string): Promise<ValidationReport | undefined>;
  write(report: ValidationReport): Promise<void>;
}

export const ReportRepository = Context.GenericTag<ReportRepository>("ReportRepository");
