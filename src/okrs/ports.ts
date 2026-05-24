import type { OKR } from "./schema";

export type OKRRepositoryError =
  | { _tag: "missing_file"; path: string }
  | { _tag: "invalid_yaml"; path: string; message: string }
  | { _tag: "schema_violation"; path: string; message: string }
  | { _tag: "not_found"; id: string }
  | { _tag: "conflict"; path: string };

export interface OKRRepository {
  list(): Promise<OKR[]>;
  findById(id: string): Promise<OKR | undefined>;
  save(record: OKR): Promise<void>;
  remove(id: string): Promise<void>;
}
