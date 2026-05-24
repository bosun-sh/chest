<spec name="Write Governance State Technical Specification" feature="write-governance-state" extends="../../technical.spec">

  <slice_layout>
    <file path="src/okrs/upsert.ts">
      upsertOKR(record: OKR): Effect&lt;WriteResult, OKRRepositoryError, OKRRepository&gt;.
      Reads current list, inserts or replaces by id, writes back.
    </file>
    <file path="src/okrs/remove.ts">
      removeOKR(id: string): Effect&lt;WriteResult, OKRRepositoryError, OKRRepository&gt;.
      Fails with { _tag: "not_found" } if no matching record.
    </file>
    <file path="src/okrs/rules.ts">
      validateOKR(record): Effect&lt;void, OKRRepositoryError&gt;. Pure validation rules.
      Called by upsert before write. No I/O.
    </file>
    <file path="src/kpis/upsert.ts">
      upsertKPI(record: KPI): Effect&lt;WriteResult, KPIRepositoryError, KPIRepository&gt;.
    </file>
    <file path="src/kpis/remove.ts">
      removeKPI(id: string): Effect&lt;WriteResult, KPIRepositoryError, KPIRepository&gt;.
    </file>
    <file path="src/dor/upsert.ts">
      upsertDoR(record: DoRCriterion): Effect&lt;WriteResult, DoRRepositoryError, DoRRepository&gt;.
    </file>
    <file path="src/dod/upsert.ts">
      upsertDoD(record: DoDCriterion): Effect&lt;WriteResult, DoDRepositoryError, DoDRepository&gt;.
    </file>
    <file path="src/plugin/okrs-tools.ts">
      Adds chest.okrs.upsert and chest.okrs.remove to the okrs bridge alongside read tools.
    </file>
    <file path="src/plugin/kpis-tools.ts">
      Adds chest.kpis.upsert and chest.kpis.remove to the kpis bridge.
    </file>
    <file path="src/plugin/dor-tools.ts">
      Adds chest.dor.upsert to the dor bridge.
    </file>
    <file path="src/plugin/dod-tools.ts">
      Adds chest.dod.upsert to the dod bridge.
    </file>
  </slice_layout>

  <domain_types>
    <schema_ref name="okrs.v1"/>
    <schema_ref name="kpis.v1"/>
    <schema_ref name="dor.v1"/>
    <schema_ref name="dod.v1"/>
    Uses: OKR, KPI, DoRCriterion, DoDCriterion from domain_types.
    WriteResult = { op: 'inserted'|'updated'|'removed'; id: string } (value object in
    src/shared/ids.ts or each entity's upsert/remove file).
  </domain_types>

  <ports_used>
    OKRRepository.list, OKRRepository.save, OKRRepository.remove (from src/okrs/ports.ts).
    KPIRepository.list, KPIRepository.save, KPIRepository.remove (from src/kpis/ports.ts).
    DoRRepository.list, DoRRepository.save (from src/dor/ports.ts).
    DoDRepository.list, DoDRepository.save (from src/dod/ports.ts).
    No KPIRunner, JudgeProvider, or Clock.
  </ports_used>

  <yaml_touchpoints>
    Reads then writes:
      .chest/okrs.yaml             (schema: okrs.v1)
      .chest/kpis.yaml             (schema: kpis.v1)
      .chest/definition-of-ready.yaml   (schema: dor.v1)
      .chest/definition-of-done.yaml    (schema: dod.v1)
    Each write is atomic: atomicWrite (temp file + rename) in src/workspace/yaml-repository.ts.
  </yaml_touchpoints>

  <tools>
    <tool id="chest.okrs.upsert" api="defineTool" group="chest.okrs">
      <description>
        Insert or update an OKR in the governance store. Uses the record id
        to determine insert vs. update.
      </description>
      <input_schema>
        {
          "type": "object",
          "properties": {
            "record": {
              "type": "object",
              "properties": {
                "id":        { "type": "string" },
                "objective": { "type": "string" },
                "keyResults": {
                  "type": "array",
                  "minItems": 1,
                  "items": {
                    "type": "object",
                    "properties": {
                      "id":          { "type": "string" },
                      "description": { "type": "string" },
                      "target":      { "type": "string" }
                    },
                    "required": ["id", "description", "target"],
                    "additionalProperties": false
                  }
                },
                "owner": { "type": "string" },
                "tags":  { "type": "array", "items": { "type": "string" } }
              },
              "required": ["id", "objective", "keyResults"],
              "additionalProperties": false
            }
          },
          "required": ["record"],
          "additionalProperties": false
        }
      </input_schema>
      <output_schema>
        {
          "type": "object",
          "properties": {
            "op": { "type": "string", "enum": ["inserted", "updated"] },
            "id": { "type": "string" }
          },
          "required": ["op", "id"],
          "additionalProperties": false
        }
      </output_schema>
      <errors>
        <error ref="ERR-CHEST-01"/>
        <error ref="ERR-CHEST-02"/>
        <error ref="ERR-CHEST-03"/>
        <error ref="ERR-CHEST-04"/>
        <error ref="ERR-CHEST-05"/>
      </errors>
      <handler_contract>
        1. Parse unknown input; validate record shape against public schema (ERR-CHEST-04 if invalid).
        2. Call upsertOKR(input.record) as an Effect program via runtime.
        3. Map OKRRepositoryError _tags to ToolResult:
             { _tag: "missing_file" }     → ERR-CHEST-03
             { _tag: "invalid_yaml" }     → ERR-CHEST-01
             { _tag: "schema_violation" } → ERR-CHEST-02
             { _tag: "unsafe_write" }     → ERR-CHEST-05
        4. On success: return { ok: true, data: { op, id } }.
        Bridges return ToolResult envelopes; entity failures stay tagged unions and are mapped in the bridge.
      </handler_contract>
    </tool>

    <tool id="chest.okrs.remove" api="defineTool" group="chest.okrs">
      <description>Remove an OKR from the governance store by ID.</description>
      <input_schema>
        {
          "type": "object",
          "properties": {
            "id": { "type": "string", "description": "OKR ID to remove." }
          },
          "required": ["id"],
          "additionalProperties": false
        }
      </input_schema>
      <output_schema>
        {
          "type": "object",
          "properties": {
            "op": { "type": "string", "enum": ["removed"] },
            "id": { "type": "string" }
          },
          "required": ["op", "id"],
          "additionalProperties": false
        }
      </output_schema>
      <errors>
        <error ref="ERR-CHEST-02"/>
        <error ref="ERR-CHEST-03"/>
        <error ref="ERR-CHEST-05"/>
      </errors>
      <handler_contract>
        1. Parse unknown input; extract id.
        2. Call removeOKR(input.id) via runtime.
        3. Map { _tag: "not_found" } → ERR-CHEST-02 "OKR with id '&lt;id&gt;' not found."
        4. On success: return { ok: true, data: { op: "removed", id } }.
      </handler_contract>
    </tool>

    <tool id="chest.kpis.upsert" api="defineTool" group="chest.kpis">
      <description>Insert or update a KPI definition in the governance store.</description>
      <input_schema>
        {
          "type": "object",
          "properties": {
            "record": {
              "type": "object",
              "properties": {
                "id":                  { "type": "string" },
                "name":                { "type": "string" },
                "target":              { "type": "string" },
                "command":             { "type": "array", "items": { "type": "string" }, "minItems": 1 },
                "timeout_ms":          { "type": "number" },
                "evidence_normalizer": { "type": "string" }
              },
              "required": ["id", "name", "target", "command", "timeout_ms"],
              "additionalProperties": false
            }
          },
          "required": ["record"],
          "additionalProperties": false
        }
      </input_schema>
      <output_schema>
        {
          "type": "object",
          "properties": {
            "op": { "type": "string", "enum": ["inserted", "updated"] },
            "id": { "type": "string" }
          },
          "required": ["op", "id"],
          "additionalProperties": false
        }
      </output_schema>
      <errors>
        <error ref="ERR-CHEST-01"/>
        <error ref="ERR-CHEST-02"/>
        <error ref="ERR-CHEST-03"/>
        <error ref="ERR-CHEST-04"/>
        <error ref="ERR-CHEST-05"/>
      </errors>
      <handler_contract>
        Same upsert pattern as chest.okrs.upsert applied to kpis.yaml via upsertKPI().
      </handler_contract>
    </tool>

    <tool id="chest.kpis.remove" api="defineTool" group="chest.kpis">
      <description>Remove a KPI definition from the governance store by ID.</description>
      <input_schema>
        {
          "type": "object",
          "properties": {
            "id": { "type": "string" }
          },
          "required": ["id"],
          "additionalProperties": false
        }
      </input_schema>
      <output_schema>
        {
          "type": "object",
          "properties": {
            "op": { "type": "string", "enum": ["removed"] },
            "id": { "type": "string" }
          },
          "required": ["op", "id"],
          "additionalProperties": false
        }
      </output_schema>
      <errors>
        <error ref="ERR-CHEST-02"/>
        <error ref="ERR-CHEST-03"/>
        <error ref="ERR-CHEST-05"/>
      </errors>
      <handler_contract>
        Same remove pattern as chest.okrs.remove applied to kpis.yaml via removeKPI().
      </handler_contract>
    </tool>

    <tool id="chest.dor.upsert" api="defineTool" group="chest.dor">
      <description>Insert or update a Definition of Ready criterion.</description>
      <input_schema>
        {
          "type": "object",
          "properties": {
            "record": {
              "type": "object",
              "properties": {
                "id":       { "type": "string" },
                "text":     { "type": "string" },
                "severity": { "type": "string", "enum": ["blocking", "advisory"] }
              },
              "required": ["id", "text", "severity"],
              "additionalProperties": false
            }
          },
          "required": ["record"],
          "additionalProperties": false
        }
      </input_schema>
      <output_schema>
        {
          "type": "object",
          "properties": {
            "op": { "type": "string", "enum": ["inserted", "updated"] },
            "id": { "type": "string" }
          },
          "required": ["op", "id"],
          "additionalProperties": false
        }
      </output_schema>
      <errors>
        <error ref="ERR-CHEST-01"/>
        <error ref="ERR-CHEST-02"/>
        <error ref="ERR-CHEST-03"/>
        <error ref="ERR-CHEST-04"/>
        <error ref="ERR-CHEST-05"/>
      </errors>
      <handler_contract>
        Same upsert pattern applied to definition-of-ready.yaml via upsertDoR().
      </handler_contract>
    </tool>

    <tool id="chest.dod.upsert" api="defineTool" group="chest.dod">
      <description>Insert or update a Definition of Done criterion.</description>
      <input_schema>
        {
          "type": "object",
          "properties": {
            "record": {
              "type": "object",
              "properties": {
                "id":          { "type": "string" },
                "text":        { "type": "string" },
                "severity":    { "type": "string", "enum": ["blocking", "advisory"] },
                "requires_kpi": { "type": "string" }
              },
              "required": ["id", "text", "severity"],
              "additionalProperties": false
            }
          },
          "required": ["record"],
          "additionalProperties": false
        }
      </input_schema>
      <output_schema>
        {
          "type": "object",
          "properties": {
            "op": { "type": "string", "enum": ["inserted", "updated"] },
            "id": { "type": "string" }
          },
          "required": ["op", "id"],
          "additionalProperties": false
        }
      </output_schema>
      <errors>
        <error ref="ERR-CHEST-01"/>
        <error ref="ERR-CHEST-02"/>
        <error ref="ERR-CHEST-03"/>
        <error ref="ERR-CHEST-04"/>
        <error ref="ERR-CHEST-05"/>
      </errors>
      <handler_contract>
        Same upsert pattern applied to definition-of-done.yaml via upsertDoD().
      </handler_contract>
    </tool>
  </tools>

  <plugin_composition>
    Write tools are added to the same entity bridge files as read tools:
      src/plugin/okrs-tools.ts  → chest.okrs.upsert, chest.okrs.remove
      src/plugin/kpis-tools.ts  → chest.kpis.upsert, chest.kpis.remove
      src/plugin/dor-tools.ts   → chest.dor.upsert
      src/plugin/dod-tools.ts   → chest.dod.upsert
    Groups assembled in src/plugin/tool-registry.ts.
    See umbrella tool_registry for full composition.
  </plugin_composition>

  <effects>
    src/okrs/upsert.ts, src/okrs/remove.ts: Effect (no I/O; writes via OKRRepository port).
    src/workspace/yaml-repository.ts: fs/promises.readFile, atomicWrite (writeFile + rename + unlink on failure).
    src/plugin/okrs-tools.ts: ohtools defineTool, ToolResult mapping.
    No child_process, fetch, or LLM.
  </effects>

  <observability>
    Logger.info on successful upsert/remove with op and id.
    Logger.warn on ERR-CHEST-05 (conflict) with file path.
    Logger.error on ERR-CHEST-04 with violated constraints.
  </observability>

</spec>
