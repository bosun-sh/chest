<spec name="Initialize Storage Technical Specification" feature="initialize-storage" extends="../../technical.spec">

  <slice_layout>
    <file path="src/workspace/init.ts">
      initWorkspace(dir, force): Effect&lt;InitResult, WorkspaceError&gt;. Creates
      .chest/ and writes four empty governance files atomically. WorkspaceError
      has _tag "conflict" (store exists, force false) or "write_failed" (I/O error).
    </file>
    <file path="src/workspace/storage-paths.ts">
      chestHome(dir?): string. Resolves .chest/ path from CHEST_HOME or dir or cwd.
    </file>
    <file path="src/plugin/init-tool.ts">
      defineTool for chest.init. Parses unknown input, calls initWorkspace via
      Effect runtime, maps WorkspaceError _tags to ToolResult.
    </file>
  </slice_layout>

  <domain_types>
    No new entity domain types. InitResult is a value object:
    { created: string[]; skipped: string[] }
    It lives in src/workspace/init.ts (not in any entity schema file) since it
    has no governance semantics.
  </domain_types>

  <ports_used>
    No entity ports (OKRRepository, KPIRepository, etc.) are called during init.
    initWorkspace uses src/shared/atomic-write.ts directly to write the four
    empty YAML files. The workspace init path bypasses entity repositories
    because those require an already-initialized store.
  </ports_used>

  <yaml_touchpoints>
    Creates (does not read):
      .chest/okrs.yaml     (schema: okrs.v1, content: empty array [])
      .chest/kpis.yaml     (schema: kpis.v1, content: empty array [])
      .chest/definition-of-ready.yaml   (schema: dor.v1, content: [])
      .chest/definition-of-done.yaml    (schema: dod.v1, content: [])
  </yaml_touchpoints>

  <tools>
    <tool id="chest.init" api="defineTool" group="chest (root, no group prefix)">
      <description>
        Initialize a Chest governance store in the target directory. Creates
        .chest/ with empty okrs.yaml, kpis.yaml, definition-of-ready.yaml,
        and definition-of-done.yaml. Refuses to overwrite an existing store
        unless force is true.
      </description>
      <input_schema>
        {
          "type": "object",
          "properties": {
            "dir": {
              "type": "string",
              "description": "Target directory path. Defaults to current working directory."
            },
            "force": {
              "type": "boolean",
              "description": "Overwrite existing .chest/ if present. Default false."
            }
          },
          "additionalProperties": false
        }
      </input_schema>
      <output_schema>
        {
          "type": "object",
          "properties": {
            "created": {
              "type": "array",
              "items": { "type": "string" },
              "description": "Paths of files that were written."
            },
            "skipped": {
              "type": "array",
              "items": { "type": "string" },
              "description": "Paths that were not written (empty in v1)."
            }
          },
          "required": ["created", "skipped"],
          "additionalProperties": false
        }
      </output_schema>
      <errors>
        <error ref="ERR-CHEST-10"/>
        <error ref="ERR-CHEST-03"/>
      </errors>
      <handler_contract>
        1. Parse unknown input using the public schema from src/plugin/public-schemas.ts.
        2. Resolve target path: input.dir ?? process.cwd().
        3. Call initWorkspace(resolvedDir, input.force ?? false) as an Effect program.
        4. Map WorkspaceError _tags to ToolResult:
             { _tag: "conflict" }      → { ok: false, error: { code: "ERR-CHEST-10", message: ... } }
             { _tag: "write_failed" }  → { ok: false, error: { code: "ERR-CHEST-03", message: ... } }
        5. On success: return { ok: true, data: { created: [...], skipped: [] } }.
        Bridges return ToolResult envelopes; entity failures stay tagged unions and are mapped in the bridge.
      </handler_contract>
    </tool>
  </tools>

  <plugin_composition>
    chest.init is registered directly on the chestPlugin at the root level
    (not inside a group).

    src/plugin/init-tool.ts:
      export const initTool = defineTool({
        id: "chest.init",
        description: "Initialize a Chest governance store...",
        run: (input) =&gt; runtime.runPromise(
          initWorkspace(resolveDir(input), resolveForce(input)).pipe(
            Effect.map(data =&gt; ({ ok: true, data })),
            Effect.catchAll(err =&gt; Effect.succeed({ ok: false, error: mapWorkspaceError(err) }))
          )
        )
      })

    Assembly in src/plugin/tool-registry.ts:
      chestPlugins includes plugin("chest").tool(initTool).group(okrsGroup)...
    See umbrella tool_registry for the full composition.
  </plugin_composition>

  <effects>
    src/workspace/init.ts: fs/promises.mkdir (creates .chest/), atomicWrite per file.
    src/shared/atomic-write.ts: fs/promises.writeFile (writes temp), fs/promises.rename (atomic swap).
    src/plugin/init-tool.ts: ohtools defineTool, ToolResult mapping.
    No child_process, fetch, or LLM.
  </effects>

  <observability>
    On success: Logger.info("chest.init completed", { created, dir }).
    On ERR-CHEST-10: Logger.warn("chest.init skipped: store exists", { dir }).
    On ERR-CHEST-03: Logger.error("chest.init failed: write error", { dir, error }).
  </observability>

</spec>
