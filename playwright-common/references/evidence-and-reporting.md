# Evidence And Reporting

Use this reference when a Playwright task needs audit-quality evidence, a reusable reporting pattern, or a decision about whether an observed result is `PASS`, `WARN`, `FAIL`, or `SKIP`.

## Core Evidence Model

Every material verification point should record three things:

- `UI observation`: what the user-facing page actually showed.
- `System observation`: API response, request payload, database query, file output, console event, or another non-UI source.
- `Business conclusion`: the outcome the test claims, written as an auditable conclusion rather than a vague assertion.

Screenshots are supporting evidence. They do not replace text observations.

## Status Semantics

- `PASS`: the business assertion is satisfied and the evidence supports it.
- `WARN`: execution completed, the core assertion is not disproven, but there is an implementation difference, incomplete display, fallback path, or non-blocking risk that should be visible.
- `FAIL`: the business assertion is false, even if the Playwright script can continue and generate a report.
- `SKIP`: the scenario cannot be evaluated because a required precondition is unavailable, such as missing test data, disabled environment capability, or unconfigured external dependency.

Do not convert business `FAIL` into a thrown Playwright error only to make the run fail. Prefer logging the `FAIL` with evidence and continue when the flow can still produce a meaningful report. Throw only when a technical blocker prevents reliable evidence collection.

## External Evidence

When a scenario depends on non-UI evidence, record the raw source in an appendix or equivalent artifact:

- API evidence: request, response, status, and business result.
- DB evidence: executable SQL or query description, parameters or substituted preview, and returned row/result summary.
- File evidence: filename, size, content preview, checksum, or parsed data relevant to the assertion.
- Event evidence: emitted event name, payload summary, or absence of a forbidden event.

If the project reporter does not support one evidence type, either extend the reporter minimally or attach the evidence through the test framework and mention the limitation in the final report.

## Missing Dependencies

When an external dependency is optional, missing configuration should not fail unrelated UI coverage. Log `SKIP` or downgrade the affected assertion only.

When the scenario explicitly claims persistence, integration, or downstream state, missing external evidence is a blocker for `PASS`. Use `SKIP` if the dependency is absent, or `FAIL` if the dependency is available and disproves the claim.

## Report Shape

A robust audit report should contain:

- Execution summary with counts for `PASS`, `WARN`, `FAIL`, and `SKIP`.
- Evidence chain grouped by scenario type or business area.
- Text observations with `UI` and non-UI values separated.
- Visual evidence links when screenshots are captured.
- Appendices for API, DB, file, or event evidence when used.

Keep all related scenario types in one report when they validate the same page or business workflow. Do not split real, boundary, and exception coverage into separate success reports unless the project already has a hard reporter constraint.
