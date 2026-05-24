<spec name="Run KPI Checks Functional Specification" feature="run-kpi-checks" extends="../../functional.spec">

  <summary>
    The run-kpi-checks slice executes configured KPI command checks and captures
    their output as structured evidence. Commands are spawned in argv form,
    never through a shell. Exit code, stdout, stderr, and duration are captured
    for every run, including commands that exit nonzero or time out. A failed
    command is evidence for downstream validation, not an unhandled system error.
  </summary>

  <use_cases>
    <use_case id="UC-KPI-01" actor="implementing-agent" surface="both">
      <goal>Run a single KPI command check and receive the captured evidence.</goal>
      <preconditions>kpis.yaml contains a KPI with the requested ID. Command is executable.</preconditions>
      <inputs>{ "id": "kpi-1" }</inputs>
      <steps>
        1. Load and normalize KPI definition for the given ID.
        2. Spawn the command in argv form with the configured timeout_ms.
        3. Capture exit code, stdout, stderr, and wall-clock duration.
        4. Apply evidence_normalizer if configured.
        5. Return KPIEvidence.
      </steps>
      <outputs>
        {
          "kpiId": "kpi-1",
          "exitCode": 0,
          "stdout": "All tests passed. 42 pass, 0 fail.",
          "stderr": "",
          "timedOut": false,
          "durationMs": 312
        }
      </outputs>
      <postconditions>KPIEvidence is returned. No governance files are modified.</postconditions>
    </use_case>

    <use_case id="UC-KPI-02" actor="implementing-agent" surface="both">
      <goal>Run all configured KPI checks in a single call.</goal>
      <preconditions>kpis.yaml is present and contains at least one KPI.</preconditions>
      <inputs>{}</inputs>
      <steps>
        1. Load and normalize all KPI definitions.
        2. For each KPI, spawn the command and capture evidence.
        3. Return an array of KPIEvidence, one per KPI.
      </steps>
      <outputs>
        [
          { "kpiId": "kpi-1", "exitCode": 0, "stdout": "...", "stderr": "", "timedOut": false, "durationMs": 312 },
          { "kpiId": "kpi-2", "exitCode": 1, "stdout": "", "stderr": "error: ...", "timedOut": false, "durationMs": 88 }
        ]
      </outputs>
      <postconditions>KPIEvidence array returned. A nonzero exit in one KPI does not abort the others.</postconditions>
    </use_case>

    <use_case id="UC-KPI-03" actor="ci-runner" surface="cli">
      <goal>Run a KPI command that exits nonzero and treat its output as evidence.</goal>
      <preconditions>kpis.yaml contains a KPI whose command reliably exits with code 1.</preconditions>
      <inputs>{ "id": "kpi-failing" }</inputs>
      <steps>
        1. Load KPI definition.
        2. Spawn the command.
        3. Command exits with code 1.
        4. Capture exit code, stdout, stderr.
        5. Return KPIEvidence with exitCode 1.
      </steps>
      <outputs>
        {
          "kpiId": "kpi-failing",
          "exitCode": 1,
          "stdout": "",
          "stderr": "test failure: 3 failing",
          "timedOut": false,
          "durationMs": 45
        }
      </outputs>
      <postconditions>A ToolResult envelope is returned with exitCode 1 evidence.</postconditions>
    </use_case>

    <use_case id="UC-KPI-04" actor="implementing-agent" surface="both">
      <goal>Run a KPI command that exceeds timeout_ms.</goal>
      <preconditions>KPI command is configured with a timeout that the command will exceed.</preconditions>
      <inputs>{ "id": "kpi-slow" }</inputs>
      <steps>
        1. Load KPI definition (timeout_ms: 100).
        2. Spawn the command.
        3. Command does not complete within 100ms.
        4. Kill the process.
        5. Return KPIEvidence with timedOut: true.
      </steps>
      <outputs>
        {
          "kpiId": "kpi-slow",
          "exitCode": -1,
          "stdout": "",
          "stderr": "",
          "timedOut": true,
          "durationMs": 100
        }
      </outputs>
      <postconditions>Process is terminated. Evidence captures the timeout.</postconditions>
    </use_case>
  </use_cases>

  <error_scenarios>
    <scenario id="ES-KPI-01" ref="ERR-CHEST-06">
      <trigger>KPI command executable is not found on PATH.</trigger>
      <observable>
        ERR-CHEST-06 with the command name and the OS error "command not found."
        The KPIEvidence is not returned; this is a system configuration error,
        not a measurement result.
      </observable>
    </scenario>
    <scenario id="ES-KPI-02" ref="ERR-CHEST-03">
      <trigger>chest.kpis.run called with an ID that does not exist in kpis.yaml.</trigger>
      <observable>
        ERR-CHEST-02 with message "KPI with id 'X' not found."
      </observable>
    </scenario>
  </error_scenarios>

  <acceptance_criteria>
    <ac id="AC-KPI-01" rolls_up_to="AC-FUN-06">
      chest.kpis.run returns KPIEvidence with exitCode, stdout, stderr, timedOut,
      and durationMs for a command that exits zero.
    </ac>
    <ac id="AC-KPI-02" rolls_up_to="AC-FUN-06">
      chest.kpis.run returns KPIEvidence with exitCode nonzero and the captured
      stderr for a command that exits nonzero. The tool still returns a ToolResult envelope.
    </ac>
    <ac id="AC-KPI-03" rolls_up_to="AC-FUN-06">
      chest.kpis.run returns KPIEvidence with timedOut: true when the command
      exceeds timeout_ms.
    </ac>
    <ac id="AC-KPI-04" rolls_up_to="AC-FUN-11">
      chest.kpis.run returns ERR-CHEST-06 when the command executable is not
      found. The error identifies the command name.
    </ac>
    <ac id="AC-KPI-05" rolls_up_to="AC-FUN-13">
      chest.kpis.run-all runs every configured KPI independently and returns
      a KPIEvidence array. A nonzero exit in one KPI does not prevent the
      others from running.
    </ac>
  </acceptance_criteria>

  <out_of_scope>
    Shell piping, globbing, or variable substitution in command definitions.
    Parallel KPI execution (v1 runs sequentially).
    Storing KPI evidence as validation reports (that is the validate-done slice).
  </out_of_scope>

</spec>
