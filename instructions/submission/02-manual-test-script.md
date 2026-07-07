# Manual Test Script — RWA-142 · Send Money to a Contact

**Author:** Marius Dicu  
**Story:** RWA-142 · Send money to a contact  
**App URL:** http://localhost:3000  
**Default password for all seeded users:** `s3cret`  
**Reset data before each run:** `yarn db:seed:dev`

---

## Test Users

Run `yarn list:dev:users` to get the full list. Suggested assignments:

| Role | Username | Notes |
|---|---|---|
| Sender | `Heath93` | Primary test sender |
| Receiver | `Dina20` | Primary test receiver (display name: Darrel Ortiz) |
| Third user | `Arvilla_Hegmann` | For privacy / feed isolation tests |

---

## Test Cases

---

### TC-142-01 · Happy path: send a valid payment with a note

**Covers:** AC1  
**Priority:** P1 — Critical  
**Automation candidate:** Yes — happy path E2E

**Preconditions:**
- Sender (`Heath93`) is logged out
- Receiver (`Dina20`) account exists
- Database seeded (`yarn db:seed:dev`)

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate to http://localhost:3000 | Sign-in page is displayed |
| 2 | Enter username `Heath93` in the username field | Field accepts input |
| 3 | Enter password `s3cret` in the password field | Field accepts input (masked) |
| 4 | Click Sign In | User is redirected to the home screen / activity feed |
| 5 | Click the **New** button to start a new transaction | New transaction / contact search screen is displayed |
| 6 | Type `Dina` in the user search field | Matching contacts appear in the results list |
| 7 | Click on `Dina20` (Darrel Ortiz) in the results | Amount and note entry form is displayed, contact is confirmed |
| 8 | Click the amount input field and enter `25` | Field shows `$25.00` (or `25`) |
| 9 | Click the note field and type `Lunch yesterday` | Note field shows `Lunch yesterday` |
| 10 | Click the **Pay** button | Confirmation screen is displayed for the completed payment |
| 11 | Verify the confirmation screen shows: amount `$25.00`, recipient `Dina20`, note `Lunch yesterday` | All three values are displayed correctly |
| 12 | Navigate to the **Mine** tab / personal activity feed | Feed is displayed |
| 13 | Verify the new transaction appears at the top of the Mine feed with amount `$25.00` and note `Lunch yesterday` | Transaction is present with correct data |

**Pass criteria:** Steps 10–13 all pass.

---

### TC-142-02 · Happy path: send a valid payment without a note

**Covers:** AC5  
**Priority:** P1 — Critical  
**Automation candidate:** Yes

**Preconditions:** Same as TC-142-01

| Step | Action | Expected Result |
|---|---|---|
| 1–7 | Sign in as `Heath93` and select `Dina20` as contact | Amount entry form is displayed |
| 8 | Enter amount `10` | Amount field shows the entered value |
| 9 | Leave the note field **empty** | Note field remains blank |
| 10 | Click **Pay** | Confirmation screen is displayed; no note / blank note is shown |
| 11 | Verify payment appears in Mine feed without a note | Transaction is present; no note is displayed or note is blank |

**Pass criteria:** Payment completes successfully with no note. No error about missing note.

---

### TC-142-03 · Receiver notification and feed (AC2)

**Covers:** AC2  
**Priority:** P1 — Critical  
**Automation candidate:** Yes (verify via API)

**Preconditions:**
- TC-142-01 has been completed (payment of $25.00 sent)
- OR run TC-142-01 steps 1–11 first, then log out

| Step | Action | Expected Result |
|---|---|---|
| 1 | Log out of sender's account | Redirected to sign-in page |
| 2 | Sign in as `Dina20` | Home/feed page displayed |
| 3 | Check for a notification indicator (badge, bell icon) | An unread notification is shown |
| 4 | Open the notification | Notification references received payment of $25.00 from `Heath93` |
| 5 | Navigate to the **Mine** tab | Mine feed is displayed |
| 6 | Verify the $25.00 payment appears in the feed as a **credit** (incoming) | Transaction shows correct amount marked as received/credit, not debit |

**Pass criteria:** Receiver sees notification and the amount is displayed as a credit.

---

### TC-142-04 · Amount validation — enter zero (AC3)

**Covers:** AC3  
**Priority:** P1 — Critical  
**Automation candidate:** Yes

**Preconditions:** Signed in as `Heath93`, contact `Dina20` selected

| Step | Action | Expected Result |
|---|---|---|
| 1 | Sign in and navigate to new transaction, select contact | Amount entry step shown |
| 2 | Enter `0` in the amount field | Amount field shows `0` |
| 3 | Observe the **Pay** button state | Pay button is **disabled** |
| 4 | Attempt to click the Pay button | Nothing happens; no transaction is submitted |

**Pass criteria:** Pay button is disabled when amount is `0`.

---

### TC-142-05 · Amount validation — enter negative value (AC3)

**Covers:** AC3  
**Priority:** P1 — Critical  
**Automation candidate:** Yes

**Preconditions:** Same as TC-142-04

| Step | Action | Expected Result |
|---|---|---|
| 1–2 | Navigate to amount step with contact selected | Amount form shown |
| 3 | Enter `-25` in the amount field | Field either rejects the `-` character or shows -25 |
| 4 | Observe the Pay button | Pay button is **disabled** |
| 5 | Attempt to submit | No transaction created |

**Pass criteria:** Pay button is disabled for negative amounts.

---

### TC-142-06 · Amount validation — leave empty (AC3)

**Covers:** AC3  
**Priority:** P1 — Critical  
**Automation candidate:** Yes

**Preconditions:** Same as TC-142-04

| Step | Action | Expected Result |
|---|---|---|
| 1–2 | Navigate to amount step | Amount form shown |
| 3 | Do not enter anything in the amount field | Amount field is blank |
| 4 | Observe the Pay button | Pay button is **disabled** |
| 5 | Attempt to click Pay | No transaction created |

**Pass criteria:** Pay button disabled when amount is empty.

---

### TC-142-07 · Amount validation — non-numeric input

**Covers:** AC3 (gap identified in story feedback)  
**Priority:** P1 — High  
**Automation candidate:** Yes

**Preconditions:** Same as TC-142-04

| Step | Action | Expected Result |
|---|---|---|
| 1–2 | Navigate to amount step | Amount form shown |
| 3 | Type `abc` in the amount field | Characters are rejected (field stays empty) OR Pay button is disabled |
| 4 | Type `25abc` in the amount field | Non-numeric characters are rejected or Pay button disabled |
| 5 | Attempt to submit | No transaction created |

**Pass criteria:** Non-numeric input does not enable the Pay button.

---

### TC-142-08 · Contact is required — cannot skip to amount step (AC4)

**Covers:** AC4  
**Priority:** P1 — High  
**Automation candidate:** Yes

**Preconditions:** Signed in as `Heath93`

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate to new transaction | Contact search screen is shown |
| 2 | Do NOT select any contact | No contact is highlighted/selected |
| 3 | Attempt to proceed to the amount step (e.g., via a Next button or direct URL navigation) | Cannot proceed; amount/note step is inaccessible |
| 4 | Verify no amount entry is shown | Amount form is not displayed |

**Pass criteria:** Amount entry step cannot be reached without selecting a contact.

---

### TC-142-09 · Feed privacy — third user on Everyone feed (AC6)

**Covers:** AC6  
**Priority:** P2 — High  
**Automation candidate:** Partial (manual verification of display content needed)

**Preconditions:**
- TC-142-01 completed (payment sent between Heath93 and Dina20)
- Third user (`Arvilla_Hegmann`) account exists

| Step | Action | Expected Result |
|---|---|---|
| 1 | Log out and sign in as `Arvilla_Hegmann` | Home page shown |
| 2 | Navigate to the **Everyone** (public) feed | Public transactions are listed |
| 3 | Locate the Heath93 → Dina20 transaction | Transaction entry is visible |
| 4 | Verify the **exact amount is not exposed** per privacy rules | Amount is hidden, redacted, or replaced with a placeholder (per AC6) |
| 5 | Navigate to `Arvilla_Hegmann`'s **Mine** feed | Mine feed displayed |
| 6 | Verify the Heath93 → Dina20 transaction is **not** in Mine feed | Transaction is absent |
| 7 | Navigate to `Arvilla_Hegmann`'s **Friends** feed | Friends feed displayed |
| 8 | Verify the transaction is **not** in Friends feed (unless Arvilla_Hegmann is connected to either party) | Transaction is absent |

**Pass criteria:** Steps 4, 6, 8 all pass.  
**Note:** AC6 is currently ambiguous (see story feedback). Tester should document exactly what is displayed in step 4 regardless of pass/fail.

---

### TC-142-10 · Edge case — minimum valid amount

**Covers:** Gap M3 from story feedback  
**Priority:** P2 — High  
**Automation candidate:** Yes

**Preconditions:** Same as TC-142-01

| Step | Action | Expected Result |
|---|---|---|
| 1–7 | Sign in and select contact | Amount step shown |
| 8 | Enter `0.01` in the amount field | Field accepts the value |
| 9 | Click Pay | Payment completes OR clear validation error is shown if below minimum |
| 10 | Verify the outcome matches the defined minimum (to be agreed with Product) | Consistent with business rule |

**Pass criteria:** System handles $0.01 consistently — either accepts it or shows a clear, correct validation error.

---

### TC-142-11 · Edge case — amount with more than 2 decimal places

**Covers:** Gap M4 from story feedback  
**Priority:** P2 — High  
**Automation candidate:** Yes

**Preconditions:** Same as TC-142-01

| Step | Action | Expected Result |
|---|---|---|
| 1–7 | Sign in and select contact | Amount step shown |
| 8 | Enter `10.999` in the amount field | Input is either rejected, auto-corrected to `10.99`, or rounded to `11.00` |
| 9 | Observe what the field displays | Document the actual behavior |
| 10 | If Pay is enabled, click Pay and verify the stored/displayed amount | Transaction amount matches the expected rounding/truncation rule |

**Pass criteria:** System handles extra decimals consistently and predictably. Does not silently create an incorrect amount.

---

### TC-142-12 · Edge case — note with special characters

**Covers:** Gap M13 from story feedback (security)  
**Priority:** P2 — High  
**Automation candidate:** Yes

**Preconditions:** Same as TC-142-01

| Step | Action | Expected Result |
|---|---|---|
| 1–8 | Sign in, select contact, enter valid amount `25` | Note step available |
| 9 | Enter `<script>alert('xss')</script>` in the note field | Note field accepts the text as a literal string |
| 10 | Click Pay | Payment completes |
| 11 | Verify the note is displayed in the feed and confirmation as a literal string | No script is executed; note displays as escaped text |

**Pass criteria:** XSS payload is rendered as plain text, not executed.

---

### TC-142-13 · Edge case — rapid double-click Pay

**Covers:** Gap M7 from story feedback (duplicate transaction)  
**Priority:** P1 — Critical (money movement)  
**Automation candidate:** Yes (verify via API count)

**Preconditions:** Same as TC-142-01, fresh seed

| Step | Action | Expected Result |
|---|---|---|
| 1–9 | Sign in, select contact, enter `25`, note `Double click test` | Ready to pay |
| 10 | Double-click the **Pay** button as fast as possible | Only one transaction is created |
| 11 | Check Mine feed | Only one transaction appears for this payment |
| 12 | Check via API `GET /transactions` | Only one transaction exists for this operation |

**Pass criteria:** Exactly one transaction created regardless of how fast Pay is clicked.

---

## Summary

| ID | Title | Priority | Covers | Automate |
|---|---|---|---|---|
| TC-142-01 | Happy path with note | P1 | AC1 | ✅ |
| TC-142-02 | Happy path no note | P1 | AC5 | ✅ |
| TC-142-03 | Receiver notification & feed | P1 | AC2 | ✅ |
| TC-142-04 | Amount = 0 | P1 | AC3 | ✅ |
| TC-142-05 | Negative amount | P1 | AC3 | ✅ |
| TC-142-06 | Empty amount | P1 | AC3 | ✅ |
| TC-142-07 | Non-numeric amount | P1 | AC3 gap | ✅ |
| TC-142-08 | Contact required | P1 | AC4 | ✅ |
| TC-142-09 | Feed privacy | P2 | AC6 | Partial |
| TC-142-10 | Minimum amount | P2 | Gap M3 | ✅ |
| TC-142-11 | 3+ decimal places | P2 | Gap M4 | ✅ |
| TC-142-12 | XSS in note | P2 | Gap M13 | ✅ |
| TC-142-13 | Double-click Pay | P1 | Gap M7 | ✅ |
