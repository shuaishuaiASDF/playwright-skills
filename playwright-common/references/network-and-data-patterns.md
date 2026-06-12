# Network And Data Patterns

Use this reference when a Playwright task needs reliable response matching, real-data strategy, mock strategy, test-data lifecycle control, or external-state verification.

## Response Capture

Register network listeners before triggering the UI action. This avoids losing fast responses.

When a page fires automatic initialization requests, do not match only by URL or final response shape. Also filter by request context, such as:

- request body values
- query parameters
- method
- correlation id
- user-selected filter value
- scenario-specific unique key

If the app reuses cached data and no new response is guaranteed, state that behavior explicitly and use another stable evidence source.

## Real And Mock Split

Prefer real data for:

- login, permission, and environment access checks
- primary happy path and persistence claims
- cross-page or cross-service data flow
- database or downstream state verification

Prefer mock or route-controlled data for:

- no-data states
- UI-only branch rendering
- exceptional API outcomes
- timeout, retry, and cancellation behavior
- rare state combinations that are hard to create safely in a shared environment

It is acceptable for one spec and one report to combine real smoke cases and mock-controlled branches when they validate the same page or workflow. Keep the report labels explicit so readers know which evidence source each scenario used.

## Business Misses

A valid query that returns zero rows is a business result, not automatically a script crash. Decide the status by the scenario claim:

- If the scenario expects a hit, log `FAIL` with query criteria and total count.
- If the scenario validates empty-state behavior, log `PASS` when the empty-state UI and response total agree.
- If the environment lacks required sample data, log `SKIP` or keep coverage as partial.

Do not hide legitimate misses behind generic exceptions.

## Test Data Lifecycle

Before writing a real-data flow, identify:

- data source: generated, pre-seeded, fixture file, API-created, or manually prepared
- uniqueness rule
- cleanup or restoration rule
- whether data is shared across tests or scoped to one test
- how worker retry or serial execution affects state

Do not replace pre-seeded or user-controlled test data with generated values unless the user or project rule explicitly allows it.

## External State Assertions

For persistence, deletion, enable/disable, export, import, or downstream sync claims, prefer a layered assertion:

- UI shows the expected state.
- API confirms the state or request intent.
- External data source confirms persistence when available and required.

If an external data source is eventually consistent, use minimal bounded polling and document why polling is needed, which single step it covers, and the timeout/frequency.
