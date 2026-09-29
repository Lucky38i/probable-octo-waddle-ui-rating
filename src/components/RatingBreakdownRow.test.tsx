import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RatingBreakdownRow } from './RatingBreakdownRow'

const renderRow = (overrides: Partial<Parameters<typeof RatingBreakdownRow>[0]> = {}) => {
  const props = {
    entry: { stars: 5 as const, count: 952 },
    totalReviews: 1232,
    isSelected: false,
    isDimmed: false,
    onToggle: jest.fn(),
    ...overrides,
  }
  render(<RatingBreakdownRow {...props} />)
  return props
}

describe('RatingBreakdownRow', () => {
  it('renders an accessible toggle button described by its tooltip', () => {
    renderRow()

    const button = screen.getByRole('button', { name: '5 stars, 952 reviews' })
    expect(button).toHaveAttribute('aria-pressed', 'false')
    expect(button).toHaveAccessibleDescription('77% of reviews')
  })

  it('uses singular wording for one star and one review', () => {
    renderRow({ entry: { stars: 1, count: 1 } })

    expect(screen.getByRole('button', { name: '1 star, 1 review' })).toBeInTheDocument()
  })

  it('sizes the bar relative to the total, with a minimum sliver for small counts', () => {
    renderRow({ entry: { stars: 2, count: 1 }, totalReviews: 1232 })

    expect(screen.getByTestId('rating-bar-fill')).toHaveStyle({ width: '1%' })
  })

  it('renders an empty bar for zero reviews', () => {
    renderRow({ entry: { stars: 2, count: 0 } })

    expect(screen.getByTestId('rating-bar-fill')).toHaveStyle({ width: '0%' })
  })

  it('reflects the selected state', () => {
    renderRow({ isSelected: true })

    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  })

  it('dims unselected rows while another rating is selected', () => {
    renderRow({ isDimmed: true })

    expect(screen.getByTestId('rating-bar-fill')).toHaveClass('opacity-40')
    expect(screen.getByRole('button')).not.toHaveClass('opacity-40')
  })

  it('calls onToggle with the star value when clicked', async () => {
    const user = userEvent.setup()
    const { onToggle } = renderRow()

    await user.click(screen.getByRole('button'))

    expect(onToggle).toHaveBeenCalledWith(5)
  })

  it.each(['{Enter}', ' '])('toggles with the %s key', async (key) => {
    const user = userEvent.setup()
    const { onToggle } = renderRow()

    await user.tab()
    await user.keyboard(key)

    expect(onToggle).toHaveBeenCalledWith(5)
  })

  describe('tooltip', () => {
    it('does not open from focus that is not keyboard-visible', () => {
      renderRow()
      const button = screen.getByRole('button')
      const matches = jest.spyOn(button, 'matches').mockReturnValue(false)

      fireEvent.focus(button)

      expect(matches).toHaveBeenCalledWith(':focus-visible')
      expect(screen.getByRole('tooltip', { hidden: true })).toHaveClass('invisible')
    })

    it('falls back to showing on focus when :focus-visible is unsupported', () => {
      renderRow()
      const button = screen.getByRole('button')
      jest.spyOn(button, 'matches').mockImplementation(() => {
        throw new SyntaxError('unsupported selector')
      })

      fireEvent.focus(button)

      expect(screen.getByRole('tooltip', { hidden: true })).toHaveClass('visible')
    })

    it('is hidden by default', () => {
      renderRow()

      expect(screen.getByRole('tooltip', { hidden: true })).toHaveClass('invisible')
    })

    it('shows on hover and hides on mouse leave', async () => {
      const user = userEvent.setup()
      renderRow()
      const tooltip = screen.getByRole('tooltip', { hidden: true })

      await user.hover(screen.getByRole('button'))
      expect(tooltip).toHaveClass('visible')

      await user.unhover(screen.getByRole('button'))
      expect(tooltip).toHaveClass('invisible')
    })

    it('shows on keyboard focus and hides on blur', async () => {
      const user = userEvent.setup()
      renderRow()
      const tooltip = screen.getByRole('tooltip', { hidden: true })

      await user.tab()
      expect(tooltip).toHaveClass('visible')

      await user.tab()
      expect(tooltip).toHaveClass('invisible')
    })

    it('can be dismissed with Escape and re-shown on the next focus', async () => {
      const user = userEvent.setup()
      renderRow()
      const tooltip = screen.getByRole('tooltip', { hidden: true })
      const button = screen.getByRole('button')

      await user.tab()
      await user.keyboard('{Escape}')
      expect(tooltip).toHaveClass('invisible')

      fireEvent.blur(button)
      fireEvent.focus(button)
      expect(tooltip).toHaveClass('visible')
    })

    it('ignores other keys while visible', async () => {
      const user = userEvent.setup()
      renderRow()

      await user.hover(screen.getByRole('button'))
      await user.keyboard('a')

      expect(screen.getByRole('tooltip', { hidden: true })).toHaveClass('visible')
    })
  })
})
