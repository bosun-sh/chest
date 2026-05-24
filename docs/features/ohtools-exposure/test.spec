<spec name="Ohtools Exposure Test Specification" feature="ohtools-exposure" extends="../../test.spec">

  <fixtures_used>
    No governance fixture files needed for registry introspection tests.
    tests/fixtures/governance/valid/ used for e2e CLI round-trip tests.
    tests/doubles/fake-judge-provider.ts (for e2e validate-ready run).
  </fixtures_used>

  <test_cases>
    <test_case id="TC-OHT-01" level="ohtools-contract" covers="UC-OHT-01 AC-OHT-01 AC-OHT-02 AC-OHT-03">
      <given>
        src/ohtools.ts is the composition root with chestPlugin registered.
      </given>
      <input>
        bunx ohtools --app src/ohtools.ts list
        (or programmatic: new Ohtools().use(chestPlugin).explore())
      </input>
      <when>Registry is enumerated.</when>
      <expected_output>
        All 20 tool IDs present:
        [
          "chest.init",
          "chest.okrs.list", "chest.okrs.get", "chest.okrs.upsert", "chest.okrs.remove",
          "chest.kpis.list", "chest.kpis.get", "chest.kpis.upsert", "chest.kpis.remove",
          "chest.kpis.run", "chest.kpis.run-all",
          "chest.dor.list", "chest.dor.upsert",
          "chest.dod.list", "chest.dod.upsert",
          "chest.validate.ready", "chest.validate.done",
          "chest.judge.align",
          "chest.reports.list", "chest.reports.get"
        ]
        Each entry has: non-empty description (string), inputSchema.type === "object",
        inputSchema.additionalProperties === false.
      </expected_output>
      <expected_errors>None.</expected_errors>
    </test_case>

    <test_case id="TC-OHT-02" level="e2e" covers="UC-OHT-02 AC-OHT-04">
      <given>
        src/ohtools.ts is deployed. A writable temporary directory /tmp/oht-cli-test
        does not contain .chest/.
      </given>
      <input>
        bunx ohtools --app src/ohtools.ts run chest.init --input '{"dir":"/tmp/oht-cli-test"}'
      </input>
      <when>CLI command is executed.</when>
      <expected_output>
        Stdout contains JSON with ok: true and data.created containing four paths.
        Process exits with code 0.
        /tmp/oht-cli-test/.chest/ exists with four YAML files.
      </expected_output>
      <expected_errors>None.</expected_errors>
    </test_case>

    <test_case id="TC-OHT-03" level="e2e" covers="UC-OHT-03 AC-OHT-04">
      <given>
        .chest/ initialized from valid fixture in a tmpdir.
        FakeJudgeProvider injected (or CHEST_E2E_OPENAI=1 for real judge).
        MCP server spawned on stdio from src/ohtools.ts.
      </given>
      <input>
        MCP tools/list followed by:
        MCP tool_call: { name: "chest.validate.ready", arguments: { "plan": "Implement chest init with acceptance criteria and risks." } }
      </input>
      <when>MCP tool_call is sent over stdio.</when>
      <expected_output>
        MCP tool_call response content contains a ToolResult envelope with ok: true
        and data.workflow "ready" with status one of [passed, failed, needs_review].
        Process does not crash.
      </expected_output>
      <expected_errors>None.</expected_errors>
    </test_case>

    <test_case id="TC-OHT-04" level="ohtools-contract" covers="ES-OHT-01">
      <given>
        src/ohtools.ts is the composition root.
      </given>
      <input>
        bunx ohtools --app src/ohtools.ts run chest.init --input '{"unexpected_field":"x"}'
      </input>
      <when>CLI run is invoked with an input that violates additionalProperties: false.</when>
      <expected_output>
        Stdout contains JSON with ok: false and error.code OHTOOLS_VALIDATION_ERROR.
        Process exits with nonzero code.
      </expected_output>
      <expected_errors>
        { "ok": false, "error": { "code": "OHTOOLS_VALIDATION_ERROR", "message": "..." } }
      </expected_errors>
    </test_case>

    <test_case id="TC-OHT-05" level="ohtools-contract" covers="AC-OHT-05">
      <given>
        src/ohtools.ts source is read.
      </given>
      <input>Import default export from src/ohtools.ts.</input>
      <when>Module is imported in a test.</when>
      <expected_output>
        Default export is an Ohtools instance.
        It has an mcpAdapter registered.
        It exposes all 20 tool IDs via explore().
      </expected_output>
      <expected_errors>None.</expected_errors>
    </test_case>
  </test_cases>

  <coverage_matrix>
    <row uc="UC-OHT-01" tests="TC-OHT-01"/>
    <row uc="UC-OHT-02" tests="TC-OHT-02"/>
    <row uc="UC-OHT-03" tests="TC-OHT-03"/>
  </coverage_matrix>

</spec>
