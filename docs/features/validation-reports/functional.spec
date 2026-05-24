<spec name="Validation Reports Functional Specification" feature="validation-reports" extends="../../functional.spec">

  <summary>
    The validation-reports slice defines the structured ValidationReport format
    and exposes tools for listing and retrieving persisted reports from
    .chest/reports/. A report is written after every validate-ready,
    validate-done, and judge-align workflow. The list tool supports filtering
    by workflow type and ISO-8601 date prefix. The get tool retrieves a single
    full report by id.
  </summary>

  <use_cases>
    <use_case id="UC-REP-01" actor="reviewer-human" surface="both">
      <goal>List all validation reports to inspect recent governance activity.</goal>
      <preconditions>.chest/reports/ exists and contains at least one report file.</preconditions>
      <inputs>{}</inputs>
      <steps>
        1. Enumerate files in .chest/reports/.
        2. Parse each report file and extract summary fields (id, workflow, timestamp, status).
        3. Return the list sorted by timestamp descending.
      </steps>
      <outputs>
        {
          "items": [
            { "id": "rep-2026-05-23T10-00-00Z-ready", "workflow": "ready", "timestamp": "2026-05-23T10:00:00Z", "status": "passed" },
            { "id": "rep-2026-05-22T09-00-00Z-done",  "workflow": "done",  "timestamp": "2026-05-22T09:00:00Z", "status": "failed" }
          ]
        }
      </outputs>
      <postconditions>No files written.</postconditions>
    </use_case>

    <use_case id="UC-REP-02" actor="implementing-agent" surface="both">
      <goal>List reports for a specific workflow to find the most recent readiness result.</goal>
      <preconditions>.chest/reports/ contains reports from multiple workflows.</preconditions>
      <inputs>{ "workflow": "ready" }</inputs>
      <steps>
        1. Enumerate .chest/reports/.
        2. Filter files whose name contains "-ready.json".
        3. Parse and return summaries sorted by timestamp descending.
      </steps>
      <outputs>
        { "items": [ { "id": "...", "workflow": "ready", "timestamp": "...", "status": "passed" } ] }
      </outputs>
      <postconditions>No files written.</postconditions>
    </use_case>

    <use_case id="UC-REP-03" actor="reviewer-human" surface="both">
      <goal>Retrieve the full content of a specific validation report by id.</goal>
      <preconditions>A report with the requested id exists under .chest/reports/.</preconditions>
      <inputs>{ "id": "rep-2026-05-23T10-00-00Z-ready" }</inputs>
      <steps>
        1. Resolve the report file path from the id.
        2. Read and parse the JSON file.
        3. Validate against report.v1 schema.
        4. Return the full ValidationReport.
      </steps>
      <outputs>
        {
          "id": "rep-2026-05-23T10-00-00Z-ready",
          "workflow": "ready",
          "timestamp": "2026-05-23T10:00:00Z",
          "status": "passed",
          "rationale": "...",
          "evidenceRefs": [...],
          "confidence": 0.91,
          "followUps": []
        }
      </outputs>
      <postconditions>No files written.</postconditions>
    </use_case>
  </use_cases>

  <error_scenarios>
    <scenario id="ES-REP-01" ref="ERR-CHEST-09">
      <trigger>chest.reports.get called with an id that does not match any report file.</trigger>
      <observable>
        ERR-CHEST-09 with the requested id and the reports directory path.
      </observable>
    </scenario>
    <scenario id="ES-REP-02" ref="ERR-CHEST-03">
      <trigger>.chest/reports/ directory does not exist.</trigger>
      <observable>
        ERR-CHEST-03 with the reports directory path and suggestion to run a
        validation workflow to create the first report.
      </observable>
    </scenario>
  </error_scenarios>

  <acceptance_criteria>
    <ac id="AC-REP-01" rolls_up_to="AC-FUN-14">
      A ValidationReport is written to .chest/reports/ after each successful
      validate-ready, validate-done, and judge-align workflow.
    </ac>
    <ac id="AC-REP-02" rolls_up_to="AC-FUN-14">
      chest.reports.list returns a sorted list of report summaries for all
      persisted reports.
    </ac>
    <ac id="AC-REP-03" rolls_up_to="AC-FUN-14">
      chest.reports.list with workflow filter returns only reports from the
      specified workflow.
    </ac>
    <ac id="AC-REP-04" rolls_up_to="AC-FUN-14">
      chest.reports.get returns the full ValidationReport for a valid id.
    </ac>
    <ac id="AC-REP-05" rolls_up_to="AC-FUN-11">
      chest.reports.get returns ERR-CHEST-09 when the id does not exist.
    </ac>
  </acceptance_criteria>

  <out_of_scope>
    Deleting or archiving reports.
    Diffing two reports.
    Filtering by status or date range in v1 (workflow filter only).
  </out_of_scope>

</spec>
