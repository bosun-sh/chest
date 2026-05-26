<spec name="Validate Ready Technical Specification" feature="validate-ready" extends="../../technical.spec">

  <slice_layout>
    <file path="src/validation/ready.ts">
      validateReady(plan: string, dor: DoRCriterion[], okrs: OKR[]):
      Effect&lt;JudgeResponse, never, JudgeProvider&gt;.
      Calls JudgeProvider.judge; on { _tag: "unreachable" } falls back to
      ruleBasedReadinessCheck. Pure entity logic; no I/O.
    </file>
    <file path="src/validation/rules.ts">
      ruleBasedReadinessCheck(plan: string, criteria: DoRCriterion[]): JudgeResponse.
      Pure function. No I/O. Checks each blocking criterion for keyword presence
      in the plan text. Returns status "needs_review" or "failed".
    </file>
    <file path="src/plugin/validate-tools.ts">
      defineGroup for chest.validate containing chest.validate.ready and
      chest.validate.done tools.
      For chest.validate.ready: loads DoR and OKRs via entity ports, calls
      validateReady(), then calls ReportRepository.write(). Maps errors to ToolResult.
    </file>
  </slice_layout>

  <domain_types>
    Uses: DoRCriterion, OKR, JudgeResponse, ValidationReport, EvidenceRef from domain_types.
    <schema_ref name="dor.v1"/>
    Zod schemas in src/dor/schema.ts and src/validation/schema.ts.
  </domain_types>

  <ports_used>
    DoRRepository.list (load criteria; from src/dor/ports.ts).
    OKRRepository.list (optional context load; empty list acceptable; from src/okrs/ports.ts).
    JudgeProvider.judge (from src/judge/ports.ts; called inside validateReady()).
    ReportRepository.write (persist result; called from the plugin bridge, not entity code).
    Clock.now and Clock.newId (report id and timestamp).
    No KPIRunner.
  </ports_used>

  <yaml_touchpoints>
    Reads:
      .chest/definition-of-ready.yaml   (schema: dor.v1)
      .chest/okrs.yaml                  (schema: okrs.v1, optional)
    Writes:
      .chest/reports/&lt;timestamp&gt;-ready.yaml  (schema: report.v1)
    Write performed by plugin bridge via ReportRepository.write.
  </yaml_touchpoints>

  <tools>
    <tool id="chest.validate.ready" api="defineTool" group="chest.validate">
      <description>
        Evaluate a plan against Definition of Ready criteria using the
        configured judge. Returns a ValidationReport with status passed,
        failed, or needs_review.
      </description>
      <input_schema>
        {
          "type": "object",
          "properties": {
            "plan": {
              "type": "string",
              "description": "Text description of the plan to validate."
            },
            "ref": {
              "type": "string",
              "description": "Optional reference identifier for the plan (e.g., issue number or branch name)."
            }
          },
          "required": ["plan"],
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
        <error ref="ERR-CHEST-07"/>
        <error ref="ERR-CHEST-08"/>
      </errors>
      <handler_contract>
        1. Parse unknown input; extract plan and optional ref.
        2. Load DoR criteria via DoRRepository.list() (Effect program via runtime).
           Map DoRRepositoryError _tags to ToolResult on failure (ERR-CHEST-01/02/03).
        3. Load OKRs via OKRRepository.list() (optional; treat missing_file as empty list).
        4. Call validateReady(plan, dor, okrs) (Entity Effect program; no I/O).
           validateReady internally calls JudgeProvider.judge; on { _tag: "unreachable" }
           it falls back to ruleBasedReadinessCheck — this fallback happens inside the
           entity program, not the bridge.
        5. Normalize JudgeResponse to ValidationReport:
           workflow "ready", id = clock.newId(), timestamp = clock.now().
        6. Call ReportRepository.write(report) to persist.
        7. Return { ok: true, data: report }.
        Map { _tag: "malformed_response" } → ERR-CHEST-08 (no fallback for malformed).
        Bridges return ToolResult envelopes; entity failures stay tagged unions and are mapped in the bridge.
      </handler_contract>
    </tool>
  </tools>

  <plugin_composition>
    validateGroup defined in src/plugin/validate-tools.ts.
    Contains chest.validate.ready alongside chest.validate.done.
    Groups assembled in src/plugin/tool-registry.ts.
    See umbrella tool_registry for full composition.
  </plugin_composition>

  <effects>
    src/validation/ready.ts: Effect (no direct I/O; uses JudgeProvider port).
    src/validation/rules.ts: pure function (no effects).
    src/workspace/yaml-repository.ts: fs/promises.readFile (via DoRRepository, OKRRepository).
    src/workspace/yaml-repository.ts: fs/promises.writeFile + rename (via ReportRepository.write).
    src/judge/providers/openai/adapter.ts: fetch (HTTP calls to OpenAI API).
    src/plugin/validate-tools.ts: ohtools defineTool, ToolResult mapping, orchestrates
      entity loads, validateReady(), then ReportRepository.write().
    No child_process.
  </effects>

  <observability>
    Logger.info on successful validation with status and confidence.
    Logger.warn on judge unavailability and fallback activation.
    Logger.error on ERR-CHEST-08.
  </observability>

</spec>
