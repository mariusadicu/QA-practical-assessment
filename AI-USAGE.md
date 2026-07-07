# AI Usage

I used Claude (Anthropic) as a drafting and scaffolding tool throughout this assessment, and GitHub Copilot for inline completion during test writing.

For the written deliverables (story feedback, manual test script, technical criteria), AI helped me structure and format content quickly. The observations, risk judgments, edge cases, and recommendations are my own — things like flagging the undefined "per privacy rules" in AC6, identifying the `allowNegative` gap in AC3, and deciding which test cases should intentionally fail to document bugs rather than be "fixed."

For the Playwright tests, AI generated the initial scaffold. Most of my time went into debugging what it got wrong against the actual fork:

- The fork uses `data-test` attributes, not `data-testid` — required adding `testIdAttribute: 'data-test'` to `playwright.config.ts` and `.locator('input')` to reach inputs inside MUI wrappers
- The nav button is `data-test="nav-top-new-transaction"`, not the standard `"new-transaction"`
- User list items are `"user-list-item-{id}"` (singular), not `"users-list-item-{id}"` (plural)
- Transaction items are `"transaction-item-{id}"` — requires a prefix match, not exact `getByTestId`
- After payment, the app doesn't navigate — `waitForURL` always times out; had to wait for the confirmation element instead
- Nav tabs only exist on feed pages, not on `/transaction/new` — clicking Mine required returning to the feed first

The bug findings (note required despite AC5, $0 and negative amounts accepted despite AC3) came from manual exploration of the running app and from watching which tests failed and why.
