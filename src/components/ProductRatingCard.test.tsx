import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { mockProductRating } from '../mocks/data'
import { productRatingHandlers } from '../mocks/handlers'
import { server } from '../test/server'
import { ProductRatingCard } from './ProductRatingCard'

const findSummaryHeading = () => screen.findByRole('heading', { level: 2, name: 'Excellent' })
const getBreakdownRows = () =>
  screen.getAllByRole('button').filter((button) => button.hasAttribute('data-rating-row'))

describe('ProductRatingCard', () => {
  it('shows an accessible loading state while fetching', async () => {
    render(<ProductRatingCard />)

    const card = screen.getByRole('article', { name: 'Product rating' })
    expect(card).toHaveAttribute('aria-busy', 'true')
    expect(within(card).getByRole('status')).toHaveTextContent('Loading product rating…')
    expect(screen.getByTestId('rating-skeleton')).toHaveAttribute('aria-hidden', 'true')

    await findSummaryHeading()
    expect(card).toHaveAttribute('aria-busy', 'false')
  })

  it('renders the rating summary from the API', async () => {
    render(<ProductRatingCard />)

    expect(await findSummaryHeading()).toBeInTheDocument()
    expect(screen.getByText(/4\.6 out of 5/)).toBeInTheDocument()
    expect(screen.getByText('Product Rating')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'feefo' })).toBeInTheDocument()
    expect(screen.getAllByTestId('star-tile').map((tile) => tile.dataset.fill)).toEqual([
      '100',
      '100',
      '100',
      '100',
      '60',
    ])
    expect(getBreakdownRows().map((button) => button.textContent)).toEqual([
      '5952',
      '4171',
      '355',
      '214',
      '140',
    ])
  })

  it('renders a calculated average when the API does not send one', async () => {
    server.use(...productRatingHandlers.withoutAverage)
    render(<ProductRatingCard />)

    expect(await screen.findByRole('heading', { level: 2, name: 'Good' })).toBeInTheDocument()
    expect(screen.getByText(/3\.8 out of 5/)).toBeInTheDocument()
    expect(screen.getAllByTestId('star-tile').map((tile) => tile.dataset.fill)).toEqual([
      '100',
      '100',
      '100',
      '80',
      '0',
    ])
    expect(screen.getByRole('button', { name: '5 stars, 120 reviews' })).toBeInTheDocument()
  })

  it('shows a "no reviews yet" state when the product has no reviews', async () => {
    server.use(...productRatingHandlers.noReviews)
    render(<ProductRatingCard />)

    expect(
      await screen.findByRole('heading', { level: 2, name: 'No reviews yet' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('article')).toHaveAttribute('aria-busy', 'false')
    expect(screen.queryByText(/out of 5/)).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Bad' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /stars?, \d+ reviews?/ })).not.toBeInTheDocument()
    expect(screen.getByRole('form', { name: 'Rate this product' })).toBeInTheDocument()
  })

  it('shows the empty state even if the API sends an average with no reviews', async () => {
    const fetcher = jest.fn().mockResolvedValue({
      averageRating: 4.5,
      maxRating: 5,
      breakdown: [{ stars: 5, count: 0 }],
    })
    render(<ProductRatingCard fetcher={fetcher} />)

    expect(await screen.findByRole('heading', { name: 'No reviews yet' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Excellent' })).not.toBeInTheDocument()
  })

  it('shows the empty state when the breakdown is empty', async () => {
    const fetcher = jest.fn().mockResolvedValue({ averageRating: 0, maxRating: 5, breakdown: [] })
    render(<ProductRatingCard fetcher={fetcher} />)

    expect(await screen.findByRole('heading', { name: 'No reviews yet' })).toBeInTheDocument()
  })

  describe('rating the product', () => {
    const rateProduct = async (user: ReturnType<typeof userEvent.setup>, stars: number) => {
      await user.click(screen.getByRole('radio', { name: new RegExp(`^${stars} stars?,`) }))
      await user.click(screen.getByRole('button', { name: /(submit|update) rating/i }))
      await screen.findByText(/^Thanks!/)
    }

    it('adds the submitted rating to the breakdown', async () => {
      const user = userEvent.setup()
      render(<ProductRatingCard />)
      await findSummaryHeading()

      await rateProduct(user, 4)

      expect(screen.getByRole('button', { name: '4 stars, 172 reviews' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /(submit|update) rating/i })).toHaveTextContent(
        'Update rating',
      )
    })

    it('replaces an earlier rating when the user changes it', async () => {
      const user = userEvent.setup()
      render(<ProductRatingCard />)
      await findSummaryHeading()

      await rateProduct(user, 4)
      await rateProduct(user, 2)

      expect(screen.getByRole('button', { name: '4 stars, 171 reviews' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '2 stars, 15 reviews' })).toBeInTheDocument()
      expect(screen.getByTestId('rating-submission-status')).toHaveTextContent(
        'Thanks! Your rating has been updated to 2 stars.',
      )
    })

    it('turns the empty state into a summary after the first rating', async () => {
      const user = userEvent.setup()
      server.use(...productRatingHandlers.noReviews)
      render(<ProductRatingCard />)
      await screen.findByRole('heading', { name: 'No reviews yet' })

      await rateProduct(user, 5)

      expect(screen.getByRole('heading', { level: 2, name: 'Excellent' })).toBeInTheDocument()
      expect(screen.getByText(/5\.0 out of 5/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '5 stars, 1 review' })).toBeInTheDocument()
      expect(screen.getByTestId('rating-submission-status')).toHaveTextContent(
        'Thanks! Your 5-star rating has been submitted.',
      )
    })

    it('shows the rating saved on a previous visit', async () => {
      localStorage.setItem('feefo-demo:user-rating', '3')
      render(<ProductRatingCard />)
      await findSummaryHeading()

      expect(screen.getByRole('radio', { name: /^3 stars,/ })).toBeChecked()
      expect(screen.getByTestId('rating-submission-status')).toHaveTextContent(
        'You rated this product 3 stars.',
      )
      expect(screen.getByRole('button', { name: '3 stars, 56 reviews' })).toBeInTheDocument()
    })

    it('keeps the existing data when submitting fails', async () => {
      const user = userEvent.setup()
      server.use(...productRatingHandlers.submitError)
      render(<ProductRatingCard />)
      await findSummaryHeading()

      await user.click(screen.getByRole('radio', { name: /^4 stars,/ }))
      await user.click(screen.getByRole('button', { name: 'Submit rating' }))

      expect(await screen.findByRole('alert')).toHaveTextContent('We couldn’t submit your rating.')
      expect(screen.getByRole('button', { name: '4 stars, 171 reviews' })).toBeInTheDocument()
    })

    it('uses a custom submitter when provided', async () => {
      const user = userEvent.setup()
      const submitRating = jest.fn().mockResolvedValue({ ...mockProductRating, userRating: 1 })
      render(<ProductRatingCard submitRating={submitRating} />)
      await findSummaryHeading()

      await rateProduct(user, 1)

      expect(submitRating).toHaveBeenCalledWith(1, expect.any(AbortSignal))
    })

    it('has no accessibility violations after submitting', async () => {
      const user = userEvent.setup()
      const { container } = render(<ProductRatingCard />)
      await findSummaryHeading()

      await rateProduct(user, 4)

      expect(await axe(container)).toHaveNoViolations()
    })
  })

  it('has no accessibility violations once loaded', async () => {
    const { container } = render(<ProductRatingCard />)
    await findSummaryHeading()

    expect(await axe(container)).toHaveNoViolations()
  })

  it('shows an error with a working retry button', async () => {
    const user = userEvent.setup()
    let resolveRetry: (value: typeof mockProductRating) => void = () => {}
    const fetcher = jest
      .fn<Promise<typeof mockProductRating>, [AbortSignal]>()
      .mockRejectedValueOnce(new Error('Network down'))
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveRetry = resolve
          }),
      )
    render(<ProductRatingCard fetcher={fetcher} />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We couldn’t load the product rating.',
    )

    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(screen.getByRole('article')).toHaveFocus()
    expect(screen.getByRole('status')).toHaveTextContent('Loading product rating…')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    act(() => resolveRetry(mockProductRating))
    expect(await findSummaryHeading()).toBeInTheDocument()
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('recovers from a server error on retry', async () => {
    const user = userEvent.setup()
    server.use(...productRatingHandlers.errorOnce)
    render(<ProductRatingCard />)

    await user.click(await screen.findByRole('button', { name: 'Try again' }))

    expect(await findSummaryHeading()).toBeInTheDocument()
  })

  it('has no accessibility violations in the error state', async () => {
    server.use(...productRatingHandlers.error)
    const { container } = render(<ProductRatingCard />)
    await screen.findByRole('alert')

    expect(await axe(container)).toHaveNoViolations()
  })

  it('announces and reports rating selection changes', async () => {
    const user = userEvent.setup()
    const onRatingSelect = jest.fn()
    render(<ProductRatingCard onRatingSelect={onRatingSelect} />)
    await findSummaryHeading()
    const announcer = screen.getByTestId('rating-announcer')
    expect(announcer).toHaveAttribute('aria-live', 'polite')
    expect(announcer).toBeEmptyDOMElement()

    await user.click(screen.getByRole('button', { name: /^5 stars/ }))
    expect(onRatingSelect).toHaveBeenLastCalledWith(5)
    expect(announcer).toHaveTextContent('Showing 952 5-star reviews')

    await user.click(screen.getByRole('button', { name: /^1 star/ }))
    expect(announcer).toHaveTextContent('Showing 40 1-star reviews')

    await user.click(screen.getByRole('button', { name: /^1 star/ }))
    expect(onRatingSelect).toHaveBeenLastCalledWith(null)
    expect(announcer).toHaveTextContent('Showing all reviews')
  })

  it('accepts a custom fetcher', async () => {
    const fetcher = jest.fn().mockResolvedValue({
      averageRating: 2.2,
      maxRating: 5,
      breakdown: [
        { stars: 2, count: 1 },
        { stars: 1, count: 0 },
      ],
    })
    const user = userEvent.setup()
    render(<ProductRatingCard fetcher={fetcher} className="extra" />)

    expect(await screen.findByRole('heading', { name: 'Poor' })).toBeInTheDocument()
    expect(screen.getByRole('article')).toHaveClass('extra')

    await user.click(screen.getByRole('button', { name: '1 star, 0 reviews' }))
    await waitFor(() =>
      expect(screen.getByTestId('rating-announcer')).toHaveTextContent('Showing 0 1-star reviews'),
    )
  })
})
