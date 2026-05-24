<spec name="Read Governance State Test Specification" feature="read-governance-state" extends="../../test.spec">

  <fixtures_used>
    tests/fixtures/governance/valid/        (all four files present and valid)
    tests/fixtures/governance/invalid-yaml/ (okrs.yaml has YAML parse error)
    tests/fixtures/governance/missing-keys/ (okrs.yaml and kpis.yaml have missing required fields)
    Missing file scenario: temporary directory with no .chest/ directory.
  </fixtures_used>

  <test_cases>
    <test_case id="TC-READ-01" level="integration" covers="UC-READ-01 AC-READ-01">
      <given>
        .chest/ initialized from tests/fixtures/governance/valid/.
        okrs.yaml contains two OKR records.
      </given>
      <input>{}</input>
      <when>chest.okrs.list handler is called.</when>
      <expected_output>
        {
          "ok": true,
          "data": {
            "items": [
              {
                "id": "okr-1",
                "objective": "Deliver chest v1 to production",
                "keyResults": [
                  { "id": "kr-1", "description": "All 30 spec files written", "target": "30 files" },
                  { "id": "kr-2", "description": "All acceptance criteria covered by tests", "target": "100%" }
                ]
              },
              {
                "id": "okr-2",
                "objective": "Achieve agent self-governance",
                "keyResults": [
                  { "id": "kr-3", "description": "Zero human checkpoints in CI", "target": "0" },
                  { "id": "kr-4", "description": "Validation latency under 5s", "target": "5000ms" }
                ]
              }
            ]
          }
        }
      </expected_output>
      <expected_errors>None.</expected_errors>
    </test_case>

    <test_case id="TC-READ-02" level="integration" covers="UC-READ-02 AC-READ-04">
      <given>
        .chest/ initialized from tests/fixtures/governance/valid/.
        okrs.yaml contains an OKR with id "okr-1".
      </given>
      <input>{ "id": "okr-1" }</input>
      <when>chest.okrs.get handler is called.</when>
      <expected_output>
        {
          "ok": true,
          "data": {
            "id": "okr-1",
            "objective": "Deliver chest v1 to production",
            "keyResults": [
              { "id": "kr-1", "description": "All 30 spec files written", "target": "30 files" },
              { "id": "kr-2", "description": "All acceptance criteria covered by tests", "target": "100%" }
            ]
          }
        }
      </expected_output>
      <expected_errors>None.</expected_errors>
    </test_case>

    <test_case id="TC-READ-03" level="integration" covers="UC-READ-03 AC-READ-02">
      <given>
        .chest/ initialized from tests/fixtures/governance/valid/.
        kpis.yaml contains two KPI records.
      </given>
      <input>{}</input>
      <when>chest.kpis.list handler is called.</when>
      <expected_output>
        {
          "ok": true,
          "data": {
            "items": [
              { "id": "kpi-1", "name": "Test suite passes", "target": "exit 0", "command": ["bun", "test"], "timeoutMs": 5000 },
              { "id": "kpi-2", "name": "TypeCheck passes", "target": "exit 0", "command": ["bun", "run", "typecheck"], "timeoutMs": 5000 }
            ]
          }
        }
      </expected_output>
      <expected_errors>None.</expected_errors>
    </test_case>

    <test_case id="TC-READ-04" level="integration" covers="UC-READ-04 AC-READ-03">
      <given>
        .chest/ initialized from tests/fixtures/governance/valid/.
        Both DoR and DoD files contain two criteria each.
      </given>
      <input>{}  (separate calls to chest.dor.list and chest.dod.list)</input>
      <when>Both handlers are called.</when>
      <expected_output>
        chest.dor.list:
        { "ok": true, "data": { "items": [
          { "id": "dor-1", "text": "Plan includes acceptance criteria", "severity": "blocking" },
          { "id": "dor-2", "text": "Plan identifies key risks", "severity": "advisory" }
        ] } }

        chest.dod.list:
        { "ok": true, "data": { "items": [
          { "id": "dod-1", "text": "All tests pass", "severity": "blocking", "requiresKpi": "kpi-1" },
          { "id": "dod-2", "text": "Implementation matches plan", "severity": "blocking" }
        ] } }
      </expected_output>
      <expected_errors>None.</expected_errors>
    </test_case>

    <test_case id="TC-READ-05" level="integration" covers="UC-READ-05 ES-READ-01 AC-READ-05">
      <given>A temporary directory with no .chest/ subdirectory.</given>
      <input>{}</input>
      <when>chest.okrs.list handler is called.</when>
      <expected_output>None.</expected_output>
      <expected_errors>
        {
          "ok": false,
          "error": {
            "code": "ERR-CHEST-03",
            "message": "Governance file not found: &lt;path&gt;/.chest/okrs.yaml. Run chest.init to create the governance store."
          }
        }
      </expected_errors>
    </test_case>

    <test_case id="TC-READ-06" level="integration" covers="ES-READ-02 AC-READ-06">
      <given>
        .chest/ initialized from tests/fixtures/governance/invalid-yaml/.
        okrs.yaml contains a YAML parse error on line 3.
      </given>
      <input>{}</input>
      <when>chest.okrs.list handler is called.</when>
      <expected_output>None.</expected_output>
      <expected_errors>
        {
          "ok": false,
          "error": {
            "code": "ERR-CHEST-01",
            "file": "&lt;path&gt;/.chest/okrs.yaml",
            "line": 3,
            "message": "YAML parse error: &lt;parser message&gt;"
          }
        }
      </expected_errors>
    </test_case>

    <test_case id="TC-READ-07" level="integration" covers="ES-READ-03 AC-READ-07">
      <given>
        .chest/ initialized from tests/fixtures/governance/missing-keys/.
        okrs.yaml is valid YAML but second record is missing required "objective" field.
      </given>
      <input>{}</input>
      <when>chest.okrs.list handler is called.</when>
      <expected_output>None.</expected_output>
      <expected_errors>
        {
          "ok": false,
          "error": {
            "code": "ERR-CHEST-02",
            "file": "&lt;path&gt;/.chest/okrs.yaml",
            "violations": [
              { "path": "records[1].objective", "constraint": "required field missing" }
            ]
          }
        }
      </expected_errors>
    </test_case>

    <test_case id="TC-READ-08" level="integration" covers="ES-READ-04">
      <given>
        .chest/ initialized from tests/fixtures/governance/valid/.
        okrs.yaml contains "okr-1" and "okr-2" but not "okr-99".
      </given>
      <input>{ "id": "okr-99" }</input>
      <when>chest.okrs.get handler is called.</when>
      <expected_output>None.</expected_output>
      <expected_errors>
        {
          "ok": false,
          "error": {
            "code": "ERR-CHEST-02",
            "message": "OKR with id 'okr-99' not found."
          }
        }
      </expected_errors>
    </test_case>
  </test_cases>

  <coverage_matrix>
    <row uc="UC-READ-01" tests="TC-READ-01"/>
    <row uc="UC-READ-02" tests="TC-READ-02"/>
    <row uc="UC-READ-03" tests="TC-READ-03"/>
    <row uc="UC-READ-04" tests="TC-READ-04"/>
    <row uc="UC-READ-05" tests="TC-READ-05,TC-READ-06,TC-READ-07"/>
  </coverage_matrix>

</spec>
