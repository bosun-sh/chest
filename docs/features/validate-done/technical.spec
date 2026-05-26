<spec name="Validate Done Technical Specification" feature="validate-done" extends="../../technical.spec">

  <slice_layout>
    <file path="src/validation/done.ts">
      validateDone(evidence: string, dod: DoDCriterion[], okrs: OKR[], kpiEvidence: KPIEvidence[]):
      Effect&lt;JudgeResponse, JudgeProviderError, JudgeProvider&gt;.
      Assembles JudgeRequest in mode "done" with kpiEvidence, calls JudgeProvider.judge.
      Pure entity logic; no I/O.
    </file>
    <file path="src/plugin/validate-tools.ts">
      Contains chest.validate.done alongside chest.validate.ready in the validate bridge.
      For chest.validate.done: loads DoD, KPIs, OKRs via entity ports; optionally runs
      required KPIs via KPIRunner; calls validateDone(); then calls ReportRepository.write().
    </file>
  </slice_layout>

  <domain_types>
    Uses: DoDCriterion, KPI, KPIEvidence, JudgeResponse, ValidationReport, OKR from domain_types.
    <schema_ref name="dod.v1"/>
    <schema_ref name="kpis.v1"/>
    <schema_ref name="report.v1"/>
    Zod schemas in src/dod/schema.ts, src/kpis/schema.ts, src/validation/schema.ts.
  </domain_types>

  <ports_used>
    DoDRepository.list (load criteria; from src/dod/ports.ts).
    KPIRepository.list, KPIRepository.findById (load KPI definitions for required KPIs).
    OKRRepository.list (optional context).
    KPIRunner.run (run each required KPI unless pre-supplied; from src/kpis/ports.ts).
    JudgeProvider.judge (from src/judge/ports.ts; called inside validateDone()).
    ReportRepository.write (persist result; called from plugin bridge, not entity code).
    Clock.now and Clock.newId.
  </ports_used>

  <yaml_touchpoints>
    Reads:
      .chest/definition-of-done.yaml   (schema: dod.v1)
      .chest/kpis.yaml                 (schema: kpis.v1, for required KPIs only)
      .chest/okrs.yaml                 (schema: okrs.v1, optional)
    Writes:
      .chest/reports/&lt;timestamp&gt;-done.yaml  (schema: report.v1)
    Write performed by plugin bridge via ReportRepository.write.
  </yaml_touchpoints>

  <tools>
    <tool id="chest.validate.done" api="defineTool" group="chest.validate">
      <description>
        Evaluate completed work against Definition of Done criteria. Runs
        required KPI checks unless pre-computed results are supplied. Returns
        a ValidationReport with status passed, failed, or needs_review.
      </description>
      <input_schema>
        {
          "type": "object",
          "properties": {
            "work_evidence": {
              "type": "string",
              "description": "Text description of the completed work."
            },
            "plan_ref": {
              "type": "string",
              "description": "Optional reference to the original plan."
            },
            "kpi_results": {
              "type": "array",
              "description": "Pre-computed KPI evidence. If supplied, KPI commands are not re-run.",
              "items": {
                "type": "object",
                "properties": {
                  "kpiId":      { "type": "string" },
                  "exitCode":   { "type": "number" },
                  "stdout":     { "type": "string" },
                  "stderr":     { "type": "string" },
                  "timedOut":   { "type": "boolean" },
                  "durationMs": { "type": "number" }
                },
                "required": ["kpiId", "exitCode", "stdout", "stderr", "timedOut", "durationMs"],
                "additionalProperties": false
              }
            }
          },
          "required": ["work_evidence"],
          "additionalProperties": false
        }
      </input_schema>
      <output_schema>
        { "$ref": "#/$defs/ValidationReport" }
      </output_schema>
      <errors>
        <error ref="ERR-CHEST-01"/>
        <error ref="ERR-CHEST-02"/>
        <error ref="ERR-CHEST-03"/>
        <error ref="ERR-CHEST-06"/>
        <error ref="ERR-CHEST-07"/>
        <error ref="ERR-CHEST-08"/>
      </errors>
      <handler_contract>
        1. Parse unknown input; extract work_evidence, optional plan_ref, optional kpi_results.
        2. Load DoD criteria via DoDRepository.list(). Map DoDRepositoryError _tags on failure.
        3. Identify DoD criteria with requiresKpi set.
        4. If input.kpi_results supplied: use as kpiEvidence directly.
           Else: load KPI definitions via KPIRepository.findById for each required KPI id.
           For each required KPI: call KPIRunner.run(kpi) as an Effect program.
             If { _tag: "command_not_found" }: return { ok: false, error: { code: "ERR-CHEST-06", ... } }.
        5. Load OKRs via OKRRepository.list() (optional; treat missing_file as empty list).
        6. Call validateDone(work_evidence, dod, okrs, kpiEvidence) as an Effect program.
        7. Map { _tag: "unreachable" }        → ERR-CHEST-07 (no fallback for done in v1).
           Map { _tag: "malformed_response" } → ERR-CHEST-08.
        8. Normalize JudgeResponse to ValidationReport:
           workflow "done", id = clock.newId(), timestamp = clock.now().
        9. Call ReportRepository.write(report) to persist.
        10. Return { ok: true, data: report }.
        Bridges return ToolResult envelopes; entity failures stay tagged unions and are mapped in the bridge.
      </handler_contract>
    </tool>
  </tools>

  <plugin_composition>
    chest.validate.done is added to validateGroup in src/plugin/validate-tools.ts
    alongside chest.validate.ready.
    Groups assembled in src/plugin/tool-registry.ts.
    See umbrella tool_registry for full composition.
  </plugin_composition>

  <effects>
    src/validation/done.ts: Effect (no direct I/O; uses JudgeProvider port).
    src/workspace/yaml-repository.ts: fs/promises.readFile (via DoDRepository, KPIRepository, OKRRepository).
    src/workspace/layers.ts wires BunKPIRunner: child_process.spawn (or Bun.spawn) for required KPIs.
    src/judge/providers/openai/adapter.ts: fetch (HTTP calls to OpenAI API).
    src/workspace/yaml-repository.ts: fs/promises.writeFile + rename (via ReportRepository.write).
    src/plugin/validate-tools.ts: ohtools defineTool, ToolResult mapping, orchestrates
      entity loads, optional KPI runs, validateDone(), then ReportRepository.write().
  </effects>

  <observability>
    Logger.info on validation start with number of required KPIs.
    Logger.info on successful completion with status.
    Logger.warn on each KPI nonzero exit (evidence, not failure).
    Logger.error on ERR-CHEST-06, ERR-CHEST-07, ERR-CHEST-08.
  </observability>

</spec>
