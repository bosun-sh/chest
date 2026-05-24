export type DoDCriterion = {
  id: string;
  text: string;
  severity: "blocking" | "warning" | "info";
  requiresKpi?: string;
};
