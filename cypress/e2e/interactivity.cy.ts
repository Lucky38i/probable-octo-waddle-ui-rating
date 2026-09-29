// Covers behaviour that needs a real browser (native key activation, real hover, CSS
// visibility, :focus-visible, colour contrast). Selection logic, arrow-key navigation and
// ARIA naming are unit tested in RatingBreakdown(.Row).test.tsx.
describe('Product rating – interactivity', () => {
  beforeEach(() => {
    cy.visitRating()
    cy.findCard()
  })

  describe('selecting a rating', () => {
    it('toggles a rating row with the mouse', () => {
      cy.getRatingRow(5).click()
      cy.getRatingRow(5).should('have.attr', 'aria-pressed', 'true')

      cy.getRatingRow(5).click()
      cy.getRatingRow(5).should('have.attr', 'aria-pressed', 'false')
    })

    it('remains accessible while a rating is selected', () => {
      cy.getRatingRow(3).click()
      cy.checkAccessibility()
    })

    it('does not leave a tooltip open after a mouse click once the pointer moves away', () => {
      cy.getRatingRow(2).realClick()
      cy.contains('h2', 'Excellent').realHover()
      cy.getRatingRow(2)
        .invoke('attr', 'aria-describedby')
        .then((id) => cy.get(`[id="${id}"]`).should('not.be.visible'))
    })
  })

  describe('keyboard support', () => {
    it('reaches the first rating row with Tab and toggles it with Enter and Space', () => {
      cy.press(Cypress.Keyboard.Keys.TAB)
      cy.focused().should('have.attr', 'data-rating-row', '5')

      // cy.press only sends keydown/keyup, so use native CDP key events for button activation.
      cy.realPress('Enter')
      cy.getRatingRow(5).should('have.attr', 'aria-pressed', 'true')

      cy.realPress('Space')
      cy.getRatingRow(5).should('have.attr', 'aria-pressed', 'false')
    })

    it('shows a visible focus indicator', () => {
      cy.press(Cypress.Keyboard.Keys.TAB)
      cy.focused().should('have.css', 'outline-style', 'solid')
    })
  })

  describe('tooltips', () => {
    const tooltipFor = (stars: number) =>
      cy
        .getRatingRow(stars)
        .invoke('attr', 'aria-describedby')
        .then((id) => cy.get(`[id="${id}"]`))

    it('shows the share of reviews on hover and hides it on mouse out', () => {
      tooltipFor(5).should('not.be.visible')

      cy.getRatingRow(5).realHover()
      tooltipFor(5).should('be.visible').and('have.text', '77% of reviews')

      cy.contains('h2', 'Excellent').realHover()
      tooltipFor(5).should('not.be.visible')
    })

    it('shows on keyboard focus and can be dismissed with Escape', () => {
      cy.press(Cypress.Keyboard.Keys.TAB)
      tooltipFor(5).should('be.visible')

      cy.press(Cypress.Keyboard.Keys.ESC)
      tooltipFor(5).should('not.be.visible')

      cy.press(Cypress.Keyboard.Keys.DOWN)
      tooltipFor(4).should('be.visible')
    })
  })
})
