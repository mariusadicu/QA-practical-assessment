# E2E Tests — RWA-142 · Send Money to a Contact

Playwright + TypeScript tests covering the Send Money flow (RWA-142) and Sign In (RWA-118).

## Prerequisites

- Node.js (use the repo's `.nvmrc` version: `nvm use`)
- App running locally: `yarn dev` (frontend at http://localhost:3000, API at http://localhost:3001)
- Fresh seed data: `yarn db:seed:dev`

## Install

From the project root:

```bash
cd e2e
npm install
npx playwright install chromium
```

Or from the project root, the `package.json` `test:e2e` script handles it:

```bash
yarn test:e2e
```

## Run Tests

```bash
# From project root (runs via package.json script)
yarn test:e2e

# Or directly from e2e/ folder
cd e2e
npx playwright test

# Run a specific test file
npx playwright test tests/send-money.spec.ts

# Run with UI mode (interactive)
npx playwright test --ui

# Run headed (see browser)
npx playwright test --headed
```

## Screenshots

Screenshots are saved automatically to `e2e/screenshots/` during each test run. Each meaningful step produces a named screenshot:

- `Katharina_Bernier-01-sign-in-page.png`
- `Katharina_Bernier-02-credentials-entered.png`
- `Katharina_Bernier-03-home-page.png`
- `contact-search-results-Devontae.png`
- `confirmation-screen.png`
- etc.

## Test Structure

```
e2e/
  tests/
    send-money.spec.ts     # RWA-142: Send money happy path + edge cases
  screenshots/             # Auto-generated per test run
  playwright.config.ts     # Playwright configuration
  README.md                # This file
```

## AI Usage

See `AI-USAGE.md` in the repo root for details on how AI tools were used in this assessment.
