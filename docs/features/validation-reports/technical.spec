<spec name="Validation Reports Technical Specification" feature="validation-reports" extends="../../technical.spec">

  <slice_layout>
    <file path="src/reports/list.ts">
      listReports(filter?: { workflow?: string; since?: string }):
      Effect&lt;ReportSummary[], ReportRepositoryError, ReportRepository&gt;.
    </file>
    <file path="src/reports/get.ts">
      getReport(id: string): Effect&lt;ValidationReport, ReportRepositoryError, ReportRepository&gt;.
      Fails with { _tag: "not_found", id } if absent.
    </file>
    <file path="src/reports/ports.ts">
      ReportRepository interface + Context.GenericTag + ReportRepositoryError:
        | { _tag: "not_found"; id: string }
        | { _tag: "missing_dir"; path: string }
    </file>
    <file path="src/plugin/reports-tools.ts">
      defineGroup for chest.reports containing chest.reports.list and
      chest.reports.get tools. Maps ReportRepositoryError _tags to ToolResult.
    </file>
  </slice_layout>

  <domain_types>
    Uses: ValidationReport, EvidenceRef from domain_types.
    <schema_ref name="report.v1"/>
    ReportSummary = { id: string; workflow: 'ready'|'done'|'align'; timestamp: string; status: 'passed'|'failed'|'needs_review' }
    Zod schemas in src/reports/schema.ts.
  </domain_types>

  <ports_used>
    ReportRepository.list (enumerate and filter; from src/reports/ports.ts).
    ReportRepository.findById (fetch full report by id).
    No KPIRunner, JudgeProvider, or Clock.
    No OKRRepository, KPIRepository, DoRRepository, or DoDRepository.
    Note: ReportRepository.write is used by the validate and judge plugin bridges;
    this feature slice only covers the list and get read operations.
  </ports_used>

  <yaml_touchpoints>
    Reads:
      .chest/reports/&lt;timestamp&gt;-&lt;workflow&gt;.yaml  (schema: report.v1)
    Never writes (writes are performed by the validate-ready, validate-done,
    and judge-governance-alignment plugin bridges via ReportRepository.write).
  </yaml_touchpoints>

  <tools>
    <tool id="chest.reports.list" api="defineTool" group="chest.reports">
      <description>
        List persisted validation reports sorted by timestamp descending.
        Optionally filter by workflow type.
      </description>
      <input_schema>
        {
          "type": "object",
          "properties": {
            "workflow": {
              "type": "string",
              "enum": ["ready", "done", "align"],
              "description": "Filter reports by workflow type. Omit to list all."
            },
            "since": {
              "type": "string",
              "description": "ISO-8601 date prefix to filter reports on or after this date (e.g., '2026-05-01')."
            }
          },
          "additionalProperties": false
        }
      </input_schema>
      <output_schema>
        {
          "type": "object",
          "properties": {
            "items": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "id":        { "type": "string" },
                  "workflow":  { "type": "string", "enum": ["ready", "done", "align"] },
                  "timestamp": { "type": "string" },
                  "status":    { "type": "string", "enum": ["passed", "failed", "needs_review"] }
                },
                "required": ["id", "workflow", "timestamp", "status"],
                "additionalProperties": false
              }
            }
          },
          "required": ["items"],
          "additionalProperties": false
        }
      </output_schema>
      <errors>
        <error ref="ERR-CHEST-03"/>
      </errors>
      <handler_contract>
        1. Parse unknown input; extract optional workflow and since filters.
        2. Call listReports({ workflow, since }) as an Effect program via runtime.
        3. Map ReportRepositoryError _tags:
             { _tag: "missing_dir" } → { ok: false, error: { code: "ERR-CHEST-03", message: "reports/ directory not found. Run a validation workflow first." } }
        4. On success: return { ok: true, data: { items: reports } } sorted by timestamp descending.
        Bridges return ToolResult envelopes; entity failures stay tagged unions and are mapped in the bridge.
      </handler_contract>
    </tool>

    <tool id="chest.reports.get" api="defineTool" group="chest.reports">
      <description>
        Retrieve the full content of a validation report by its id.
      </description>
      <input_schema>
        {
          "type": "object",
          "properties": {
            "id": {
              "type": "string",
              "description": "Validation report id."
            }
          },
          "required": ["id"],
          "additionalProperties": false
        }
      </input_schema>
      <output_schema>
        { "$ref": "#/$defs/ValidationReport" }
      </output_schema>
      <errors>
        <error ref="ERR-CHEST-03"/>
        <error ref="ERR-CHEST-09"/>
      </errors>
      <handler_contract>
        1. Parse unknown input; extract id.
        2. Call getReport(input.id) as an Effect program via runtime.
        3. Map ReportRepositoryError _tags:
             { _tag: "not_found" }   → { ok: false, error: { code: "ERR-CHEST-09", message: "Report '&lt;id&gt;' not found." } }
             { _tag: "missing_dir" } → ERR-CHEST-03
        4. On success: return { ok: true, data: report }.
      </handler_contract>
    </tool>
  </tools>

  <plugin_composition>
    reportsGroup defined in src/plugin/reports-tools.ts.
    Contains chest.reports.list and chest.reports.get.
    Composed into chestPlugins via plugin("chest").group(reportsGroup).
    Groups assembled in src/plugin/tool-registry.ts.
    See umbrella tool_registry for full composition.
  </plugin_composition>

  <effects>
    src/reports/list.ts, src/reports/get.ts: Effect (no direct I/O; uses ReportRepository port).
    src/workspace/yaml-repository.ts: fs/promises.readdir (enumerate reports),
    fs/promises.readFile (read report JSON).
    src/plugin/reports-tools.ts: ohtools defineTool, ToolResult mapping.
    No writes. No child_process. No fetch.
  </effects>

  <observability>
    Logger.info on list with item count and applied filter.
    Logger.info on get with report id and status.
    Logger.error on ERR-CHEST-09 with id.
  </observability>

</spec>
