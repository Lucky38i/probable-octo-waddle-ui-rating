import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { RatingEmpty } from './RatingEmpty'

describe('RatingEmpty', () => {
  it('explains that the product has no reviews yet', () => {
    render(<RatingEmpty maxRating={5} />)

    expect(screen.getByRole('heading', { level: 2, name: 'No reviews yet' })).toBeInTheDocument()
    expect(
      screen.getByText('This product hasn’t been rated yet. Be the first to rate it below.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'feefo' })).toBeInTheDocument()
  })

  it('shows empty, decorative stars for the maximum rating', () => {
    render(<RatingEmpty maxRating={5} />)

    expect(screen.getByTestId('star-rating')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getAllByTestId('star-tile').map((tile) => tile.dataset.fill)).toEqual([
      '0',
      '0',
      '0',
      '0',
      '0',
    ])
  })

  it('does not show a score, label or breakdown', () => {
    render(<RatingEmpty maxRating={5} />)

    expect(screen.queryByText(/out of/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/excellent|good|average|poor|bad/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<RatingEmpty maxRating={5} />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
