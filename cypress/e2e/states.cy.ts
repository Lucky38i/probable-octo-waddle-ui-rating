// Smoke tests for each state through the real service-worker mocks, plus colour-contrast
// checks that jest-axe can't run in jsdom. Detailed state/ARIA assertions live in
// ProductRatingCard.test.tsx and RatingEmpty.test.tsx.
describe('Product rating – loading, error and empty states', () => {
  it('shows a loading skeleton until the rating arrives', () => {
    cy.visitRating('slow')

    cy.get('article').should('have.attr', 'aria-busy', 'true')
    cy.get('[data-testid="rating-skeleton"]').should('be.visible')

    cy.contains('h2', 'Excellent', { timeout: 5000 }).should('be.visible')
    cy.get('[data-testid="rating-skeleton"]').should('not.exist')
  })

  it('shows an accessible error message when the request fails', () => {
    cy.visitRating('error')

    cy.get('[role="alert"]')
      .should('be.visible')
      .and('contain.text', 'We couldn’t load the product rating.')
    cy.contains('button', 'Try again').should('be.visible')
    cy.checkAccessibility()
  })

  it('recovers when the user retries after a failure', () => {
    cy.visitRating('error')
    cy.get('[role="alert"]').should('be.visible')
    cy.useMockScenario('success')

    cy.contains('button', 'Try again').click()

    cy.get('article').should('have.focus')
    cy.contains('h2', 'Excellent').should('be.visible')
    cy.get('button[data-rating-row]').should('have.length', 5)
  })

  it('keeps showing the error if the retry also fails', () => {
    cy.visitRating('error')

    cy.contains('button', 'Try again').click()

    cy.get('[role="alert"]').should('be.visible')
    cy.contains('button', 'Try again').should('be.visible')
  })

  it('lets keyboard users retry', () => {
    cy.visitRating('error')
    cy.get('[role="alert"]').should('be.visible')
    cy.useMockScenario('success')

    cy.press(Cypress.Keyboard.Keys.TAB)
    cy.focused().should('contain.text', 'Try again')
    cy.realPress('Enter')

    cy.contains('h2', 'Excellent').should('be.visible')
  })

  it('shows an accessible "no reviews yet" state', () => {
    cy.visitRating('no-reviews')
    cy.findCard()

    cy.contains('h2', 'No reviews yet').should('be.visible')
    cy.contains('This product hasn’t been rated yet.').should('be.visible')
    cy.checkAccessibility()
  })
})
