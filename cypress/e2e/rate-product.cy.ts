// End-to-end journeys for rating the product: real clicks, hover, native radio keyboard
// behaviour, reloads (localStorage persistence) and colour contrast. Form states, API
// payloads and re-rating maths are unit tested in RateProduct.test.tsx,
// ProductRatingCard.test.tsx, productRating.test.ts and applyUserRating.test.ts.
const starOption = (stars: number) => cy.get(`[data-star-option="${stars}"]`)
const starRadio = (stars: number) => starOption(stars).find('input[type="radio"]')
const submitButton = () => cy.contains('button', /Submit rating|Update rating|Submitting/)
const submissionStatus = () => cy.get('[data-testid="rating-submission-status"]')
const filledStars = () =>
  cy
    .get('[data-star-option]')
    .then(($options) => [...$options].filter((option) => option.dataset.filled === 'true').length)

const rate = (stars: number) => {
  starOption(stars).click()
  submitButton().click()
  submissionStatus().should('contain.text', 'Thanks!')
}

describe('Product rating – rating the product', () => {
  beforeEach(() => {
    cy.visitRating()
    cy.findCard()
  })

  it('submits a rating, confirms it and updates the breakdown', () => {
    starOption(4).click()
    submitButton().click()

    submissionStatus()
      .should('be.visible')
      .and('have.text', 'Thanks! Your 4-star rating has been submitted.')
    cy.getRatingRow(4).should('have.attr', 'aria-label', '4 stars, 172 reviews')
    submitButton().should('have.text', 'Update rating')
  })

  it('remembers the rating after a reload', () => {
    rate(5)

    cy.reload()
    cy.findCard()

    starRadio(5).should('be.checked')
    submissionStatus().should('have.text', 'You rated this product 5 stars.')
    cy.getRatingRow(5).should('have.attr', 'aria-label', '5 stars, 953 reviews')
    submitButton().should('have.text', 'Update rating')
  })

  it('previews the rating on hover', () => {
    starOption(3).realHover()
    filledStars().should('equal', 3)

    cy.contains('h2', 'Excellent').realHover()
    filledStars().should('equal', 0)
    starRadio(3).should('not.be.checked')
  })

  it('can be rated with the keyboard alone', () => {
    starRadio(1).focus()
    cy.realPress('Space')
    cy.realPress('ArrowRight')
    cy.realPress('ArrowRight')
    starRadio(3).should('be.checked').and('have.focus')

    cy.realPress('Tab')
    submitButton().should('have.focus')
    cy.realPress('Enter')

    submissionStatus().should('have.text', 'Thanks! Your 3-star rating has been submitted.')
  })

  it('shows a visible focus indicator on the star options', () => {
    starRadio(2).focus()
    cy.realPress('ArrowRight')

    starOption(3).should('have.css', 'outline-style', 'solid')
  })

  it('stays accessible after submitting', () => {
    rate(4)
    cy.checkAccessibility()
  })
})

describe('Product rating – failed submission', () => {
  it('shows an error and succeeds on retry', () => {
    cy.visitRating('submit-error')
    cy.findCard()

    starOption(3).click()
    submitButton().click()

    cy.get('[role="alert"]')
      .should('be.visible')
      .and('contain.text', 'We couldn’t submit your rating. Please try again.')
    cy.checkAccessibility()

    cy.useMockScenario('success')
    submitButton().click()

    cy.get('[role="alert"]').should('not.exist')
    submissionStatus().should('have.text', 'Thanks! Your 3-star rating has been submitted.')
    cy.getRatingRow(3).should('have.attr', 'aria-label', '3 stars, 56 reviews')
  })
})
