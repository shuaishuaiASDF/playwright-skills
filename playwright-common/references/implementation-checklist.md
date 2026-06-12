# Implementation Checklist

Use this reference before implementing or reviewing a Playwright script that should be maintainable across projects.

## Before Writing Code

- Read the page source, data request entry, existing tests, shared fixtures, wait helpers, and reporter integration.
- Confirm role, route, environment, data preconditions, and whether mock is allowed.
- Identify which scenarios require real evidence and which can be route-controlled.
- Identify what must be updated with the new script, such as README, script index, matrix, CI command, or report docs.
- List unresolved business or interface questions instead of inventing fields or API behavior.

## Capability Extraction

Move repeated logic out of spec files when it crosses one of these thresholds:

- used by multiple tests or likely to be reused by the same page
- involves fragile DOM details
- includes response capture or request filtering
- normalizes evidence values
- records screenshots and audit rows
- maps UI labels to API fields
- handles data setup, cleanup, or restoration

Good capability boundaries expose business actions and structured results, not raw selectors.

## Wait And Interaction Rules

- Prefer explicit waits for URL, response, dialog close, toast/message, loading disappearance, table refresh, or file download.
- Keep single waits short unless the project has a known slow real-data path.
- Avoid fixed sleeps except for narrow race compensation with a comment explaining the race.
- For transient messages, use or create a dedicated helper rather than relying on long generic locator waits.
- Avoid brittle selectors such as `nth-child`, pure index selection, or long class chains unless no stable alternative exists and the reason is documented.

## Validation Ladder

Choose the cheapest validation that proves the current change:

- Syntax/type check for helper-only edits when available.
- Test discovery/listing for new or renamed specs.
- Targeted Playwright run for stable mock or local cases.
- Full real-data run only when environment, credentials, and data are available.

If validation cannot be run, state exactly which gate is missing and what confidence remains from static review.

## Delivery Notes

Final output should identify:

- changed files or artifacts
- scope and behavior impact
- whether DB, API contracts, environment config, credentials, or test data changed
- validation performed and validation not performed
- remaining user confirmation or integration needs
