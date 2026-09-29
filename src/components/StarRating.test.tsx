import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { StarRating } from './StarRating'

describe('StarRating', () => {
  it('renders one tile per star with the correct fill', () => {
    render(<StarRating rating={4.6} />)

    const tiles = screen.getAllByTestId('star-tile')
    expect(tiles).toHaveLength(5)
    expect(tiles.map((tile) => tile.dataset.fill)).toEqual(['100', '100', '100', '100', '60'])
  })

  it('is hidden from assistive technology when no label is given', () => {
    render(<StarRating rating={3} />)

    expect(screen.getByTestId('star-rating')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('exposes an accessible image when labelled', async () => {
    const { container } = render(<StarRating rating={4.6} label="Rated 4.6 out of 5 stars" />)

    expect(screen.getByRole('img', { name: 'Rated 4.6 out of 5 stars' })).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('supports a custom max rating and class name', () => {
    render(<StarRating rating={2} maxRating={3} className="custom" />)

    expect(screen.getAllByTestId('star-tile')).toHaveLength(3)
    expect(screen.getByTestId('star-rating')).toHaveClass('custom')
  })
})
