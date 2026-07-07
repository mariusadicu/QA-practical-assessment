# BUG: Note field required to submit payment — contradicts AC5 (optional)

**Severity:** Medium  
**Priority:** P2  
**Affected story / AC:** RWA-142 · AC5  
**Environment:** local — branch main, Chromium (Playwright), Node 18

## Steps to reproduce

1. Sign in as `Heath93` / `s3cret`
2. Click **New** → search "Dina" → select Darrel Ortiz (Dina20)
3. Enter `10` in the Amount field
4. Leave the Note field **empty**
5. Observe the Pay button state

## Expected result

Per AC5: *"Given I have selected a contact and entered a valid amount, when I leave the note field empty and I click 'Pay', then the payment completes successfully with no note."*

The Pay button should be enabled with a valid amount and no note. The payment should submit successfully.

## Actual result

The Pay button remains **disabled** when the note field is empty, even with a valid amount entered. The user cannot submit a payment without providing a note. No error message or validation hint is shown to explain why Pay is unavailable.

## Evidence

- Automated test **TC-142-02** fails with: `expect(locator).toBeEnabled() failed — Received: disabled`
- Screenshot: `e2e/screenshots/amount-entered-10.png` — Pay button visibly disabled with only amount filled, note field empty

## Impact / notes

Medium impact — usability regression against the documented AC. Users filling only the required fields (amount) cannot complete a payment and receive no feedback explaining why. Likely root cause: the form validation schema treats `description` as required (e.g. a `yup.string().required()` constraint) rather than optional. Fix: change `description` validation to `yup.string().optional()` or equivalent.

---

# BUG: Amount of $0.00 accepted — Pay button enabled for zero-value transactions

**Severity:** High  
**Priority:** P1  
**Affected story / AC:** RWA-142 · AC3  
**Environment:** local — branch main, Chromium (Playwright), Node 18

## Steps to reproduce

1. Sign in as `Heath93` / `s3cret`
2. Click **New** → search "Dina" → select Darrel Ortiz (Dina20)
3. Enter any text in the Note field (e.g. `test note`)
4. Enter `0` in the Amount field
5. Observe the Pay button state

## Expected result

Per AC3: *"When I enter '0', a negative value, or leave the amount empty, then the 'Pay' button is disabled and I cannot proceed until a valid positive amount is entered."*

The Pay button should be **disabled** when amount is 0.

## Actual result

The Pay button is **enabled** when amount is 0. A $0.00 transaction can be submitted and completes successfully.

## Evidence

- Automated test **TC-142-04** fails with: `expect(locator).toBeDisabled() failed — Received: enabled`
- Screenshot: `e2e/screenshots/tc-142-04-amount-zero.png` — Pay button enabled with $0.00 entered

## Impact / notes

High impact — allows zero-value transactions to be created, potentially corrupting transaction history and financial reporting. Related: negative amounts (e.g. `-$25`) are also accepted and enable Pay, which is a second AC3 violation (documented in TC-142-05). Likely root cause: the amount field uses `react-number-format` for display formatting but lacks a minimum-value constraint in the form validation schema. Fix: add `yup.number().min(0.01, "Amount must be greater than zero")` (or equivalent) to the transaction form schema, covering both zero and negative values.
