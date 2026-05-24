<spec name="Ohtools Exposure Functional Specification" feature="ohtools-exposure" extends="../../functional.spec">

  <summary>
    The ohtools-exposure slice wires all Chest tools into the @bosun-sh/ohtools
    registry and exposes the complete plugin through both MCP and CLI adapters.
    It ensures every tool defined in the other eight feature slices is
    discoverable, callable with the same input and output contract, and
    accessible via `bunx ohtools list`, MCP `tools/list`, and CLI `run`.
    src/ohtools.ts is replaced from the placeholder to the real composition root.
  </summary>

  <use_cases>
    <use_case id="UC-OHT-01" actor="planning-agent" surface="mcp">
      <goal>Discover all available Chest tools via MCP tools/list.</goal>
      <preconditions>MCP server is running with src/ohtools.ts as the app entry.</preconditions>
      <inputs>MCP initialize + tools/list request (no tool input).</inputs>
      <steps>
        1. MCP client sends tools/list.
        2. Ohtools enumerates all registered tools from chestPlugin.
        3. Returns tool descriptors with id, description, and inputSchema.
      </steps>
      <outputs>
        MCP response listing all 20 tool IDs:
        chest.init, chest.okrs.list, chest.okrs.get, chest.okrs.upsert,
        chest.okrs.remove, chest.kpis.list, chest.kpis.get, chest.kpis.upsert,
        chest.kpis.remove, chest.kpis.run, chest.kpis.run-all,
        chest.dor.list, chest.dor.upsert,
        chest.dod.list, chest.dod.upsert,
        chest.validate.ready, chest.validate.done,
        chest.judge.align,
        chest.reports.list, chest.reports.get.
      </outputs>
      <postconditions>Each tool descriptor has a non-empty description and an object-rooted inputSchema.</postconditions>
    </use_case>

    <use_case id="UC-OHT-02" actor="ci-runner" surface="cli">
      <goal>Run chest.init via CLI and verify structured JSON output.</goal>
      <preconditions>src/ohtools.ts is the app entry. Target directory is writable.</preconditions>
      <inputs>
        bunx ohtools --app src/ohtools.ts run chest.init --input '{"dir":"/tmp/cli-test"}'
      </inputs>
      <steps>
        1. CLI parses tool id and JSON input.
        2. Resolves chest.init handler.
        3. Executes handler.
        4. Wraps result in CLI JSON envelope.
        5. Prints to stdout.
      </steps>
      <outputs>
        Stdout (JSON envelope, ToolResult format):
        { "ok": true, "data": { "created": [...], "skipped": [] } }
      </outputs>
      <postconditions>/tmp/cli-test/.chest/ created with four governance files.</postconditions>
    </use_case>

    <use_case id="UC-OHT-03" actor="planning-agent" surface="mcp">
      <goal>Invoke chest.validate.ready via MCP tool call and receive a ValidationReport.</goal>
      <preconditions>.chest/ is initialized. JudgeProvider is configured.</preconditions>
      <inputs>
        MCP tool call: { name: "chest.validate.ready", arguments: { "plan": "Implement X with AC and risks." } }
      </inputs>
      <steps>
        1. MCP adapter routes the call to chest.validate.ready handler.
        2. Handler executes the validate-readiness workflow.
        3. Returns ValidationReport as structured content.
      </steps>
      <outputs>
        MCP tool result content (ToolResult format):
        { "ok": true, "data": { "workflow": "ready", "status": "passed", "rationale": "...", "followUps": [] } }
      </outputs>
      <postconditions>ValidationReport persisted. Returned via MCP transport.</postconditions>
    </use_case>
  </use_cases>

  <error_scenarios>
    <scenario id="ES-OHT-01" ref="ERR-CHEST-04">
      <trigger>MCP or CLI caller supplies input that violates the tool's JSON Schema.</trigger>
      <observable>
        OHTOOLS_VALIDATION_ERROR returned via MCP error response or CLI JSON
        envelope with ok: false. Error includes the violated field path.
      </observable>
    </scenario>
  </error_scenarios>

  <acceptance_criteria>
    <ac id="AC-OHT-01" rolls_up_to="AC-FUN-05">
      bunx ohtools --app src/ohtools.ts list returns all 20 tool IDs.
    </ac>
    <ac id="AC-OHT-02" rolls_up_to="AC-FUN-05">
      Every registered tool has a non-empty description and an object-rooted
      JSON Schema input.
    </ac>
    <ac id="AC-OHT-03" rolls_up_to="AC-FUN-05">
      MCP tools/list returns all 20 tool descriptors with id, description, and
      inputSchema.
    </ac>
    <ac id="AC-OHT-04" rolls_up_to="AC-FUN-05">
      CLI run round-trip for at least one tool per group produces the same
      output as direct handler invocation.
    </ac>
    <ac id="AC-OHT-05" rolls_up_to="AC-FUN-05">
      src/ohtools.ts exports a default Ohtools instance using chestPlugin and
      mcpAdapter().
    </ac>
  </acceptance_criteria>

  <out_of_scope>
    Defining new tool behavior (all tool behavior is defined in the other eight
    feature slices).
    HTTP/SSE transport for MCP (v1 uses stdio only).
    Authentication or authorization on the MCP server.
  </out_of_scope>

</spec>
