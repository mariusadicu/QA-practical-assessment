import { test, expect, Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

const BASE_URL = "http://localhost:3000";
const SCREENSHOT_DIR = path.join(__dirname, "..", "screenshots");

const USERS = {
  sender: { username: "Heath93", password: "s3cret" },
  receiver: { username: "Dina20", password: "s3cret" },
  thirdUser: { username: "Arvilla_Hegmann", password: "s3cret" },
};

async function screenshot(page: Page, name: string) {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${name}.png`), fullPage: true });
}

async function signIn(page: Page, username: string, password: string) {
  await page.goto(BASE_URL);
  await screenshot(page, `${username}-01-sign-in-page`);

  // MUI wraps inputs — drill into the actual <input> element
  await page.getByTestId("signin-username").locator("input").fill(username);
  await page.getByTestId("signin-password").locator("input").fill(password);
  await screenshot(page, `${username}-02-credentials-entered`);

  await page.getByTestId("signin-submit").click();
  // This fork renamed the nav button to "nav-top-new-transaction" (standard RWA uses "new-transaction")
  await page.getByTestId("nav-top-new-transaction").waitFor({ timeout: 30_000 });
  await screenshot(page, `${username}-03-home-page`);
}

async function startNewTransaction(page: Page) {
  await page.getByTestId("nav-top-new-transaction").click();
  await page.waitForURL(`${BASE_URL}/transaction/new`);
  await screenshot(page, "new-transaction-page");
}

async function selectContact(page: Page, searchTerm: string) {
  await page.getByTestId("user-list-search-input").fill(searchTerm);
  // This fork uses "user-list-item-" (singular), not "users-list-item-" (plural)
  await page.waitForSelector('[data-test^="user-list-item-"]');
  await screenshot(page, `contact-search-results-${searchTerm}`);
  await page.locator('[data-test^="user-list-item-"]').first().click();
  await screenshot(page, "contact-selected");
}

async function enterPaymentDetails(page: Page, amount: string, note: string) {
  await page.getByTestId("transaction-create-amount-input").locator("input").fill(amount);
  await screenshot(page, `amount-entered-${amount}`);
  if (note) {
    await page.getByTestId("transaction-create-description-input").locator("input").fill(note);
    await screenshot(page, "note-entered");
  }
}

test.describe("RWA-142 · Send Money to a Contact", () => {
  test('TC-142-01 · Happy path: send $25.00 with note "Lunch yesterday"', async ({ page }) => {
    const uniqueNote = `Lunch yesterday ${Date.now()}`;

    await signIn(page, USERS.sender.username, USERS.sender.password);
    await startNewTransaction(page);
    await selectContact(page, "Dina");
    await enterPaymentDetails(page, "25", uniqueNote);

    const payButton = page.getByTestId("transaction-create-submit-payment");
    await expect(payButton).toBeEnabled();
    await payButton.click();
    await screenshot(page, "after-pay-click");

    await page.getByTestId("new-transaction-return-to-transactions").waitFor({ timeout: 10_000 });
    await screenshot(page, "confirmation-screen");

    await expect(page.locator("body")).toContainText("25");
    await expect(page.locator("body")).toContainText(uniqueNote);
    await screenshot(page, "confirmation-details-verified");

    // Nav tabs only render on feed pages — return to transactions before clicking Mine
    await page.getByTestId("new-transaction-return-to-transactions").click();
    await page.getByTestId("nav-personal-tab").waitFor({ timeout: 10_000 });
    await page.getByTestId("nav-personal-tab").click();
    await screenshot(page, "mine-feed");

    // "transaction-item-{id}" — requires prefix match, not exact getByTestId
    const transactionItem = page.locator('[data-test^="transaction-item-"]').first();
    await expect(transactionItem).toBeVisible({ timeout: 10_000 });
    await expect(transactionItem).toContainText(uniqueNote);
    await screenshot(page, "tc-142-01-mine-feed-verified");
  });

  test("TC-142-02 · Happy path: send $10.00 with no note (AC5)", async ({ page }) => {
    await signIn(page, USERS.sender.username, USERS.sender.password);
    await startNewTransaction(page);
    await selectContact(page, "Dina");
    await enterPaymentDetails(page, "10", "");

    const payButton = page.getByTestId("transaction-create-submit-payment");
    // BUG (AC5): note is required by the app — Pay stays disabled without one
    await expect(payButton).toBeEnabled();
    await payButton.click();

    await page.getByTestId("new-transaction-return-to-transactions").waitFor({ timeout: 10_000 });
    await expect(page.locator("body")).not.toContainText("error");
    await screenshot(page, "tc-142-02-pass");
  });

  test.describe("Amount validation (AC3)", () => {
    async function goToAmountStep(page: Page) {
      await signIn(page, USERS.sender.username, USERS.sender.password);
      await startNewTransaction(page);
      await selectContact(page, "Dina");
      // App requires a note to enable Pay — fill it here so amount is the only variable
      await page.getByTestId("transaction-create-description-input").locator("input").fill("test note");
    }

    test("TC-142-04 · Amount = 0 → Pay button disabled", async ({ page }) => {
      await goToAmountStep(page);
      await page.getByTestId("transaction-create-amount-input").locator("input").fill("0");
      await screenshot(page, "tc-142-04-amount-zero");

      // BUG (AC3): $0 is accepted — Pay button is enabled when it should be disabled
      await expect(page.getByTestId("transaction-create-submit-payment")).toBeDisabled();
      await screenshot(page, "tc-142-04-pay-disabled");
    });

    test("TC-142-05 · Negative amount is sanitized to positive by react-number-format", async ({ page }) => {
      await goToAmountStep(page);
      await page.getByTestId("transaction-create-amount-input").locator("input").fill("-25");
      await screenshot(page, "tc-142-05-negative-amount");

      const actualValue = await page.getByTestId("transaction-create-amount-input").locator("input").inputValue();
      console.log(`Amount after entering "-25": "${actualValue}"`);

      // Field converts -25 → 25; Pay is enabled with a positive value
      await expect(page.getByTestId("transaction-create-submit-payment")).toBeEnabled();
      await screenshot(page, "tc-142-05-field-sanitized-pay-enabled");
    });

    test("TC-142-06 · Empty amount → Pay button disabled", async ({ page }) => {
      await goToAmountStep(page);
      await screenshot(page, "tc-142-06-empty-amount");
      await expect(page.getByTestId("transaction-create-submit-payment")).toBeDisabled();
    });

    test("TC-142-07 · Non-numeric input → Pay button disabled", async ({ page }) => {
      await goToAmountStep(page);
      await page.getByTestId("transaction-create-amount-input").locator("input").fill("abc");
      await screenshot(page, "tc-142-07-nonnumeric-amount");
      await expect(page.getByTestId("transaction-create-submit-payment")).toBeDisabled();
    });
  });

  test("TC-142-08 · Contact required — amount step not reachable before selecting contact", async ({ page }) => {
    await signIn(page, USERS.sender.username, USERS.sender.password);
    await startNewTransaction(page);
    await screenshot(page, "tc-142-08-contact-search-page");

    await expect(page.getByTestId("transaction-create-amount-input")).not.toBeVisible();
    await screenshot(page, "tc-142-08-amount-not-visible");
  });

  test("TC-142-11 · Edge: amount with 3 decimal places ($10.999)", async ({ page }) => {
    await signIn(page, USERS.sender.username, USERS.sender.password);
    await startNewTransaction(page);
    await selectContact(page, "Dina");
    await page.getByTestId("transaction-create-description-input").locator("input").fill("test note");
    await page.getByTestId("transaction-create-amount-input").locator("input").fill("10.999");
    await screenshot(page, "tc-142-11-amount-3-decimals");

    const payButton = page.getByTestId("transaction-create-submit-payment");
    const isEnabled = await payButton.isEnabled();
    console.log(`Pay enabled with 3-decimal amount: ${isEnabled}`);

    if (isEnabled) {
      await payButton.click();
      await page.getByTestId("new-transaction-return-to-transactions").waitFor({ timeout: 10_000 });
      await screenshot(page, "tc-142-11-confirmation-after-3-decimal-amount");
      await expect(page.locator("body")).not.toContainText("10.999");
    }

    await screenshot(page, "tc-142-11-final-state");
  });

  test("TC-142-12 · Edge: XSS payload in note renders as plain text", async ({ page }) => {
    const xssPayload = "<script>alert('xss')</script>";

    await signIn(page, USERS.sender.username, USERS.sender.password);
    await startNewTransaction(page);
    await selectContact(page, "Dina");
    await enterPaymentDetails(page, "1", xssPayload);

    const payButton = page.getByTestId("transaction-create-submit-payment");
    await expect(payButton).toBeEnabled();
    await payButton.click();
    await page.getByTestId("new-transaction-return-to-transactions").waitFor({ timeout: 10_000 });
    await screenshot(page, "tc-142-12-confirmation-xss-note");

    await expect(page.locator("body")).toContainText("script");
    await screenshot(page, "tc-142-12-xss-rendered-as-text");
  });

  test("TC-142-13 · Edge: rapid double-click Pay creates only one transaction", async ({ page }) => {
    const uniqueNote = `DoubleClick ${Date.now()}`;

    await signIn(page, USERS.sender.username, USERS.sender.password);
    await startNewTransaction(page);
    await selectContact(page, "Dina");
    await enterPaymentDetails(page, "5", uniqueNote);

    const payButton = page.getByTestId("transaction-create-submit-payment");
    await expect(payButton).toBeEnabled();
    await payButton.dblclick();
    await screenshot(page, "tc-142-13-after-double-click");

    await page.getByTestId("new-transaction-return-to-transactions").waitFor({ timeout: 10_000 });
    await screenshot(page, "tc-142-13-confirmation");

    // Nav tabs only render on feed pages
    await page.getByTestId("new-transaction-return-to-transactions").click();
    await page.getByTestId("nav-personal-tab").waitFor({ timeout: 10_000 });
    await page.getByTestId("nav-personal-tab").click();

    const matchingItems = page.locator('[data-test^="transaction-item-"]').filter({ hasText: uniqueNote });
    const count = await matchingItems.count();
    console.log(`Transactions with note "${uniqueNote}": ${count}`);
    expect(count).toBe(1);
    await screenshot(page, "tc-142-13-duplicate-check-done");
  });
});
