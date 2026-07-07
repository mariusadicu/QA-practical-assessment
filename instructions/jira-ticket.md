# RWA-142 · Send money to a contact

**Type:** Story  **Epic:** Transactions  **Priority:** High  **Story Points:** 5
**Components:** Web App, Transactions API  **Labels:** payments, p2p-transfer

## Story

**As a** logged-in user with a linked bank account
**I want** to send money to another user with an amount and a note
**So that** I can pay people back and the payment shows up in our transaction history and notifications.

## Description

From the home screen, a user starts a new transaction, searches for a contact, enters a payment amount and an optional note, and confirms with **Pay**. The transaction is created as a _payment_, the sender's and receiver's balances reflect the transfer, the receiver gets a notification, and the transaction appears in the relevant activity feeds (Mine, Friends, and — if public — Everyone). This story covers the **Pay** path only; "Request money" is tracked separately (RWA-143).

## Preconditions

- User is authenticated.
- User has at least one bank account linked (onboarding complete).
- At least one other user exists to receive the payment.

## Acceptance Criteria

### AC1 — Happy path: send a payment

```gherkin
Given I am logged in and have a linked bank account
And I am on the home screen
When I click "New"
And I search for and select a contact
And I enter a valid amount of "$25.00"
And I enter the note "Lunch yesterday"
And I click "Pay"
Then I see a confirmation screen for the completed payment
And the transaction appears at the top of my "Mine" feed
And the note "Lunch yesterday" and amount "$25.00" are displayed on the transaction
```

### AC2 — Receiver is notified and sees the transaction

```gherkin
Given I have sent a payment of "$25.00" to another user
When the receiver logs in
Then the receiver has a new notification for the received payment
And the transaction appears in the receiver's "Mine" feed
And the amount is shown as a credit (incoming) for the receiver
```

### AC3 — Amount validation

```gherkin
Given I am on the payment amount step
When I enter "0", a negative value, or leave the amount empty
Then the "Pay" button is disabled
And I cannot proceed until a valid positive amount is entered
```

### AC4 — Contact is required

```gherkin
Given I have started a new transaction
When I have not selected a contact
Then I cannot reach the amount/note step
```

### AC5 — Note is optional

```gherkin
Given I have selected a contact and entered a valid amount
When I leave the note field empty
And I click "Pay"
Then the payment completes successfully with no note
```

### AC6 — Feed privacy

```gherkin
Given a payment between two users has completed
When a third, unrelated user views the "Everyone" (public) feed
Then they see the transaction without the exact amount exposed per privacy rules
And the payment is not shown in the third user's "Mine" or "Friends" feed
```

## Out of scope

- Requesting money (RWA-143)
- Splitting a payment across multiple users
- Editing or canceling a completed payment

## Definition of Done

- [ ] Code merged and deployed to staging
- [ ] AC1–AC6 verified
- [ ] Automated coverage added (UI happy path + API contract for `POST /transactions`)
- [ ] No regression in transaction feeds or notifications
- [ ] Accessibility: amount/note inputs and Pay button are keyboard-navigable and labeled

---

## QA Annotations

**Annotated by:** Marius Dicu  
**Date:** 2026-07-06

---

### AC1 — Happy path: send a payment

**[QA: High risk — money movement, automate first]**  
- **Test type:** Automated UI (E2E: login → select contact → enter amount → Pay → confirm)
- **Data dependencies:** Sender must have a linked bank account and positive balance; receiver must exist. Use seeded user `Katharina_Bernier` → `Devontae.Stamm`.
- **Observations:**
  - "Appears at the top of my Mine feed" — assumes newest-first sort. Confirm sort order is guaranteed, not coincidental.
  - Confirmation screen content is unspecified — document what fields must appear so the assertion is objective.
  - Use a unique note per test run (e.g., append timestamp) to avoid false positives from leftover seed data.

---

### AC2 — Receiver is notified and sees the transaction

**[QA: High risk — notification delivery and balance correctness]**  
- **Test type:** Automated UI + API (assert notification via `GET /notifications`; assert credit via `GET /transactions`)
- **Data dependencies:** Same as AC1; receiver must be a distinct user with a fresh session.
- **Observations:**
  - "Has a new notification" — no timing SLA defined. Auto-retry with a 10-second timeout; do not use fixed sleeps.
  - "Shown as a credit (incoming)" — verify via API response field (e.g., `transactionType: "payment"` from receiver's perspective) not just UI label.
  - Notification delivery channel is undefined — in-app only? Note this gap in story feedback.

---

### AC3 — Amount validation

**[QA: High risk — prevents invalid money movement]**  
- **Test type:** Automated UI (parameterized: 0, negative, empty, non-numeric)
- **Data dependencies:** Any logged-in user with a contact selected.
- **Observations:**
  - Missing from AC3: non-numeric input ("abc"), clipboard-pasted formatted values ("$1,000.00"), amounts with 3+ decimal places. Add these as test cases.
  - Assert `disabled` attribute OR `aria-disabled="true"` on Pay button — both must be checked.
  - Also verify that a direct API call (`POST /transactions` with amount=0) is rejected at the server level, not just blocked by UI.
  - **⚠️ Source code finding:** The amount input component has `allowNegative={true}` set explicitly. This directly contradicts AC3, which states negative values should disable Pay. Automated tests should expose this gap — a negative amount test is expected to fail against the current implementation.

---

### AC4 — Contact is required

**[QA: Medium risk — guards flow integrity]**  
- **Test type:** Automated UI
- **Data dependencies:** Logged-in user; no contact selected.
- **Observations:**
  - Verify that the amount input (`data-test="transaction-create-amount-input"`) is not rendered/accessible without a contact selected.
  - Also test: direct URL navigation to `/transaction/new/amount` (if such a route exists) without a contact in state — should redirect back to contact selection.

---

### AC5 — Note is optional

**[QA: Low risk — straightforward negative/optional field test]**  
- **Test type:** Automated UI
- **Data dependencies:** Same as AC1.
- **Observations:**
  - Verify no validation error appears for empty note.
  - Verify API payload for `description` field when note is empty — should be `""` or `null`, not undefined. Check backend handles both gracefully.

---

### AC6 — Feed privacy

**[QA: High risk — privacy/data exposure]**  
- **Test type:** Manual (requires visual verification of displayed content) + Automated API (assert transaction not in third user's personal/contacts feed)
- **Data dependencies:** Three distinct users; a completed transaction between two of them; third user in a fresh session.
- **Observations:**
  - **BLOCKER:** "Per privacy rules" is undefined. Cannot write an objective automated assertion until the expected display format is specified (e.g., amount hidden vs. redacted vs. shown as "$-").
  - At API layer: verify `GET /transactions` for the third user does NOT include the Katharina→Devontae transaction in personal or contacts results.
  - At UI layer: manually document what is actually rendered for the Everyone feed entry, and raise a bug if it differs from whatever the privacy rule turns out to be.

---

### Definition of Done — QA Notes

- **"Automated coverage added (UI happy path + API contract for POST /transactions)"** — Playwright E2E covers the UI happy path. API contract test for `POST /transactions` should validate: correct status code, response schema (id, amount, status, senderId, receiverId, description, createdAt), and that `amount` in the response matches the submitted value.
- **"No regression in transaction feeds or notifications"** — include a smoke test run against the Mine, Friends, and Everyone feeds as part of the regression suite.
- **"Accessibility: amount/note inputs and Pay button are keyboard-navigable and labeled"** — this is in the DoD but has no AC. Add a manual accessibility check: tab through the payment flow and verify focus order and ARIA labels. Candidate for axe-core integration.
