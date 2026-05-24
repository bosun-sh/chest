<spec name="Run KPI Checks Test Specification" feature="run-kpi-checks" extends="../../test.spec">

  <fixtures_used>
    tests/fixtures/governance/valid/      (kpis.yaml with echo commands)
    tests/fixtures/governance/kpi-failing/ (kpis.yaml with ["false"] command)
    Inline KPI definitions constructed in each test (no fixture file needed for
    timeout and command-not-found tests).
  </fixtures_used>

  <test_cases>
    <test_case id="TC-KPI-01" level="integration" covers="UC-KPI-01 AC-KPI-01">
      <given>
        kpis.yaml contains kpi-1 with command: ["echo", "ok"] and timeout_ms: 5000.
      </given>
      <input>{ "id": "kpi-1" }</input>
      <when>chest.kpis.run handler is called.</when>
      <expected_output>
        {
          "ok": true,
          "data": {
            "kpiId": "kpi-1",
            "exitCode": 0,
            "stdout": "ok\n",
            "stderr": "",
            "timedOut": false,
            "durationMs": "&lt;number between 0 and 5000&gt;"
          }
        }
      </expected_output>
      <expected_errors>None.</expected_errors>
    </test_case>

    <test_case id="TC-KPI-02" level="integration" covers="UC-KPI-03 AC-KPI-02">
      <given>
        kpis.yaml from kpi-failing fixture contains kpi-failing with command: ["false"]
        and timeout_ms: 5000.
      </given>
      <input>{ "id": "kpi-failing" }</input>
      <when>chest.kpis.run handler is called.</when>
      <expected_output>
        {
          "ok": true,
          "data": {
            "kpiId": "kpi-failing",
            "exitCode": 1,
            "stdout": "",
            "stderr": "",
            "timedOut": false,
            "durationMs": "&lt;number between 0 and 5000&gt;"
          }
        }
      </expected_output>
      <expected_errors>None. A nonzero exit is not an error; it is evidence.</expected_errors>
    </test_case>

    <test_case id="TC-KPI-03" level="integration" covers="UC-KPI-04 AC-KPI-03">
      <given>
        KPI definition constructed inline:
        { id: "kpi-slow", command: ["sleep", "10"], timeout_ms: 100 }.
      </given>
      <input>{ "id": "kpi-slow" }</input>
      <when>chest.kpis.run handler is called with a KPI whose command exceeds timeout.</when>
      <expected_output>
        {
          "ok": true,
          "data": {
            "kpiId": "kpi-slow",
            "exitCode": -1,
            "stdout": "",
            "stderr": "",
            "timedOut": true,
            "durationMs": "&lt;number around 100&gt;"
          }
        }
      </expected_output>
      <expected_errors>None. Timeout is captured as evidence.</expected_errors>
    </test_case>

    <test_case id="TC-KPI-04" level="integration" covers="ES-KPI-01 AC-KPI-04">
      <given>
        KPI definition constructed inline:
        { id: "kpi-missing-cmd", command: ["__no_such_command_chest__"], timeout_ms: 5000 }.
      </given>
      <input>{ "id": "kpi-missing-cmd" }</input>
      <when>chest.kpis.run handler is called with a command not on PATH.</when>
      <expected_output>None.</expected_output>
      <expected_errors>
        {
          "ok": false,
          "error": {
            "code": "ERR-CHEST-06",
            "message": "KPI command not found: __no_such_command_chest__"
          }
        }
      </expected_errors>
    </test_case>

    <test_case id="TC-KPI-05" level="integration" covers="UC-KPI-02 AC-KPI-05">
      <given>
        kpis.yaml from kpi-failing fixture contains two KPIs:
        kpi-1 with ["echo", "ok"] (exits 0) and
        kpi-failing with ["false"] (exits 1).
      </given>
      <input>{}</input>
      <when>chest.kpis.run-all handler is called.</when>
      <expected_output>
        {
          "ok": true,
          "data": {
            "results": [
              { "kpiId": "kpi-1", "exitCode": 0, "stdout": "ok\n", "stderr": "", "timedOut": false, "durationMs": "&lt;number&gt;" },
              { "kpiId": "kpi-failing", "exitCode": 1, "stdout": "", "stderr": "", "timedOut": false, "durationMs": "&lt;number&gt;" }
            ]
          }
        }
      </expected_output>
      <expected_errors>None. Both KPIs are run regardless of exit codes.</expected_errors>
    </test_case>

    <test_case id="TC-KPI-06" level="unit" covers="ES-KPI-02">
      <given>
        kpis.yaml contains only kpi-1. No kpi-99 exists.
      </given>
      <input>{ "id": "kpi-99" }</input>
      <when>chest.kpis.run handler is called.</when>
      <expected_output>None.</expected_output>
      <expected_errors>
        { "ok": false, "error": { "code": "ERR-CHEST-02", "message": "KPI with id 'kpi-99' not found." } }
      </expected_errors>
    </test_case>
  </test_cases>

  <coverage_matrix>
    <row uc="UC-KPI-01" tests="TC-KPI-01"/>
    <row uc="UC-KPI-02" tests="TC-KPI-05"/>
    <row uc="UC-KPI-03" tests="TC-KPI-02"/>
    <row uc="UC-KPI-04" tests="TC-KPI-03"/>
  </coverage_matrix>

</spec>
