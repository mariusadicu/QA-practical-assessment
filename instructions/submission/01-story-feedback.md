# Story Feedback — RWA-142 · Send Money to a Contact

**Reviewer:** Marius Dicu  
**Date:** 2026-07-06  
**Story:** RWA-142 · Send money to a contact  
**Status:** ⚠️ Not ready — see recommendation below

---

Overall the happy path is reasonably described, but this story has enough open questions that I'd push back in refinement before dev starts. Notes below.

## 1. Ambiguities & Gaps

### 1.1 Amount boundaries are undefined
AC1 uses `$25.00` as the example amount, but nowhere does the story define:
- **Minimum** valid amount — is `$0.01` acceptable? `$1.00`?
- **Maximum** valid amount — can a user send `$1,000,000`? Is there a per-transaction cap?
- **Daily/weekly limits** — no mention of rate limiting or send limits per user

For a money-movement story these are not edge cases — they are core business rules that must be codified before a test can be written.

### 1.2 Insufficient balance / no-funds state is completely missing
There is no AC and no description of what happens when the sender does not have enough balance to cover the payment. This is arguably the most critical negative path in a payments flow. Does the app:
- Block the Pay button pre-emptively?
- Allow submission and return a failure response?
- Show an error message? If so, what copy?

### 1.3 Negative amounts allowed by implementation — contradicts AC3
Running the app and inspecting the amount input reveals that negative values are accepted and the Pay button stays enabled with a negative amount entered. AC3 says negative values should disable Pay — the implementation doesn't enforce this. Automated tests expose this gap directly.

### 1.4 Decimal / rounding behavior is unspecified
What happens when a user enters an amount with more than two decimal places (e.g., `$10.999`)? Does the system:
- Round to `$11.00`?
- Truncate to `$10.99`?
- Reject the input with a validation error?

In financial systems rounding behavior must be explicit. Undocumented rounding is a compliance and trust risk.

### 1.5 Non-numeric input not covered
AC3 covers `0`, negative values, and empty — but not:
- Letters (`"abc"`)
- Mixed input (`"$25"`, `"25.00abc"`)
- Clipboard-pasted formatted strings (`"$1,000.00"` with comma)

### 1.6 "Privacy rules" in AC6 is undefined
AC6 states the third user sees the transaction `"without the exact amount exposed per privacy rules"` — but **privacy rules are never defined in this story or referenced elsewhere**. We don't know:
- What IS shown instead of the amount (redacted, `$-`, a placeholder)?
- Whether the sender/receiver names are visible or anonymized
- Whether privacy is a user setting or always-on for the Everyone feed

This AC cannot be objectively verified as written.

### 1.7 Confirmation screen content is unspecified
AC1 says "I see a confirmation screen for the completed payment" but doesn't define what the screen must display. Does it show: the amount, the recipient name, the note, a transaction ID, a timestamp? Without this, the assertion is subjective.

### 1.8 Notification mechanism and timing undefined
AC2 says the receiver "has a new notification" but doesn't specify:
- Delivery channel (in-app only, push, email?)
- Expected latency (immediate, within 5 seconds, eventually consistent?)
- Persistence (does the notification survive logout/login?)
- Read/unread state behavior

### 1.9 Concurrency and duplicate submission not addressed
No AC covers:
- What happens if the user clicks Pay twice rapidly (double-submit)
- Whether `POST /transactions` is idempotent
- Concurrent payments that would overdraft a shared balance

### 1.10 Browser back-navigation during the payment flow
If a user clicks Pay and then immediately presses the browser back button, what happens? Is the transaction created? Is there a half-committed state?

### 1.11 Self-payment
Can a user send money to themselves? The contact search step presumably returns all users — the story doesn't block or address this scenario.

### 1.12 Note character limit
No maximum length is defined for the note field. Very long notes (e.g., 10,000 characters) could break the UI layout or backend storage.

---

## 2. Untestable or Weak Acceptance Criteria

| AC | Issue | Proposed Rewrite |
|---|---|---|
| **AC6** | "Without the exact amount exposed per privacy rules" is subjective and circular — "privacy rules" are undefined. | _"When a third, unrelated user views the Everyone feed, the transaction appears showing sender name, receiver name, and note, but the amount is replaced with '—'. The transaction does not appear in the third user's Mine or Friends feed."_ |
| **AC2** | "Has a new notification" sets no timing SLA and no delivery channel. | _"Within 5 seconds of the payment completing, the receiver sees an unread in-app notification badge. Opening the notification shows: '[Sender] paid you $25.00 – Lunch yesterday'."_ |
| **AC1** | "Appears at the top of my Mine feed" assumes newest-first sort order without stating it. | _"The transaction appears as the first item in the Mine feed, sorted by creation time descending."_ |
| **AC3** | Covers 0, negative, and empty but not non-numeric input. | Add: _"When I enter non-numeric characters, the input rejects them or the Pay button remains disabled."_ |

---

## 3. Missing Scenarios (Not Covered by Any AC)

| # | Scenario | Risk Level |
|---|---|---|
| M1 | Sender has insufficient balance | 🔴 Critical — core money-movement risk |
| M2 | Amount exceeds maximum limit | 🔴 Critical |
| M3 | Amount below minimum (e.g., $0.001) | 🟠 High |
| M4 | Amount with 3+ decimal places | 🟠 High — rounding/truncation risk |
| M5 | Non-numeric input in amount field | 🟠 High |
| M6 | Clipboard paste of formatted amount ("$1,000.00") | 🟡 Medium |
| M7 | Double-click Pay (duplicate transaction) | 🔴 Critical |
| M8 | Browser back after clicking Pay | 🟠 High |
| M9 | Network failure / API timeout during POST /transactions | 🟠 High |
| M10 | Sending to yourself | 🟡 Medium |
| M11 | Note with XSS payload (`<script>alert(1)</script>`) | 🟠 High — security |
| M12 | Contact search returns no results | 🟡 Medium |
| M13 | Keyboard-only navigation through full flow (DoD mentions accessibility, no AC exists) | 🟡 Medium |

---

## 4. Questions for Product / Design / Engineering

Before development starts, I'd want answers to these in refinement:

1. **Amount limits:** What are the minimum and maximum transaction amounts? Are there daily/weekly send limits per user?
2. **Insufficient balance:** What exactly happens — pre-validation before showing Pay, or post-submit error? What is the error copy?
3. **Rounding:** If a user enters `$10.999`, does the app round, truncate, or reject it?
4. **Privacy rules (AC6):** What precisely is shown in the Everyone feed — what field is hidden and what is displayed in its place?
5. **Duplicate submission:** Is `POST /transactions` idempotent? Is the Pay button disabled after first click?
6. **Notification SLA:** What is the expected delivery time for the in-app notification? Is real-time assumed?
7. **Confirmation screen:** What fields must appear on the confirmation screen (amount, recipient, note, transaction ID, timestamp)?
8. **Self-payment:** Should a user be able to send money to themselves? Blocked in UI, API, or both?
9. **Note character limit:** Is there a max length? What is the error state when exceeded?
10. **Browser back behavior:** If the user navigates back after clicking Pay, what happens to the in-flight transaction?

---

## 5. Recommendation

**⚠️ This story is NOT ready to be worked on.**

The happy path is reasonably described, but the story has critical holes that will cause rework or missed bugs in production:

- The **insufficient balance** scenario is entirely absent — this is the most common failure mode in a payments app.
- **AC6 (privacy rules)** is un-verifiable as written. Engineering and QA would have no agreed basis to say it passes.
- **Amount boundaries** are undefined, making AC3 (amount validation) incomplete.
- **Duplicate submission protection** is unaddressed — double-sends would be a serious data integrity issue.

**Recommended actions before kicking off development:**

1. Add an AC covering insufficient balance (error message, Pay button state).
2. Rewrite AC6 with an explicit definition of what is and isn't shown.
3. Define min/max amount limits and rounding behavior in the Description.
4. Add an AC or a note on idempotency / double-submit prevention.
5. Specify confirmation screen required fields.

The story can move forward once those five items are resolved. The rest can be tracked as follow-up edge case tickets.
