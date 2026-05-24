<spec name="Read Governance State Technical Specification" feature="read-governance-state" extends="../../technical.spec">

  <slice_layout>
    <file path="src/okrs/list.ts">
      listOKRs(): Effect&lt;OKR[], OKRRepositoryError, OKRRepository&gt;. Pure; no I/O.
    </file>
    <file path="src/okrs/get.ts">
      getOKR(id: string): Effect&lt;OKR, OKRRepositoryError, OKRRepository&gt;.
      Fails with { _tag: "not_found", id } if absent.
    </file>
    <file path="src/kpis/list.ts">
      listKPIs(): Effect&lt;KPI[], KPIRepositoryError, KPIRepository&gt;.
    </file>
    <file path="src/kpis/get.ts">
      getKPI(id: string): Effect&lt;KPI, KPIRepositoryError, KPIRepository&gt;.
      Fails with { _tag: "not_found", id } if absent.
    </file>
    <file path="src/dor/list.ts">
      listDoR(): Effect&lt;DoRCriterion[], DoRRepositoryError, DoRRepository&gt;.
    </file>
    <file path="src/dod/list.ts">
      listDoD(): Effect&lt;DoDCriterion[], DoDRepositoryError, DoDRepository&gt;.
    </file>
    <file path="src/plugin/okrs-tools.ts">
      defineGroup for chest.okrs. Bridges list and get to src/okrs/ Effect programs.
      Maps OKRRepositoryError _tags to ToolResult.
    </file>
    <file path="src/plugin/kpis-tools.ts">
      defineGroup for chest.kpis. Bridges list and get to src/kpis/ Effect programs.
    </file>
    <file path="src/plugin/dor-tools.ts">
      defineGroup for chest.dor. Bridges list to src/dor/list.ts.
    </file>
    <file path="src/plugin/dod-tools.ts">
      defineGroup for chest.dod. Bridges list to src/dod/list.ts.
    </file>
  </slice_layout>

  <domain_types>
    <schema_ref name="okrs.v1"/>
    <schema_ref name="kpis.v1"/>
    <schema_ref name="dor.v1"/>
    <schema_ref name="dod.v1"/>
    Uses: OKR, KeyResult, KPI, DoRCriterion, DoDCriterion (interfaces defined in the entity slices).
    Zod schemas live in src/okrs/schema.ts, src/kpis/schema.ts, src/dor/schema.ts,
    src/dod/schema.ts.
  </domain_types>

  <ports_used>
    OKRRepository.list, OKRRepository.findById (from src/okrs/ports.ts).
    KPIRepository.list, KPIRepository.findById (from src/kpis/ports.ts).
    DoRRepository.list (from src/dor/ports.ts).
    DoDRepository.list (from src/dod/ports.ts).
    No KPIRunner, JudgeProvider, or Clock.
  </ports_used>

  <yaml_touchpoints>
    Reads:
      .chest/okrs.yaml             (schema: okrs.v1)
      .chest/kpis.yaml             (schema: kpis.v1)
      .chest/definition-of-ready.yaml   (schema: dor.v1)
      .chest/definition-of-done.yaml    (schema: dod.v1)
    Never writes.
  </yaml_touchpoints>

  <tools>
    <tool id="chest.okrs.list" api="defineTool" group="chest.okrs">
      <description>List all OKRs in the governance store.</description>
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
            "items": {
              "type": "array",
              "items": { "$ref": "#/$defs/OKR" }
            }
          },
          "required": ["items"],
          "additionalProperties": false
        }
      </output_schema>
      <errors>
        <error ref="ERR-CHEST-01"/>
        <error ref="ERR-CHEST-02"/>
        <error ref="ERR-CHEST-03"/>
      </errors>
      <handler_contract>
        1. Parse unknown input (empty object; validated by ohtools).
        2. Call listOKRs() as an Effect program via runtime.
        3. Map OKRRepositoryError _tags to ToolResult:
             { _tag: "missing_file" }     → { ok: false, error: { code: "ERR-CHEST-03", ... } }
             { _tag: "invalid_yaml" }     → { ok: false, error: { code: "ERR-CHEST-01", ... } }
             { _tag: "schema_violation" } → { ok: false, error: { code: "ERR-CHEST-02", ... } }
        4. On success: return { ok: true, data: { items: okrs } }.
        Bridges return ToolResult envelopes; entity failures stay tagged unions and are mapped in the bridge.
      </handler_contract>
    </tool>

    <tool id="chest.okrs.get" api="defineTool" group="chest.okrs">
      <description>Get a single OKR by its ID.</description>
      <input_schema>
        {
          "type": "object",
          "properties": {
            "id": { "type": "string", "description": "OKR ID." }
          },
          "required": ["id"],
          "additionalProperties": false
        }
      </input_schema>
      <output_schema>
        { "$ref": "#/$defs/OKR" }
      </output_schema>
      <errors>
        <error ref="ERR-CHEST-01"/>
        <error ref="ERR-CHEST-02"/>
        <error ref="ERR-CHEST-03"/>
      </errors>
      <handler_contract>
        1. Parse unknown input; extract id.
        2. Call getOKR(input.id) as an Effect program via runtime.
        3. Map OKRRepositoryError:
             { _tag: "not_found" }        → { ok: false, error: { code: "ERR-CHEST-02", message: "OKR with id '&lt;id&gt;' not found." } }
             { _tag: "missing_file" }     → ERR-CHEST-03
             { _tag: "invalid_yaml" }     → ERR-CHEST-01
             { _tag: "schema_violation" } → ERR-CHEST-02
        4. On success: return { ok: true, data: okr }.
      </handler_contract>
    </tool>

    <tool id="chest.kpis.list" api="defineTool" group="chest.kpis">
      <description>List all KPI definitions in the governance store.</description>
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
            "items": {
              "type": "array",
              "items": { "$ref": "#/$defs/KPI" }
            }
          },
          "required": ["items"],
          "additionalProperties": false
        }
      </output_schema>
      <errors>
        <error ref="ERR-CHEST-01"/>
        <error ref="ERR-CHEST-02"/>
        <error ref="ERR-CHEST-03"/>
      </errors>
      <handler_contract>
        Call listKPIs() via runtime. Map KPIRepositoryError _tags same as OKR pattern.
        Return { ok: true, data: { items: kpis } } on success.
      </handler_contract>
    </tool>

    <tool id="chest.kpis.get" api="defineTool" group="chest.kpis">
      <description>Get a single KPI definition by its ID.</description>
      <input_schema>
        {
          "type": "object",
          "properties": {
            "id": { "type": "string", "description": "KPI ID." }
          },
          "required": ["id"],
          "additionalProperties": false
        }
      </input_schema>
      <output_schema>{ "$ref": "#/$defs/KPI" }</output_schema>
      <errors>
        <error ref="ERR-CHEST-01"/>
        <error ref="ERR-CHEST-02"/>
        <error ref="ERR-CHEST-03"/>
      </errors>
      <handler_contract>
        Call getKPI(input.id) via runtime. Map { _tag: "not_found" } to ERR-CHEST-02.
        Return { ok: true, data: kpi } on success.
      </handler_contract>
    </tool>

    <tool id="chest.dor.list" api="defineTool" group="chest.dor">
      <description>List all Definition of Ready criteria.</description>
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
            "items": {
              "type": "array",
              "items": { "$ref": "#/$defs/DoRCriterion" }
            }
          },
          "required": ["items"],
          "additionalProperties": false
        }
      </output_schema>
      <errors>
        <error ref="ERR-CHEST-01"/>
        <error ref="ERR-CHEST-02"/>
        <error ref="ERR-CHEST-03"/>
      </errors>
      <handler_contract>
        Call listDoR() via runtime. Map DoRRepositoryError _tags. Return { ok: true, data: { items: criteria } }.
      </handler_contract>
    </tool>

    <tool id="chest.dod.list" api="defineTool" group="chest.dod">
      <description>List all Definition of Done criteria.</description>
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
            "items": {
              "type": "array",
              "items": { "$ref": "#/$defs/DoDCriterion" }
            }
          },
          "required": ["items"],
          "additionalProperties": false
        }
      </output_schema>
      <errors>
        <error ref="ERR-CHEST-01"/>
        <error ref="ERR-CHEST-02"/>
        <error ref="ERR-CHEST-03"/>
      </errors>
      <handler_contract>
        Call listDoD() via runtime. Map DoDRepositoryError _tags. Return { ok: true, data: { items: criteria } }.
      </handler_contract>
    </tool>
  </tools>

  <plugin_composition>
    Read tools are defined in their entity bridge files:
      src/plugin/okrs-tools.ts  → chest.okrs.list, chest.okrs.get (plus write tools)
      src/plugin/kpis-tools.ts  → chest.kpis.list, chest.kpis.get (plus write tools)
      src/plugin/dor-tools.ts   → chest.dor.list (plus upsert)
      src/plugin/dod-tools.ts   → chest.dod.list (plus upsert)
    Groups are assembled in src/plugin/tool-registry.ts.
    See umbrella tool_registry for full composition.
  </plugin_composition>

  <effects>
    src/okrs/list.ts, src/okrs/get.ts: Effect (no I/O; reads via OKRRepository port).
    src/workspace/yaml-repository.ts: fs/promises.readFile (I/O lives here, not in entity files).
    src/plugin/okrs-tools.ts: ohtools defineTool, ToolResult mapping.
    No writes. No child_process. No fetch.
  </effects>

  <observability>
    Logger.info on successful list/get with item count.
    Logger.warn on ERR-CHEST-03 with missing path.
    Logger.error on ERR-CHEST-01 and ERR-CHEST-02 with file path.
  </observability>

</spec>
