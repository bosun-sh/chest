<spec name="Run KPI Checks Technical Specification" feature="run-kpi-checks" extends="../../technical.spec">

  <slice_layout>
    <file path="src/kpis/run.ts">
      runKPI(id: string): Effect&lt;KPIEvidence, KPIRunnerError | KPIRepositoryError, KPIRepository | KPIRunner&gt;.
      Loads KPI by id, calls KPIRunner.run(kpi). Fails with { _tag: "not_found" } if id absent.
      Fails with { _tag: "command_not_found" } if spawn fails with ENOENT.
    </file>
    <file path="src/kpis/run-all.ts">
      runAllKPIs(): Effect&lt;KPIEvidence[], KPIRepositoryError, KPIRepository | KPIRunner&gt;.
      Loads all KPIs, runs each via KPIRunner.run. Nonzero exit and timeout are
      evidence, not errors. command_not_found on any KPI aborts the batch.
    </file>
    <file path="src/kpis/evidence.ts">
      Pure: converts raw process result into KPIEvidence domain type.
      Applies evidence_normalizer lookup if configured. No I/O.
    </file>
    <file path="src/plugin/kpis-tools.ts">
      Adds chest.kpis.run and chest.kpis.run-all to the kpis bridge alongside
      list, get, upsert, remove tools. Maps KPIRunnerError to ToolResult.
    </file>
  </slice_layout>

  <domain_types>
    Uses: KPI, KPIEvidence from domain_types.
    <schema_ref name="kpis.v1"/>
    KPIEvidence Zod schema in src/kpis/schema.ts.
  </domain_types>

  <ports_used>
    KPIRunner.run, KPIRunner.runAll (from src/kpis/ports.ts).
    KPIRepository.list, KPIRepository.findById (to load KPI definitions before running).
    No JudgeProvider, DoRRepository, DoDRepository, ReportRepository, or Clock.
  </ports_used>

  <yaml_touchpoints>
    Reads:
      .chest/kpis.yaml   (schema: kpis.v1)
    Never writes.
  </yaml_touchpoints>

  <tools>
    <tool id="chest.kpis.run" api="defineTool" group="chest.kpis">
      <description>
        Run a single KPI command check and return the captured evidence.
        A nonzero exit code is evidence, not an error.
      </description>
      <input_schema>
        {
          "type": "object",
          "properties": {
            "id": {
              "type": "string",
              "description": "KPI ID to run."
            }
          },
          "required": ["id"],
          "additionalProperties": false
        }
      </input_schema>
      <output_schema>
        {
          "type": "object",
          "properties": {
            "kpiId":      { "type": "string" },
            "exitCode":   { "type": "number" },
            "stdout":     { "type": "string" },
            "stderr":     { "type": "string" },
            "timedOut":   { "type": "boolean" },
            "durationMs": { "type": "number" },
            "normalizedValue": { "type": "string" }
          },
          "required": ["kpiId", "exitCode", "stdout", "stderr", "timedOut", "durationMs"],
          "additionalProperties": false
        }
      </output_schema>
      <errors>
        <error ref="ERR-CHEST-02"/>
        <error ref="ERR-CHEST-03"/>
        <error ref="ERR-CHEST-06"/>
      </errors>
      <handler_contract>
        1. Parse unknown input; extract id.
        2. Call runKPI(input.id) as an Effect program via runtime.
        3. Map tagged-union failures to ToolResult:
             { _tag: "not_found" }         → { ok: false, error: { code: "ERR-CHEST-02", message: "KPI with id '&lt;id&gt;' not found." } }
             { _tag: "missing_file" }       → ERR-CHEST-03
             { _tag: "command_not_found" }  → { ok: false, error: { code: "ERR-CHEST-06", message: "KPI command not found: &lt;command&gt;" } }
        4. On success: return { ok: true, data: kpiEvidence }.
        Nonzero exitCode and timedOut are evidence fields, never errors.
        Bridges return ToolResult envelopes; entity failures stay tagged unions and are mapped in the bridge.
      </handler_contract>
    </tool>

    <tool id="chest.kpis.run-all" api="defineTool" group="chest.kpis">
      <description>
        Run all configured KPI command checks and return an evidence array.
        A nonzero exit in one KPI does not stop the others.
      </description>
      <input_schema>
        {
          "type": "object",
          "properties": {},
          "additionalProperties": false
        }
      </input_schema>
      <output_schema>
        {
          "type": "object",
          "properties": {
            "results": {
              "type": "array",
              "items": { "$ref": "#/$defs/KPIEvidence" }
            }
          },
          "required": ["results"],
          "additionalProperties": false
        }
      </output_schema>
      <errors>
        <error ref="ERR-CHEST-01"/>
        <error ref="ERR-CHEST-02"/>
        <error ref="ERR-CHEST-03"/>
        <error ref="ERR-CHEST-06"/>
      </errors>
      <handler_contract>
        1. Parse unknown input (empty object).
        2. Call runAllKPIs() as an Effect program via runtime.
        3. Map KPIRepositoryError _tags (missing_file, invalid_yaml, schema_violation) to ToolResult.
        4. If any KPI spawn fails with command_not_found, fail the whole batch with ERR-CHEST-06.
           runAll runs each KPI sequentially in v1.
        5. On success: return { ok: true, data: { results: evidence[] } }.
      </handler_contract>
    </tool>
  </tools>

  <plugin_composition>
    chest.kpis.run and chest.kpis.run-all are added to the kpis bridge in
    src/plugin/kpis-tools.ts alongside list, get, upsert, remove.
    Groups assembled in src/plugin/tool-registry.ts.
    See umbrella tool_registry for full composition.
  </plugin_composition>

  <effects>
    src/kpis/run.ts, src/kpis/run-all.ts: Effect (no direct I/O; uses KPIRunner port).
    src/workspace/layers.ts wires BunKPIRunner: child_process.spawn (or Bun.spawn).
    AbortSignal / setTimeout for timeout enforcement (inside BunKPIRunner).
    src/workspace/yaml-repository.ts: fs/promises.readFile (via KPIRepository).
    src/plugin/kpis-tools.ts: ohtools defineTool, ToolResult mapping.
    No fetch, no LLM.
  </effects>

  <observability>
    Logger.info per KPI run with kpiId, exitCode, durationMs.
    Logger.warn on nonzero exit with kpiId and exitCode.
    Logger.warn on timeout with kpiId.
    Logger.error on ERR-CHEST-06 with command name.
    Stdout and stderr are truncated to 64 KB each in the evidence before
    logging; full content is in the KPIEvidence record.
  </observability>

</spec>
