const viewports = [
  { device: 'phone', preset: 'iphone-se2', width: 375, height: 667 },
  { device: 'small phone', preset: 'iphone-5', width: 320, height: 568 },
  { device: 'tablet', preset: 'ipad-2', width: 768, height: 1024 },
  { device: 'laptop', preset: 'macbook-13', width: 1280, height: 800 },
] as const

describe('Product rating – responsive layout', () => {
  viewports.forEach(({ device, preset, width }) => {
    describe(`on a ${device} (${width}px)`, () => {
      beforeEach(() => {
        cy.viewport(preset)
        cy.visitRating()
        cy.findCard()
      })

      it('renders the full rating summary', () => {
        cy.contains('h2', 'Excellent').should('be.visible')
        cy.contains('4.6 out of 5').should('be.visible')
        cy.contains('Product Rating').should('be.visible')
        cy.get('img[alt="feefo"]').should('be.visible')
        cy.get('[data-testid="star-tile"]').should('have.length', 5)
        cy.get('button[data-rating-row]').should('have.length', 5).and('be.visible')
      })

      it('fits within the viewport without horizontal scrolling', () => {
        cy.document().then((doc) => {
          expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth)
        })
        cy.get('article').then(($card) => {
          const { left, right } = $card[0]!.getBoundingClientRect()
          expect(left).to.be.at.least(0)
          expect(right).to.be.at.most(width)
        })
      })

      it('keeps the star tiles on a single row', () => {
        cy.get('[data-testid="star-tile"]').then(($tiles) => {
          const tops = [...$tiles].map((tile) => Math.round(tile.getBoundingClientRect().top))
          expect(new Set(tops).size).to.equal(1)
        })
      })

      it('provides touch targets of at least 40px for each rating row', () => {
        cy.get('button[data-rating-row]').each(($row) => {
          expect($row[0]!.getBoundingClientRect().height).to.be.at.least(40)
        })
      })

      it('uses the Poppins font', () => {
        cy.contains('h2', 'Excellent')
          .should('have.css', 'font-family')
          .and('match', /^Poppins/)
        cy.document().its('fonts').invoke('check', '600 16px Poppins').should('equal', true)
      })

      it('has no detectable accessibility violations', () => {
        cy.checkAccessibility()
      })
    })
  })
})
