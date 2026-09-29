import type { Result } from 'axe-core'

export type MockScenario =
  'success' | 'slow' | 'error' | 'no-average' | 'no-reviews' | 'submit-error'

declare global {
  interface Window {
    setMockScenario?: (scenario: MockScenario) => void
  }

  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Visit the app with an MSW mock scenario (see src/mocks/handlers.ts). */
      visitRating(scenario?: MockScenario): Chainable<void>
      /** Switch the MSW scenario for subsequent requests without reloading. */
      useMockScenario(scenario: MockScenario): Chainable<void>
      /** Run axe against the page and fail on any WCAG A/AA violation. */
      checkAccessibility(context?: string): Chainable<void>
      /** Wait for the rating card to finish loading. */
      findCard(): Chainable<JQuery<HTMLElement>>
      /** Get a rating breakdown row button by its star value. */
      getRatingRow(stars: number): Chainable<JQuery<HTMLButtonElement>>
    }
  }
}

Cypress.Commands.add('visitRating', (scenario: MockScenario = 'success') => {
  cy.visit(scenario === 'success' ? '/' : `/?mockScenario=${scenario}`)
})

const logViolations = (violations: Result[]) => {
  cy.task(
    'log',
    `${violations.length} accessibility violation${violations.length === 1 ? '' : 's'} detected`,
  )
  cy.task(
    'table',
    violations.map(({ id, impact, description, nodes }) => ({
      id,
      impact,
      description,
      nodes: nodes.length,
    })),
  )
}

Cypress.Commands.add('checkAccessibility', (context?: string) => {
  cy.injectAxe()
  cy.checkA11y(
    context,
    { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } },
    logViolations,
  )
})

Cypress.Commands.add('getRatingRow', (stars: number) =>
  cy.get<HTMLButtonElement>(`button[data-rating-row="${stars}"]`),
)

Cypress.Commands.add('findCard', () =>
  cy.get('article[aria-label="Product rating"]').should('have.attr', 'aria-busy', 'false'),
)

Cypress.Commands.add('useMockScenario', (scenario: MockScenario) => {
  cy.window().its('setMockScenario').should('be.a', 'function')
  cy.window().then((win) => {
    win.setMockScenario?.(scenario)
  })
})
