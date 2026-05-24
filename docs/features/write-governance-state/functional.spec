<spec name="Write Governance State Functional Specification" feature="write-governance-state" extends="../../functional.spec">

  <summary>
    The write-governance-state slice lets actors create, update, and remove
    OKR, KPI, DoR, and DoD records in the governance store. All writes validate
    the incoming record against the relevant schema before touching the file,
    use atomic temp-file-plus-rename semantics, and return a diff summary
    describing what changed. Invalid input is rejected before any file is
    modified.
  </summary>

  <use_cases>
    <use_case id="UC-WRITE-01" actor="planning-agent" surface="both">
      <goal>Add a new OKR to the governance store.</goal>
      <preconditions>.chest/okrs.yaml is present (may be empty).</preconditions>
      <inputs>
        {
          "record": {
            "id": "okr-3",
            "objective": "Improve test coverage",
            "keyResults": [
              { "id": "kr-5", "description": "Branch coverage above 90%", "target": "90%" }
            ]
          }
        }
      </inputs>
      <steps>
        1. Validate the record against okrs.v1 schema.
        2. Load the current OKR list.
        3. Confirm no existing record has the same id.
        4. Append the new record.
        5. Write atomically.
        6. Return a diff summary.
      </steps>
      <outputs>{ "op": "inserted", "id": "okr-3" }</outputs>
      <postconditions>okrs.yaml contains the new record. All prior records are unchanged.</postconditions>
    </use_case>

    <use_case id="UC-WRITE-02" actor="planning-agent" surface="both">
      <goal>Update an existing OKR by replacing it with a new version.</goal>
      <preconditions>.chest/okrs.yaml is present and contains the target ID.</preconditions>
      <inputs>
        {
          "record": {
            "id": "okr-1",
            "objective": "Deliver chest v1.1 to production",
            "keyResults": [
              { "id": "kr-1", "description": "All 30 spec files written", "target": "30 files" }
            ]
          }
        }
      </inputs>
      <steps>
        1. Validate the record.
        2. Load the current list.
        3. Find existing record with matching id.
        4. Replace the matching record.
        5. Write atomically.
        6. Return diff summary.
      </steps>
      <outputs>{ "op": "updated", "id": "okr-1" }</outputs>
      <postconditions>okrs.yaml contains the updated record. All other records are unchanged.</postconditions>
    </use_case>

    <use_case id="UC-WRITE-03" actor="implementing-agent" surface="both">
      <goal>Remove an OKR that is no longer relevant.</goal>
      <preconditions>.chest/okrs.yaml is present and contains the target ID.</preconditions>
      <inputs>{ "id": "okr-2" }</inputs>
      <steps>
        1. Load current OKR list.
        2. Find record with matching id.
        3. Remove the record.
        4. Write atomically.
        5. Return diff summary.
      </steps>
      <outputs>{ "op": "removed", "id": "okr-2" }</outputs>
      <postconditions>okrs.yaml no longer contains the removed record.</postconditions>
    </use_case>

    <use_case id="UC-WRITE-04" actor="planning-agent" surface="both">
      <goal>Upsert a DoR criterion.</goal>
      <preconditions>definition-of-ready.yaml is present.</preconditions>
      <inputs>
        {
          "record": {
            "id": "dor-3",
            "text": "Plan specifies target audience",
            "severity": "advisory"
          }
        }
      </inputs>
      <steps>
        1. Validate against dor.v1 schema.
        2. Load current DoR list.
        3. Insert if id is new; replace if id exists.
        4. Write atomically.
        5. Return diff summary.
      </steps>
      <outputs>{ "op": "inserted", "id": "dor-3" }</outputs>
      <postconditions>definition-of-ready.yaml contains the new criterion.</postconditions>
    </use_case>

    <use_case id="UC-WRITE-05" actor="planning-agent" surface="both">
      <goal>Attempt to upsert a record that fails schema validation.</goal>
      <preconditions>.chest/ is initialized.</preconditions>
      <inputs>
        { "record": { "id": "okr-bad" } }
        (missing required "objective" and "keyResults" fields)
      </inputs>
      <steps>
        1. Validate the record against okrs.v1 schema.
        2. Validation fails.
        3. Return ERR-CHEST-04 without reading or writing any file.
      </steps>
      <outputs>{ ok: false, error: { code: "ERR-CHEST-04", message: "Input validation failed: <field path> <constraint>." } }</outputs>
      <postconditions>No file is modified.</postconditions>
    </use_case>
  </use_cases>

  <error_scenarios>
    <scenario id="ES-WRITE-01" ref="ERR-CHEST-04">
      <trigger>Upsert input record does not satisfy the target schema.</trigger>
      <observable>
        ERR-CHEST-04 with each invalid field path and violated constraint.
        No file is modified.
      </observable>
    </scenario>
    <scenario id="ES-WRITE-02" ref="ERR-CHEST-05">
      <trigger>
        The governance file was modified externally between the read and the
        atomic rename.
      </trigger>
      <observable>
        ERR-CHEST-05 indicating a concurrent write conflict. The original file
        is intact.
      </observable>
    </scenario>
    <scenario id="ES-WRITE-03" ref="ERR-CHEST-03">
      <trigger>Target governance file does not exist.</trigger>
      <observable>
        ERR-CHEST-03 with the missing file path and init suggestion.
      </observable>
    </scenario>
    <scenario id="ES-WRITE-04" ref="ERR-CHEST-02">
      <trigger>chest.okrs.remove called with an ID that does not exist.</trigger>
      <observable>
        ERR-CHEST-02 with message "OKR with id 'X' not found; nothing removed."
      </observable>
    </scenario>
  </error_scenarios>

  <acceptance_criteria>
    <ac id="AC-WRITE-01" rolls_up_to="AC-FUN-12">
      chest.okrs.upsert inserts a new record when the ID does not exist and
      returns op: inserted.
    </ac>
    <ac id="AC-WRITE-02" rolls_up_to="AC-FUN-12">
      chest.okrs.upsert updates an existing record when the ID matches and
      returns op: updated.
    </ac>
    <ac id="AC-WRITE-03" rolls_up_to="AC-FUN-12">
      chest.okrs.remove removes the record with the matching ID and returns
      op: removed.
    </ac>
    <ac id="AC-WRITE-04" rolls_up_to="AC-FUN-11">
      Any upsert tool returns ERR-CHEST-04 with field-level detail when the
      input record fails schema validation, without modifying the file.
    </ac>
    <ac id="AC-WRITE-05" rolls_up_to="AC-FUN-12">
      All write operations use atomic temp-file-plus-rename. The target file
      is never left in a partial state.
    </ac>
    <ac id="AC-WRITE-06" rolls_up_to="AC-FUN-12">
      chest.kpis.upsert, chest.dor.upsert, and chest.dod.upsert follow the
      same insert/update/diff-summary contract as chest.okrs.upsert.
    </ac>
  </acceptance_criteria>

  <out_of_scope>
    Bulk import from external formats. Reordering records within a file.
    Cascading removes (e.g., removing a KPI referenced by a DoD criterion).
    Undo/rollback of writes.
  </out_of_scope>

</spec>
