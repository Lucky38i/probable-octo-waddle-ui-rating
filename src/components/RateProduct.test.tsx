import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { mockProductRating } from '../mocks/data'
import type { ProductRating, StarValue } from '../types/rating'
import { RateProduct, type UserRatingSubmitter } from './RateProduct'

type Deferred = { resolve: (value: ProductRating) => void; reject: (reason: unknown) => void }

const setup = ({
  userRating = null,
  submitRating = jest.fn<Promise<ProductRating>, [StarValue, AbortSignal]>((stars) =>
    Promise.resolve({ ...mockProductRating, userRating: stars }),
  ),
}: {
  userRating?: StarValue | null
  submitRating?: jest.MockedFunction<UserRatingSubmitter>
} = {}) => {
  const onRated = jest.fn()
  const user = userEvent.setup()
  const utils = render(
    <RateProduct userRating={userRating} submitRating={submitRating} onRated={onRated} />,
  )
  return { ...utils, user, onRated, submitRating }
}

/** A submitter whose promise the test settles manually, to inspect the in-flight state. */
const deferredSubmitter = () => {
  const deferred: Deferred = { resolve: () => {}, reject: () => {} }
  const submitRating = jest.fn<Promise<ProductRating>, [StarValue, AbortSignal]>(
    () =>
      new Promise((resolve, reject) => {
        deferred.resolve = resolve
        deferred.reject = reject
      }),
  )
  return { deferred, submitRating }
}

const radio = (stars: number) =>
  screen.getByRole('radio', { name: new RegExp(`^${stars} stars?,`) })
const submitButton = () => screen.getByRole('button', { name: /rating|submitting/i })
const statusMessage = () => screen.getByTestId('rating-submission-status')
const filledStars = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLElement>('[data-star-option]')]
    .filter((option) => option.dataset.filled === 'true')
    .map((option) => option.dataset.starOption)

describe('RateProduct', () => {
  it('renders a labelled form with five labelled star radios', () => {
    setup()

    expect(screen.getByRole('form', { name: 'Rate this product' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Rate this product' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(5)
    expect(radio(1)).toHaveAccessibleName('1 star, Bad')
    expect(radio(5)).toHaveAccessibleName('5 stars, Excellent')
    screen.getAllByRole('radio').forEach((input) => expect(input).not.toBeChecked())
  })

  it('disables the submit button until a star is chosen', async () => {
    const { user } = setup()

    expect(submitButton()).toHaveTextContent('Submit rating')
    expect(submitButton()).toBeDisabled()
    expect(screen.getByText('Select a rating')).toBeInTheDocument()

    await user.click(radio(4))

    expect(radio(4)).toBeChecked()
    expect(submitButton()).toBeEnabled()
    expect(screen.getByText('Good')).toBeInTheDocument()
  })

  it('supports choosing a rating with the arrow keys', async () => {
    const { user } = setup()

    await user.click(radio(2))
    await user.keyboard('{ArrowRight}')

    expect(radio(3)).toBeChecked()
    expect(radio(3)).toHaveFocus()
  })

  it('submits the chosen rating and confirms it', async () => {
    const { user, submitRating, onRated } = setup()

    await user.click(radio(4))
    await user.click(submitButton())

    expect(submitRating).toHaveBeenCalledWith(4, expect.any(AbortSignal))
    expect(onRated).toHaveBeenCalledWith({ ...mockProductRating, userRating: 4 })
    expect(statusMessage()).toHaveTextContent('Thanks! Your 4-star rating has been submitted.')
  })

  it('shows a busy state while submitting', async () => {
    const { deferred, submitRating } = deferredSubmitter()
    const { user, container } = setup({ submitRating })

    await user.click(radio(3))
    await user.click(submitButton())

    expect(submitButton()).toHaveTextContent('Submitting…')
    expect(submitButton()).toBeDisabled()
    expect(screen.getByRole('group')).toBeDisabled()
    expect(container.querySelector('form')).toHaveAttribute('aria-busy', 'true')
    expect(statusMessage()).toHaveTextContent('Submitting your rating…')

    await act(async () => deferred.resolve({ ...mockProductRating, userRating: 3 }))

    expect(container.querySelector('form')).toHaveAttribute('aria-busy', 'false')
  })

  it('shows the saved rating and offers to update it', () => {
    setup({ userRating: 4 })

    expect(radio(4)).toBeChecked()
    expect(statusMessage()).toHaveTextContent('You rated this product 4 stars.')
    expect(submitButton()).toHaveTextContent('Update rating')
    expect(submitButton()).toBeDisabled()
  })

  it('confirms an updated rating and clears the confirmation on a new choice', async () => {
    const { user, submitRating, rerender, onRated } = setup({ userRating: 4 })

    await user.click(radio(1))
    expect(submitButton()).toBeEnabled()
    await user.click(submitButton())

    expect(submitRating).toHaveBeenCalledWith(1, expect.any(AbortSignal))
    expect(statusMessage()).toHaveTextContent('Thanks! Your rating has been updated to 1 star.')

    // The parent passes the saved rating back down.
    rerender(<RateProduct userRating={1} submitRating={submitRating} onRated={onRated} />)
    expect(submitButton()).toBeDisabled()

    await user.click(radio(5))
    expect(statusMessage()).toHaveTextContent('You rated this product 1 star.')
  })

  it('shows an error and lets the user try again', async () => {
    const submitRating = jest
      .fn<Promise<ProductRating>, [StarValue, AbortSignal]>()
      .mockRejectedValueOnce(new Error('Server error'))
      .mockResolvedValueOnce({ ...mockProductRating, userRating: 2 })
    const { user, onRated } = setup({ submitRating })

    await user.click(radio(2))
    await user.click(submitButton())

    expect(screen.getByRole('alert')).toHaveTextContent(
      'We couldn’t submit your rating. Please try again.',
    )
    expect(radio(2)).toBeChecked()
    expect(onRated).not.toHaveBeenCalled()

    await user.click(submitButton())

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(statusMessage()).toHaveTextContent('Thanks! Your 2-star rating has been submitted.')
  })

  it('does not submit without a changed selection', () => {
    const { submitRating, container } = setup({ userRating: 3 })

    fireEvent.submit(container.querySelector('form')!)

    expect(submitRating).not.toHaveBeenCalled()
  })

  it('previews a rating on hover without selecting it', async () => {
    const { user, container } = setup({ userRating: 2 })
    const [threeStarOption] = container.querySelectorAll('[data-star-option="3"]')

    await user.hover(threeStarOption!)
    expect(filledStars(container)).toEqual(['1', '2', '3'])
    expect(screen.getByText('Average')).toBeInTheDocument()
    expect(radio(2)).toBeChecked()

    await user.unhover(threeStarOption!)
    expect(filledStars(container)).toEqual(['1', '2'])
  })

  it('ignores hovering between stars and drops the preview on keyboard focus', async () => {
    const { user, container } = setup()
    const group = container.querySelector('[role="presentation"]')!

    fireEvent.mouseOver(group)
    expect(filledStars(container)).toEqual([])

    await user.hover(container.querySelector('[data-star-option="5"]')!)
    expect(filledStars(container)).toHaveLength(5)

    fireEvent.focus(radio(1))
    expect(filledStars(container)).toEqual([])
  })

  it('aborts an in-flight submission and ignores its result after unmount', async () => {
    const { deferred, submitRating } = deferredSubmitter()
    const { user, unmount, onRated } = setup({ submitRating })

    await user.click(radio(5))
    await user.click(submitButton())
    const signal = submitRating.mock.calls[0]![1]
    unmount()

    expect(signal.aborted).toBe(true)
    await act(async () => deferred.resolve(mockProductRating))
    expect(onRated).not.toHaveBeenCalled()
  })

  it('ignores a failure from an aborted submission', async () => {
    const { deferred, submitRating } = deferredSubmitter()
    const { user, unmount } = setup({ submitRating })

    await user.click(radio(5))
    await user.click(submitButton())
    unmount()

    await expect(act(async () => deferred.reject(new Error('aborted')))).resolves.not.toThrow()
  })

  it.each([
    ['before rating', null],
    ['with a saved rating', 4 as const],
  ])('has no accessibility violations %s', async (_, userRating) => {
    const { container } = setup({ userRating })

    expect(await axe(container)).toHaveNoViolations()
  })
})
