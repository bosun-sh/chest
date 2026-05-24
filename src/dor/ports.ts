import { Context } from "effect";
import type { DoRCriterion } from "./schema";

export type DoRRepositoryError =
  | { _tag: "missing_file"; path: string }
  | { _tag: "invalid_yaml"; path: string; message: string }
  | { _tag: "schema_violation"; path: string; message: string }
  | { _tag: "not_found"; id: string }
  | { _tag: "conflict"; path: string };

export interface DoRRepository {
  list(): Promise<DoRCriterion[]>;
  save(record: DoRCriterion): Promise<void>;
}

export const DoRRepository = Context.GenericTag<DoRRepository>("DoRRepository");
