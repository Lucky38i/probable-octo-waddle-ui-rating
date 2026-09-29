# Feefo Product Rating

A responsive, accessible product-rating widget built with React 19, TypeScript and Tailwind CSS v4, using the Poppins Google Font.

## Requirements

- Node.js 24 LTS (`nvm use` reads `.nvmrc`)
- npm 10+

## Getting started

```bash
nvm use
npm install
npm run dev        # http://localhost:5173
```

## Scripts

| Script                  | Description                                               |
| ----------------------- | --------------------------------------------------------- |
| `npm run dev`           | Start the Vite dev server                                 |
| `npm run build`         | Type-check and build for production                       |
| `npm run preview`       | Preview the production build                              |
| `npm run typecheck`     | Type-check app, tests, Cypress and config                 |
| `npm run lint`          | ESLint (TypeScript, React Hooks, jsx-a11y, Cypress rules) |
| `npm run format`        | Format with Prettier (+ Tailwind class sorting)           |
| `npm test`              | Jest unit tests                                           |
| `npm run test:coverage` | Jest with coverage (90% threshold)                        |
| `npm run test:e2e`      | Start the dev server and run Cypress headlessly           |
| `npm run test:e2e:open` | Start the dev server and open the Cypress runner          |
| `npm run validate`      | Typecheck, lint, format check, unit and e2e tests         |

## Project structure

```
src/
  api/          fetch client, API base URL config + runtime response validation
  hooks/        useProductRating (loading / success / error + retry)
  components/   ProductRatingCard, RatingSummary, RatingEmpty, RateProduct, StarRating,
                RatingBreakdown, RatingBreakdownRow, RatingSkeleton, RatingError,
                FeefoAttribution
  mocks/        MSW handlers, mock data, mock backend logic (applyUserRating,
                userRatingStore) and browser worker
  utils/        pure rating helpers
  test/         Jest setup, MSW node server, polyfills
cypress/
  e2e/          responsive, interactivity, rating submission and loading/error/empty state specs
  support/      custom commands (visitRating, useMockScenario, checkAccessibility…)
```

## Configuration

Settings are Vite environment variables. The defaults are committed in `.env`; override them in `.env.local` (git-ignored), in an environment-specific file such as `.env.production.local`, or as real environment variables when building (e.g. in CI), which take precedence over the files.

| Variable            | Default   | Description                                                                                                              |
| ------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------ |
| `VITE_API_BASE_URL` | `/api`    | Base URL the endpoints below are appended to. `/api` means the same origin as the app; e.g. `https://api.example.com/v1` |
| `VITE_API_MOCKING`  | `enabled` | Set to `disabled` to call the real API instead of MSW                                                                    |

These values are inlined at build time, so each environment needs its own build, e.g. `VITE_API_BASE_URL=https://api.example.com/v1 VITE_API_MOCKING=disabled npm run build`. They end up in the browser bundle, so don't put secrets in them. If the API is on a different origin, it has to allow the app's origin via CORS.

## Mock API

There's no backend yet. [MSW](https://mswjs.io) mocks these endpoints in the browser (and in Jest via `msw/node`). Set `VITE_API_MOCKING=disabled` in `.env.local` to use a real API. Paths are relative to `VITE_API_BASE_URL` (shown with the default `/api`).

| Endpoint                              | Description                                                                                                        |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `GET /api/product-rating`             | The rating summary, including the current user's `userRating` (or `null`)                                          |
| `PUT /api/product-rating/user-rating` | Body `{ "stars": 1–5 }`. Creates or replaces the user's rating and returns the updated summary. Invalid body → 400 |

The mock backend keeps everyone else's ratings fixed and adds the user's rating on top, so changing your rating moves it from one star count to another instead of adding a second rating. It's stored in `localStorage` under `feefo-demo:user-rating`, so it survives a reload. Clear that key (or site data) to start again.

You can preview other states in the browser with a query string:

- `/?mockScenario=slow` shows the loading state (1.5 s delay)
- `/?mockScenario=error` shows the error state and retry button
- `/?mockScenario=no-average` returns no `averageRating`, so the UI calculates it (3.8, "Good")
- `/?mockScenario=no-reviews` shows the "No reviews yet" state
- `/?mockScenario=submit-error` makes submitting a rating fail

## Average rating

The heading ("Excellent", "Good", …), the star fill and the "x out of 5" text all come from the average rating, which is resolved in the API layer (`toProductRating`):

1. If the API sends an `averageRating` between 0 and `maxRating`, it's used as-is, because the backend may weight or filter reviews.
2. Otherwise (missing, `null` or out of range), it's calculated from the breakdown: the sum of `stars × count` divided by the total number of reviews.
3. The result is rounded to one decimal place, so the label, stars and text always agree.

If the product has no reviews at all, the card shows a "No reviews yet" message with empty stars instead of a misleading "Bad, 0.0 out of 5". This happens even if the API sends an average.

| Average    | Heading   |
| ---------- | --------- |
| 4.5 – 5    | Excellent |
| 3.5 – 4.49 | Good      |
| 2.5 – 3.49 | Average   |
| 1.5 – 2.49 | Poor      |
| below 1.5  | Bad       |

## Interactivity

- **Rating rows** are toggle buttons (`aria-pressed`). Selecting one highlights it, dims the other bars, calls `onRatingSelect`, and announces the change through a polite live region.
- **Keyboard:** Tab moves into the rows, Enter/Space toggles a row, ↑/↓ move between rows (wrapping), and Home/End jump to the first or last row.
- **Tooltips** show each rating's share of reviews. They appear on hover or keyboard focus, stay open while hovered, and can be dismissed with Escape (WCAG 1.4.13). They're linked to their row via `aria-describedby`.
- **Rating the product:** the "Rate this product" form under the summary (and under the empty state) uses native radio buttons in a labelled fieldset, so arrow keys, Tab and screen readers work out of the box. Hovering previews a rating without selecting it. **Submit rating** is enabled once a new rating is chosen and shows "Submitting…" while the request is in flight. A green confirmation ("Thanks! Your 4-star rating has been submitted.") is announced via `role="status"`, and the breakdown, average and heading update with the response. If you've already rated, the form shows "You rated this product 4 stars." and the button becomes **Update rating**. Failures are announced with `role="alert"` and keep your selection so you can try again.
- **Loading and error:** the card sets `aria-busy`, shows a `role="status"` skeleton while loading, and a `role="alert"` message with a retry button on failure. Focus moves back to the card when you retry.

## Testing approach

The two test suites have separate jobs, so each behaviour is checked in one place:

- **Jest (unit and component tests)** covers logic, rendering and ARIA: calculations, API parsing and payloads, the mock backend, component states, accessible names, selection, arrow-key navigation, and error handling.
- **Cypress (end-to-end)** covers what needs a real browser: layout at each screen size, fonts, visible focus rings, CSS-driven visibility (tooltips, hover preview), native keyboard activation, reload persistence, and colour contrast. It also runs one smoke test per main user journey.

## Accessibility testing

- **Unit:** `jest-axe` checks components in their loaded and error states.
- **E2E:** `cypress-axe` runs the WCAG 2.2 AA rules at phone, small-phone, tablet and laptop sizes, including colour contrast.
- **Real input:** `cypress-real-events` provides native key presses and hover, so Enter/Space activation and hover behave as they do in a real browser.

## Tooling notes

- Jest runs with `--experimental-vm-modules` because MSW 3 is ESM-only. `jest-fixed-jsdom` plus a `setImmediate` polyfill allow MSW's Node interceptors to work under jsdom.
- TypeScript stays on 6.0 until `typescript-eslint` supports TypeScript 7.
- `eslint-plugin-jsx-a11y-x` (an e18e fork) replaces `eslint-plugin-jsx-a11y`, which doesn't support ESLint 10 yet.
- Cypress stays on 15 because `cypress-axe` doesn't declare support for Cypress 16 yet.
