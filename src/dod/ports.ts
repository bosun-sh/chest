import type { DoDCriterion } from "./schema";

export type DoDRepositoryError =
  | { _tag: "missing_file"; path: string }
  | { _tag: "invalid_yaml"; path: string; message: string }
  | { _tag: "schema_violation"; path: string; message: string }
  | { _tag: "not_found"; id: string }
  | { _tag: "conflict"; path: string };

export interface DoDRepository {
  list(): Promise<DoDCriterion[]>;
  save(record: DoDCriterion): Promise<void>;
}
