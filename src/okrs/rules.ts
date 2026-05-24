import type { OKR } from "./schema";

export const isValidOKR = (value: OKR): boolean =>
  value.id.trim().length > 0 &&
  value.objective.trim().length > 0 &&
  Array.isArray(value.keyResults) &&
  value.keyResults.every(
    (result) =>
      result.id.trim().length > 0 &&
      result.description.trim().length > 0 &&
      result.target.trim().length > 0,
  );
