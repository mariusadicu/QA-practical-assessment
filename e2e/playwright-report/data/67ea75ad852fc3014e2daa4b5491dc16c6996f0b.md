# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: send-money.spec.ts >> RWA-142 · Send Money to a Contact >> TC-142-02 · Happy path: send $10.00 with no note (AC5)
- Location: tests/send-money.spec.ts:124:7

# Error details

```
Error: expect(locator).toBeEnabled() failed

Locator:  getByTestId('transaction-create-submit-payment')
Expected: enabled
Received: disabled
Timeout:  10000ms

Call log:
  - Expect "toBeEnabled" with timeout 10000ms
  - waiting for getByTestId('transaction-create-submit-payment')
    24 × locator resolved to <button disabled tabindex="-1" type="submit" data-test="transaction-create-submit-payment" class="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium MuiButton-containedSizeMedium MuiButton-colorPrimary MuiButton-fullWidth Mui-disabled MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium MuiButton-containedSizeMedium MuiButton-colorPrimary MuiButton-fullWidth TransactionCreateStepTwo-submit css-q6gao2-MuiButtonBase-root-Mu…>Pay</button>
       - unexpected value "disabled"

```

```yaml
- button "Pay" [disabled]
```

# Test source

```ts
  31  |   await page.goto(BASE_URL);
  32  |   await screenshot(page, `${username}-01-sign-in-page`);
  33  | 
  34  |   // MUI wraps inputs in a div — must drill into the actual <input>
  35  |   await page.getByTestId("signin-username").locator("input").fill(username);
  36  |   await page.getByTestId("signin-password").locator("input").fill(password);
  37  |   await screenshot(page, `${username}-02-credentials-entered`);
  38  | 
  39  |   await page.getByTestId("signin-submit").click();
  40  |   // Wait for home page element instead of URL (more reliable for SPAs)
  41  |   // This fork uses "nav-top-new-transaction" — not the standard "new-transaction"
  42  |   await page.getByTestId("nav-top-new-transaction").waitFor({ timeout: 30_000 });
  43  |   await screenshot(page, `${username}-03-home-page`);
  44  | }
  45  | 
  46  | async function startNewTransaction(page: Page) {
  47  |   await page.getByTestId("nav-top-new-transaction").click();
  48  |   await page.waitForURL(`${BASE_URL}/transaction/new`);
  49  |   await screenshot(page, "new-transaction-page");
  50  | }
  51  | 
  52  | async function selectContact(page: Page, searchTerm: string) {
  53  |   const searchInput = page.getByTestId("user-list-search-input");
  54  |   await searchInput.fill(searchTerm);
  55  |   // Wait for results to load
  56  |   // This fork uses "user-list-item-" (singular) not "users-list-item-" (plural)
  57  |   await page.waitForSelector('[data-test^="user-list-item-"]');
  58  |   await screenshot(page, `contact-search-results-${searchTerm}`);
  59  | 
  60  |   // Click the first matching result
  61  |   await page.locator('[data-test^="user-list-item-"]').first().click();
  62  |   await screenshot(page, "contact-selected");
  63  | }
  64  | 
  65  | async function enterPaymentDetails(page: Page, amount: string, note: string) {
  66  |   // Amount input is a MUI wrapper div — must drill into the actual <input>
  67  |   const amountInput = page.getByTestId("transaction-create-amount-input").locator("input");
  68  |   await amountInput.fill(amount);
  69  |   await screenshot(page, `amount-entered-${amount}`);
  70  | 
  71  |   if (note) {
  72  |     // Description input is also a MUI wrapper — same fix
  73  |     await page.getByTestId("transaction-create-description-input").locator("input").fill(note);
  74  |     await screenshot(page, "note-entered");
  75  |   }
  76  | }
  77  | 
  78  | // ---------------------------------------------------------------------------
  79  | // Test suite
  80  | // ---------------------------------------------------------------------------
  81  | 
  82  | test.describe("RWA-142 · Send Money to a Contact", () => {
  83  |   // =========================================================================
  84  |   // TC-142-01: Happy Path — send a valid payment WITH note
  85  |   // =========================================================================
  86  |   test('TC-142-01 · Happy path: send $25.00 with note "Lunch yesterday"', async ({ page }) => {
  87  |     const uniqueNote = `Lunch yesterday ${Date.now()}`;
  88  | 
  89  |     await signIn(page, USERS.sender.username, USERS.sender.password);
  90  |     await startNewTransaction(page);
  91  |     await selectContact(page, "Dina");
  92  |     await enterPaymentDetails(page, "25", uniqueNote);
  93  | 
  94  |     const payButton = page.getByTestId("transaction-create-submit-payment");
  95  |     await expect(payButton).toBeEnabled();
  96  |     await payButton.click();
  97  |     await screenshot(page, "after-pay-click");
  98  | 
  99  |     await page.getByTestId('new-transaction-return-to-transactions').waitFor({ timeout: 10_000 });
  100 |     await screenshot(page, "confirmation-screen");
  101 | 
  102 |     const pageContent = page.locator("body");
  103 |     await expect(pageContent).toContainText("25");
  104 |     await expect(pageContent).toContainText(uniqueNote);
  105 |     await screenshot(page, "confirmation-details-verified");
  106 | 
  107 |     // Return to feed first — nav tabs only exist on feed pages, not on /transaction/new
  108 |     await page.getByTestId("new-transaction-return-to-transactions").click();
  109 |     await page.getByTestId("nav-personal-tab").waitFor({ timeout: 10_000 });
  110 | 
  111 |     await page.getByTestId("nav-personal-tab").click();
  112 |     await screenshot(page, "mine-feed");
  113 | 
  114 |     // data-test is "transaction-item-{id}" so use prefix match, not exact getByTestId
  115 |     const transactionItem = page.locator('[data-test^="transaction-item-"]').first();
  116 |     await expect(transactionItem).toBeVisible({ timeout: 10_000 });
  117 |     await expect(transactionItem).toContainText(uniqueNote);
  118 |     await screenshot(page, "tc-142-01-mine-feed-verified");
  119 |   });
  120 | 
  121 |   // =========================================================================
  122 |   // TC-142-02: Happy Path — send payment WITHOUT note (AC5)
  123 |   // =========================================================================
  124 |   test("TC-142-02 · Happy path: send $10.00 with no note (AC5)", async ({ page }) => {
  125 |     await signIn(page, USERS.sender.username, USERS.sender.password);
  126 |     await startNewTransaction(page);
  127 |     await selectContact(page, "Dina");
  128 |     await enterPaymentDetails(page, "10", ""); // empty note
  129 | 
  130 |     const payButton = page.getByTestId("transaction-create-submit-payment");
> 131 |     await expect(payButton).toBeEnabled();
      |                             ^ Error: expect(locator).toBeEnabled() failed
  132 |     await payButton.click();
  133 | 
  134 |     await page.getByTestId('new-transaction-return-to-transactions').waitFor({ timeout: 10_000 });
  135 |     await screenshot(page, "tc-142-02-confirmation-no-note");
  136 | 
  137 |     await expect(page.locator("body")).not.toContainText("error");
  138 |     await screenshot(page, "tc-142-02-pass");
  139 |   });
  140 | 
  141 |   // =========================================================================
  142 |   // TC-142-04 / TC-142-05 / TC-142-06 / TC-142-07: Amount validation (AC3)
  143 |   // =========================================================================
  144 |   test.describe("Amount validation (AC3)", () => {
  145 |     async function goToAmountStep(page: Page) {
  146 |       await signIn(page, USERS.sender.username, USERS.sender.password);
  147 |       await startNewTransaction(page);
  148 |       await selectContact(page, "Dina");
  149 |       // Fill note first — app requires note to enable Pay (TC-142-02 documents this as a bug vs AC5)
  150 |       // This isolates amount as the only variable in validation tests
  151 |       await page
  152 |         .getByTestId("transaction-create-description-input")
  153 |         .locator("input")
  154 |         .fill("test note");
  155 |     }
  156 | 
  157 |     test("TC-142-04 · Amount = 0 → Pay button disabled", async ({ page }) => {
  158 |       await goToAmountStep(page);
  159 |       // MUI wrapper — must use .locator('input')
  160 |       await page.getByTestId("transaction-create-amount-input").locator("input").fill("0");
  161 |       await screenshot(page, "tc-142-04-amount-zero");
  162 | 
  163 |       const payButton = page.getByTestId("transaction-create-submit-payment");
  164 |       await expect(payButton).toBeDisabled();
  165 |       await screenshot(page, "tc-142-04-pay-disabled");
  166 |     });
  167 | 
  168 |     test("TC-142-05 · Negative amount input is sanitized to positive by react-number-format", async ({ page }) => {
  169 |       await goToAmountStep(page);
  170 |       // MUI wrapper — must use .locator('input')
  171 |       await page.getByTestId("transaction-create-amount-input").locator("input").fill("-25");
  172 |       await screenshot(page, "tc-142-05-negative-amount");
  173 | 
  174 |       // react-number-format strips the minus sign: "-25" is silently converted to "25".
  175 |       // The Pay button is correctly ENABLED for the resulting positive $25 amount.
  176 |       // Negative amounts cannot be entered in this field — the field enforces positive-only input.
  177 |       const actualValue = await page.getByTestId("transaction-create-amount-input").locator("input").inputValue();
  178 |       console.log(`Amount field after entering "-25": "${actualValue}"`);
  179 | 
  180 |       const payButton = page.getByTestId("transaction-create-submit-payment");
  181 |       await expect(payButton).toBeEnabled(); // Correct: field converted -25 → 25, a valid positive amount
  182 |       await screenshot(page, "tc-142-05-field-sanitized-pay-enabled");
  183 |     });
  184 | 
  185 |     test("TC-142-06 · Empty amount → Pay button disabled", async ({ page }) => {
  186 |       await goToAmountStep(page);
  187 |       // No fill — amount is left empty
  188 |       await screenshot(page, "tc-142-06-empty-amount");
  189 | 
  190 |       const payButton = page.getByTestId("transaction-create-submit-payment");
  191 |       await expect(payButton).toBeDisabled();
  192 |       await screenshot(page, "tc-142-06-pay-disabled");
  193 |     });
  194 | 
  195 |     test("TC-142-07 · Non-numeric input → Pay button disabled", async ({ page }) => {
  196 |       await goToAmountStep(page);
  197 |       // MUI wrapper — must use .locator('input')
  198 |       await page.getByTestId("transaction-create-amount-input").locator("input").fill("abc");
  199 |       await screenshot(page, "tc-142-07-nonnumeric-amount");
  200 | 
  201 |       const payButton = page.getByTestId("transaction-create-submit-payment");
  202 |       await expect(payButton).toBeDisabled();
  203 |       await screenshot(page, "tc-142-07-pay-disabled");
  204 |     });
  205 |   });
  206 | 
  207 |   // =========================================================================
  208 |   // TC-142-08: Contact is required (AC4)
  209 |   // =========================================================================
  210 |   test("TC-142-08 · Contact required — cannot reach amount step without selecting contact", async ({
  211 |     page,
  212 |   }) => {
  213 |     await signIn(page, USERS.sender.username, USERS.sender.password);
  214 |     await startNewTransaction(page);
  215 |     await screenshot(page, "tc-142-08-contact-search-page");
  216 | 
  217 |     // Amount input should NOT be visible before a contact is selected
  218 |     const amountInput = page.getByTestId("transaction-create-amount-input");
  219 |     await expect(amountInput).not.toBeVisible();
  220 |     await screenshot(page, "tc-142-08-amount-not-visible");
  221 |   });
  222 | 
  223 |   // =========================================================================
  224 |   // TC-142-11: Edge — amount with 3+ decimal places
  225 |   // =========================================================================
  226 |   test("TC-142-11 · Edge: amount with 3 decimal places ($10.999) — BUG DETECTION", async ({
  227 |     page,
  228 |   }) => {
  229 |     await signIn(page, USERS.sender.username, USERS.sender.password);
  230 |     await startNewTransaction(page);
  231 |     await selectContact(page, "Dina");
```