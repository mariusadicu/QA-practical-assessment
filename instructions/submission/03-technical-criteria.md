# Technical Criteria for Test Creation — RWA-142 · Send Money to a Contact

**Author:** Marius Dicu  
**Story:** RWA-142 · Send money to a contact  
**Tool choice:** Playwright + TypeScript (see §5)

---

## 1. Selectors / Test IDs

The app uses a `data-test="..."` convention throughout. The table below documents confirmed selectors from running the app and inspecting elements, plus proposed additions for elements that are missing one. Note: several attributes differ from the canonical Cypress RWA — the fork renamed them.

### Confirmed / expected existing selectors

| Element | Selector | Notes |
|---|---|---|
| Username input (sign-in) | `[data-test="signin-username"]` | Confirmed in README |
| Password input (sign-in) | `[data-test="signin-password"]` | Standard convention |
| Sign-in submit button | `[data-test="signin-submit"]` | Standard convention |
| New transaction button | `[data-test="nav-top-new-transaction"]` | Nav bar — note: this fork renamed from the standard `new-transaction` |
| User search input | `[data-test="user-list-search-input"]` | Contact search step |
| User search result item | `[data-test^="user-list-item-"]` | Prefix match — dynamic suffix is the userId |
| Amount input | `[data-test="transaction-create-amount-input"]` | MUI wrapper — target inner `<input>` with `.locator('input')` |
| Note / description input | `[data-test="transaction-create-description-input"]` | MUI wrapper — same pattern |
| Pay button | `[data-test="transaction-create-submit-payment"]` | Submit payment |
| Request button | `[data-test="transaction-create-submit-request"]` | Out of scope (RWA-143) |
| Mine tab (personal feed) | `[data-test="nav-personal-tab"]` | Feed navigation |
| Everyone tab (public feed) | `[data-test="nav-public-tab"]` | Feed navigation |
| Friends tab | `[data-test="nav-contacts-tab"]` | Feed navigation |
| Transaction list item | `[data-test^="transaction-item-"]` | Prefix match — dynamic suffix is the transaction ID |
| Payment confirmation | `[data-test="new-transaction-return-to-transactions"]` | Confirms payment completed — URL doesn't change after Pay |

### Proposed missing selectors (ask Engineering to add)

| Element | Proposed selector | Reason |
|---|---|---|
| Confirmation screen header / success message | `data-test="transaction-create-success-header"` | Needed to assert payment confirmation without relying on brittle text |
| Confirmed amount on confirmation screen | `data-test="transaction-detail-amount"` | Assert correct amount was submitted |
| Pay button disabled state (for validation tests) | Already covered by `aria-disabled` or `disabled` attribute on existing selector | Check `.isDisabled()` in Playwright |
| Notification badge / count | `data-test="nav-top-notifications-count"` | Assert receiver notification without fragile CSS selectors |
| Individual notification item | `data-test="notification-list-item-{notificationId}"` | For AC2 receiver test |
| Transaction amount in feed | `data-test="transaction-amount"` | Assert amount in Mine feed row |
| Transaction description in feed | `data-test="transaction-description"` | Assert note in Mine feed row |

**Request to Engineering:** Please add the 5 proposed `data-test` attributes before the automation tests are written. This avoids fragile selectors based on text content or CSS class names that break when copy or styling changes.

---

## 2. API Endpoints & Contracts

### Authentication

```
POST /login
Body: { "username": "Heath93", "password": "s3cret" }
Response 200: { "user": { "id": "...", ... }, "token": "..." }
Response 401: { "error": "Username or password is invalid" }
```

**Assert at API layer:** 
- `token` is present and non-empty on success
- 401 returned on invalid credentials (TC for RWA-118 sign-in story)

### Create Transaction

```
POST /transactions
Headers: Authorization: Bearer {token}
Body: {
  "amount": 2500,           // in cents — verify this assumption with Engineering
  "description": "Lunch yesterday",
  "receiverId": "{userId}",
  "senderId": "{userId}",
  "transactionType": "payment"
}
Response 200: {
  "transaction": {
    "id": "...",
    "amount": 2500,
    "description": "Lunch yesterday",
    "senderId": "...",
    "receiverId": "...",
    "status": "complete",
    "createdAt": "..."
  }
}
```

**Assert at API layer:**
- Response contains `id`, `amount`, `status`, `senderId`, `receiverId`
- `amount` matches submitted value (no silent rounding)
- `status` is `"complete"` (not pending)
- Schema matches on every field (JSON schema validation)

**What NOT to assert at UI layer:**
- Balance arithmetic — verify via `GET /users/{id}` API response, not by reading a DOM element
- Transaction persistence — confirm via `GET /transactions/{id}` not just by checking the feed rendered state

### Get Transactions (Feed)

```
GET /transactions
Headers: Authorization: Bearer {token}
Response: { "results": [ { "id": "...", ... } ], "pageData": { ... } }
```

**Assert:** New transaction ID appears in `results[0]` within a reasonable timeout.

### Get Notifications

```
GET /notifications
Headers: Authorization: Bearer {token}
Response: { "results": [ { "id": "...", "isRead": false, ... } ] }
```

**Assert (AC2):** After payment, receiver's notification list contains one unread notification referencing the transaction.

---

## 3. Test Data Strategy

### Approach: API-seeded, UI-verified

- **Before suite:** Run `yarn db:seed:dev` to reset to a deterministic known state with pre-created users and linked bank accounts.
- **Before each test:** Use Playwright's `request` fixture to authenticate via `POST /login` and store the token. Use the token to call any setup APIs (e.g., verify user balance before test).
- **After each test:** Do not rely on teardown to clean up — instead assign unique users to each scenario or re-seed between groups.

### User assignments (from seeded data)

| Test group | Sender | Receiver | Third user |
|---|---|---|---|
| Happy path | `Heath93` | `Dina20` | — |
| Receiver/notification | `Heath93` | `Dina20` | — |
| Privacy / feed | `Heath93` | `Dina20` | `Arvilla_Hegmann` |
| Validation tests | `Heath93` | `Dina20` | — |

### Avoiding cross-test contamination

- Validation tests (negative paths) never reach POST /transactions, so they don't dirty the feed.
- Happy path tests that create transactions should run before feed/notification assertions, or the test should look for a transaction with a specific, unique note (e.g., include a timestamp in the note).
- Use `test.describe` with `beforeAll` reset rather than `beforeEach` for expensive operations.

---

## 4. Reliability & Flake Observations

| Risk | Mitigation |
|---|---|
| Feed update is async — asserting "top of Mine feed" immediately after redirect may be premature | Use `await expect(page.getByTestId('transaction-item').first()).toContainText('Lunch yesterday')` with Playwright's built-in auto-retry rather than a fixed sleep |
| Notification delivery timing is undefined — polling may be needed | Use `expect.poll()` with a timeout (e.g., 10s) instead of `waitForTimeout` |
| Amount input may trigger debounced validation — Pay button may be momentarily in a transitional state | Wait for button to be `enabled` before clicking: `await expect(payBtn).toBeEnabled()` |
| Contact search results load asynchronously | Wait for search result items to appear: `await page.locator('[data-test^="user-list-item-"]').first().waitFor()` |
| Authentication state shared between tests if using a single browser context | Use separate `browserContext` or `storageState` per test file, not per test, to balance isolation and speed |
| Double-submit test may be timing-sensitive | Assert transaction count via API (`GET /transactions`) rather than counting DOM elements |
| Screenshots must be stable | Capture screenshots after `waitFor()` conditions are met, not immediately on navigation |

---

## 5. Tooling Choice

**Primary tool: Playwright + TypeScript**

**Reasons:**
- Matches the project's existing TypeScript stack and the team's recent adoption of modern tooling.
- Native async/await with built-in auto-retry makes assertions more reliable than Selenium's explicit waits.
- `request` fixture allows API calls within the same test for setup and teardown without a separate HTTP library.
- Screenshot and video capture is built in — satisfies the assessment's evidence requirement out of the box.
- `page.getByTestId()` natively maps to `data-test` attributes, keeping selectors clean.
- Single binary install, no separate driver management.

**Structure:**

```
e2e/
  tests/
    send-money.spec.ts     # RWA-142 happy path + edge cases
    auth.spec.ts           # RWA-118 sign-in tests
  pages/
    LoginPage.ts           # Page Object: sign-in actions
    HomePage.ts            # Page Object: home/feed actions
    NewTransactionPage.ts  # Page Object: new transaction flow
  fixtures/
    auth.fixture.ts        # Pre-authenticated browser context
  screenshots/             # Auto-saved per test step
  README.md
playwright.config.ts
```

**API layer:** Use Playwright's `APIRequestContext` (built-in) for setup calls. No additional HTTP client needed.
