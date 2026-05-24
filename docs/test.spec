<spec name="Chest Test Specification" status="v1">

  <test_pyramid>
    <level name="entity-unit">
      Pure entity Effect programs with TestLayer doubles. No filesystem,
      process, network, or ohtools imports. Location: tests/unit/&lt;entity&gt;/.
    </level>
    <level name="integration">
      Real temporary filesystem tests for YAML repositories and workspace init.
      Location: tests/integration/.
    </level>
    <level name="contract">
      Judge orchestration tests with FakeJudgeProvider via Layer.succeed.
      Location: tests/unit/judge/.
    </level>
    <level name="plugin-bridge">
      Tool registry and handler delegation tests. Assert ToolResult envelopes.
      Location: tests/unit/plugin/.
    </level>
    <level name="end-to-end">
      CLI and MCP stdio round-trips through src/ohtools.ts.
      Location: tests/e2e/.
    </level>
    <level name="architecture">
      Boundary scans that enforce entity isolation and provider containment.
      Location: tests/unit/architecture/.
    </level>
  </test_pyramid>

  <runners_and_layout>
    <runner>bun test</runner>
    <unit_tests>tests/unit/&lt;entity&gt;/ mirrors src/&lt;entity&gt;/.</unit_tests>
    <architecture_tests>tests/unit/architecture/ contains the boundary scans.</architecture_tests>
    <plugin_tests>tests/unit/plugin/ validates registry shape and ToolResult envelopes.</plugin_tests>
    <integration_tests>tests/integration/ covers real repository behavior.</integration_tests>
    <e2e_tests>tests/e2e/ covers CLI and MCP flows.</e2e_tests>
  </runners_and_layout>

  <fixtures>
    <fixture path="tests/fixtures/governance/valid/">Baseline valid governance files.</fixture>
    <fixture path="tests/fixtures/governance/invalid-yaml/">YAML parse failure coverage.</fixture>
    <fixture path="tests/fixtures/governance/missing-keys/">Schema violation coverage.</fixture>
    <fixture path="tests/fixtures/governance/kpi-failing/">KPI nonzero and batch behavior coverage.</fixture>
  </fixtures>

  <naming_conventions>
    <test_ids>TC-&lt;FEAT&gt;-NN</test_ids>
    <feat_codes>
      INIT: initialize-storage
      READ: read-governance-state
      WRITE: write-governance-state
      RDY: validate-ready
      DONE: validate-done
      KPI: run-kpi-checks
      JUDGE: judge-governance-alignment
      REP: validation-reports
      OHT: ohtools-exposure
      ARCH: architecture-boundary
    </feat_codes>
    <describe_blocks>describe("&lt;feature-name&gt;")</describe_blocks>
    <it_blocks>it("TC-...: ...")</it_blocks>
  </naming_conventions>

  <judge_test_double>
    <name>FakeJudgeProvider</name>
    <location>tests/doubles/fake-judge-provider.ts</location>
    <behavior>Layer.succeed(JudgeProvider, fake) for contract tests. Scripted responses are keyed by a request hash.</behavior>
    <scripted_responses>
      throw mode maps to JudgeProviderError._tag = "unreachable".
      malformed mode maps to JudgeProviderError._tag = "malformed_response".
    </scripted_responses>
    <openai_adapter_tests>
      OpenAI adapter coverage is gated and uses recorded HTTP fixtures.
    </openai_adapter_tests>
  </judge_test_double>

  <architecture_tests>
    <test file="tests/unit/architecture/functional-core-boundaries.test.ts">
      <description>
        Walk src/{okrs,kpis,dor,dod,validation,reports}/ and src/judge/ except
        src/judge/providers/. Assert no file contains @bosun-sh/ohtools,
        /plugin/, /workspace/, node:fs, node:child_process, node:http,
        node:https, or openai. Bounds: 10,000 files and 1 MB per file.
      </description>
      <test_id>TC-ARCH-01</test_id>
      <maps_to>AC-FUN-11</maps_to>
    </test>
    <test file="tests/unit/architecture/provider-boundaries.test.ts">
      <description>
        Walk src/judge/ except src/judge/providers/openai/. Assert no file
        imports from providers/openai or openai.
      </description>
      <test_id>TC-ARCH-02</test_id>
      <maps_to>AC-FUN-11</maps_to>
    </test>
  </architecture_tests>

  <acceptance_matrix>
    <row ac="AC-FUN-01" tests="TC-INIT-01,TC-INIT-02"/>
    <row ac="AC-FUN-02" tests="TC-INIT-03"/>
    <row ac="AC-FUN-03" tests="TC-READ-01,TC-READ-02,TC-READ-03,TC-READ-04"/>
    <row ac="AC-FUN-04" tests="TC-READ-05,TC-READ-06,TC-READ-07"/>
    <row ac="AC-FUN-05" tests="TC-OHT-01,TC-OHT-02,TC-OHT-03,TC-OHT-04,TC-OHT-05"/>
    <row ac="AC-FUN-06" tests="TC-KPI-01,TC-KPI-02,TC-KPI-03"/>
    <row ac="AC-FUN-07" tests="TC-JUDGE-01"/>
    <row ac="AC-FUN-08" tests="TC-JUDGE-02,TC-JUDGE-03,TC-JUDGE-04"/>
    <row ac="AC-FUN-09" tests="TC-RDY-01,TC-RDY-02,TC-RDY-03"/>
    <row ac="AC-FUN-10" tests="TC-DONE-01,TC-DONE-02,TC-DONE-03"/>
    <row ac="AC-FUN-11" tests="TC-READ-05,TC-READ-06,TC-WRITE-04,TC-KPI-04,TC-KPI-06,TC-JUDGE-04,TC-JUDGE-05,TC-INIT-04,TC-ARCH-01,TC-ARCH-02"/>
    <row ac="AC-FUN-12" tests="TC-WRITE-01,TC-WRITE-02,TC-WRITE-03,TC-WRITE-05"/>
    <row ac="AC-FUN-13" tests="TC-KPI-05"/>
    <row ac="AC-FUN-14" tests="TC-REP-01,TC-REP-02,TC-REP-03,TC-REP-04,TC-REP-05"/>
  </acceptance_matrix>

  <commands>
    <command purpose="run all tests">bun test</command>
    <command purpose="run architecture tests only">bun test tests/unit/architecture/</command>
    <command purpose="registry snapshot">bunx ohtools --app src/ohtools.ts list</command>
    <command purpose="init run">bunx ohtools --app src/ohtools.ts run chest.init --input '{}'</command>
  </commands>

  <cross_references>
    <ref feature="initialize-storage" path="features/initialize-storage/test.spec"/>
    <ref feature="read-governance-state" path="features/read-governance-state/test.spec"/>
    <ref feature="write-governance-state" path="features/write-governance-state/test.spec"/>
    <ref feature="validate-ready" path="features/validate-ready/test.spec"/>
    <ref feature="validate-done" path="features/validate-done/test.spec"/>
    <ref feature="run-kpi-checks" path="features/run-kpi-checks/test.spec"/>
    <ref feature="judge-governance-alignment" path="features/judge-governance-alignment/test.spec"/>
    <ref feature="validation-reports" path="features/validation-reports/test.spec"/>
    <ref feature="ohtools-exposure" path="features/ohtools-exposure/test.spec"/>
  </cross_references>

</spec>
