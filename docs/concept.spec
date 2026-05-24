<spec name="Chest Concept Specification" status="initial">
	<context>
		<problem>
			When humans are in the loop for AI agent workflows, each checkpoint
			creates an intervention penalty.

			Reference:
			Ramirez, J., & Plajutin, S. (2026). The Intervention Penalty: A
			Simulation Study of Human Checkpoint Costs in AI Coding Governance.
			Zenodo. https://doi.org/10.5281/zenodo.19457265

			The cost of human checkpoints can grow faster than the value of the
			individual checkpoint. If an agent must stop for human approval too
			often, the governance system becomes a throughput bottleneck.
		</problem>

		<solution>
			Chest replaces repeated human checkpoints with structured agent
			self-regulation.

			Agents work against pre-defined, machine-verifiable criteria:

			1. OKRs define what success looks like.
			2. KPIs measure progress and quality.
			3. Definition of Ready validates plan completeness before work starts.
			4. Definition of Done validates completion before work is reported as done.

			Chest stores those criteria in a repository-local governance store and
			exposes validation workflows through ohtools MCP and CLI interfaces.
		</solution>
	</context>

	<goals>
		1. Provide a local source of truth for AI-agent governance criteria.
		2. Make governance criteria inspectable, versionable, and diffable.
		3. Let agents validate plans and completed work without defaulting to human approval.
		4. Keep validation results structured enough for automation and review.
		5. Keep the implementation easy for new agents to navigate and extend.
	</goals>

	<non_goals>
		1. Chest v1 is not a hosted service.
		2. Chest v1 does not require a central database.
		3. Chest v1 does not prescribe a specific LLM provider.
		4. Chest v1 does not replace human review for ambiguous, unsafe, or policy-sensitive decisions.
	</non_goals>

	<principles>
		1. All quality gates should be machine-verifiable when possible.
		2. Governance overhead must stay lower than intervention overhead.
		3. Goal validation is continuous, not periodic.
		4. Governance state must be readable by humans and agents.
		5. Public tool contracts must be explicit and schema-validated.
		6. Domain behavior must not depend on MCP, CLI, filesystem, shell, or LLM-provider details.
	</principles>

	<technical_decisions>
		<storage>
			Chest v1 stores governance state in local YAML files.

			Rationale:

			1. YAML is readable by humans and agents.
			2. Local files can be committed with the project.
			3. Diffs expose governance changes during code review.
			4. Agents can inspect governance state without requiring an external service.

			The storage layer must parse, validate, and normalize YAML before domain
			use. Invalid YAML or invalid governance shape must produce actionable
			diagnostics instead of generic parse failures.
		</storage>

		<interfaces>
			Chest v1 uses @bosun-sh/ohtools as the public tool framework.

			The same domain behavior must be exposed through:

			1. MCP tools for agent workflows.
			2. CLI commands for humans, scripts, and CI automation.

			ohtools definitions are adapter-facing entry points. They must not contain
			core governance logic. Tool handlers should validate input, call
			application services, and return structured output.
		</interfaces>

		<judge>
			Chest v1 uses provider-agnostic LLM-as-judge validation.

			The concept spec requires the judge boundary to define structured inputs
			and outputs, but it must not bind the product to one model vendor.

			Judge inputs must include:

			1. The governance criteria being evaluated.
			2. The plan, task, or completion evidence under review.
			3. KPI command-check evidence when relevant.
			4. The validation mode, such as readiness or done validation.

			Judge outputs must include:

			1. Status.
			2. Rationale.
			3. Evidence references.
			4. Confidence.
			5. Follow-up actions when validation does not pass.
		</judge>

		<kpis>
			Chest v1 evaluates KPI values through command checks.

			A KPI command check is a configured command that returns measurable
			evidence. The command result must be captured as validation evidence,
			including exit status, stdout, stderr, and normalized measurement data
			when available.

			A failed command is evidence for validation. It must not be hidden as an
			unhandled process failure unless Chest itself failed to run the command.
		</kpis>
	</technical_decisions>

	<core_entities>
		<okr>
			An OKR defines an objective and the key results that indicate progress
			toward that objective.

			Required semantics:

			1. Objectives describe the intended outcome.
			2. Key results describe observable success criteria.
			3. OKRs are used by the judge to evaluate alignment and completion.
		</okr>

		<kpi>
			A KPI defines a measurable project signal and the command check used to
			collect evidence for that signal.

			Required semantics:

			1. A KPI has a name and purpose.
			2. A KPI has an expected target or threshold.
			3. A KPI has a command check for v1 evidence collection.
			4. KPI command output becomes part of validation evidence.
		</kpi>

		<definition_of_ready>
			Definition of Ready defines the minimum criteria that must be true before
			implementation begins.

			Required semantics:

			1. It validates plan completeness.
			2. It detects missing scope, acceptance criteria, constraints, or risks.
			3. It should be evaluated before an agent starts implementation.
		</definition_of_ready>

		<definition_of_done>
			Definition of Done defines the minimum criteria that must be true before
			work is reported as complete.

			Required semantics:

			1. It validates completed work.
			2. It considers implementation evidence, tests, KPI checks, and stated acceptance criteria.
			3. It should be evaluated before an agent marks work done.
		</definition_of_done>

		<validation_report>
			A validation report is the structured result returned by Chest after a
			readiness, done, KPI, or governance validation workflow.

			Required semantics:

			1. It has a status.
			2. It explains the rationale.
			3. It references the evidence used.
			4. It includes judge confidence when an LLM judge is used.
			5. It lists follow-up actions when criteria are not satisfied.
		</validation_report>
	</core_entities>

	<architecture>
		<overview>
			Chest should use screaming architecture, vertical slicing,
			interface-first design, and test-driven implementation.

			The codebase should be optimized for agents that need to understand the
			system quickly. Directory and file names should use business language
			instead of generic technical labels when possible.
		</overview>

		<layers>
			<domain>
				The domain layer owns governance concepts and validation semantics.

				It includes:

				1. OKR, KPI, Definition of Ready, Definition of Done, and Validation Report types.
				2. Validation rules that do not require external effects.
				3. Interfaces for storage, KPI execution, and judge execution.

				The domain layer must not import ohtools, MCP adapters, filesystem APIs,
				process execution APIs, or LLM SDKs.
			</domain>

			<storage>
				The storage layer owns local YAML persistence.

				It includes:

				1. Governance file path resolution.
				2. YAML parsing.
				3. Schema validation.
				4. Normalization into domain types.
				5. Save/update behavior for governance records.

				Storage errors must preserve enough context for agents to fix the file.
			</storage>

			<kpi_checks>
				The KPI checks layer owns command execution.

				It includes:

				1. Safe command invocation boundaries.
				2. Capture of exit code, stdout, and stderr.
				3. Conversion of command results into KPI evidence.
				4. Timeout and failure reporting policies.

				Command output must be treated as evidence and passed into validation
				reports.
			</kpi_checks>

			<judge>
				The judge layer owns provider-agnostic LLM-as-judge orchestration.

				It includes:

				1. Judge request and response contracts.
				2. Prompt/rubric assembly from governance criteria and evidence.
				3. Provider interface definitions.
				4. Response validation and normalization.

				The judge layer must allow provider implementations to be swapped
				without changing domain behavior.
			</judge>

			<tools>
				The tools layer owns ohtools definitions.

				It includes:

				1. MCP-facing tool descriptions and JSON schemas.
				2. CLI-facing command exposure through the same ohtools registry.
				3. Structured input and output contracts.
				4. Thin handlers that delegate to application services.
			</tools>

			<app>
				The app layer is the composition root.

				It wires:

				1. Domain services.
				2. YAML storage.
				3. KPI command execution.
				4. Judge provider implementations.
				5. ohtools MCP and CLI adapters.
			</app>
		</layers>
	</architecture>

	<feature_areas_for_atomic_specs>
		<initialize_storage>
			Define how a project creates initial Chest YAML governance files.
		</initialize_storage>

		<read_governance_state>
			Define how agents and humans inspect OKRs, KPIs, Definition of Ready, and
			Definition of Done through structured tool output.
		</read_governance_state>

		<write_governance_state>
			Define how governance records are created or updated while preserving
			valid YAML structure and actionable diagnostics.
		</write_governance_state>

		<validate_ready>
			Define how a plan is evaluated against Definition of Ready before
			implementation starts.
		</validate_ready>

		<validate_done>
			Define how completed work is evaluated against Definition of Done before
			it is reported complete.
		</validate_done>

		<run_kpi_checks>
			Define how configured KPI command checks run and how their results become
			validation evidence.
		</run_kpi_checks>

		<judge_governance_alignment>
			Define how the provider-agnostic judge evaluates plans and completed work
			against OKRs, KPIs, Definition of Ready, and Definition of Done.
		</judge_governance_alignment>

		<validation_reports>
			Define the structured report format returned by all validation workflows.
		</validation_reports>

		<ohtools_exposure>
			Define the MCP and CLI tools exposed through @bosun-sh/ohtools.
		</ohtools_exposure>
	</feature_areas_for_atomic_specs>

	<public_contract_expectations>
		1. Every public ohtools input must have an explicit object-rooted schema.
		2. Every public ohtools output must be structured and documented.
		3. Tool names and descriptions must be agent-readable and action-oriented.
		4. Validation failures must be returned as structured results when Chest can continue.
		5. Internal errors must include enough context to distinguish implementation failure from governance failure.
		6. File paths returned to users must identify the governance file that needs attention.
	</public_contract_expectations>

	<acceptance_criteria>
		1. Chest can initialize local YAML governance storage.
		2. Chest can read and validate YAML governance files.
		3. Chest can expose governance state through ohtools MCP and CLI interfaces.
		4. Chest can run command-based KPI checks and capture their output as evidence.
		5. Chest can build provider-agnostic judge requests from governance criteria and evidence.
		6. Chest can normalize judge responses into validation reports.
		7. Chest can validate a plan against Definition of Ready.
		8. Chest can validate completed work against Definition of Done.
		9. Chest can report actionable diagnostics for invalid YAML, invalid governance shape, failed KPI commands, and failed judge responses.
	</acceptance_criteria>

	<testing_strategy>
		1. Domain tests cover governance entity behavior and validation semantics without external effects.
		2. Storage tests cover valid YAML, invalid YAML, invalid schema shape, missing files, and path diagnostics.
		3. KPI check tests cover successful commands, non-zero exit commands, malformed output, and execution failure.
		4. Judge tests cover request construction, provider response normalization, confidence handling, and invalid judge responses.
		5. ohtools contract tests cover tool input schemas, output shapes, and handler delegation.
		6. End-to-end tests cover initialized storage, KPI evidence collection, judge validation, and validation report output.
	</testing_strategy>
</spec>
