import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { useState } from 'react'
import { mockProductRating } from '../mocks/data'
import type { StarValue } from '../types/rating'
import { RatingBreakdown } from './RatingBreakdown'

function ControlledBreakdown({ onSelect }: { onSelect?: (stars: StarValue | null) => void }) {
  const [selected, setSelected] = useState<StarValue | null>(null)
  return (
    <RatingBreakdown
      breakdown={[...mockProductRating.breakdown].reverse()}
      selectedStars={selected}
      onSelect={(stars) => {
        setSelected(stars)
        onSelect?.(stars)
      }}
    />
  )
}

const getRows = () => screen.getAllByRole('button')

describe('RatingBreakdown', () => {
  it('labels the region and lists ratings from 5 to 1 stars', () => {
    render(<ControlledBreakdown />)

    expect(
      screen.getByRole('region', { name: 'Rating breakdown from 1232 reviews' }),
    ).toBeInTheDocument()
    expect(getRows().map((row) => row.dataset.ratingRow)).toEqual(['5', '4', '3', '2', '1'])
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<ControlledBreakdown />)

    expect(await axe(container)).toHaveNoViolations()
  })

  it('selects a rating and deselects it on a second click', async () => {
    const user = userEvent.setup()
    const onSelect = jest.fn()
    render(<ControlledBreakdown onSelect={onSelect} />)
    const fourStars = screen.getByRole('button', { name: '4 stars, 171 reviews' })

    await user.click(fourStars)
    expect(fourStars).toHaveAttribute('aria-pressed', 'true')
    expect(onSelect).toHaveBeenLastCalledWith(4)

    await user.click(fourStars)
    expect(fourStars).toHaveAttribute('aria-pressed', 'false')
    expect(onSelect).toHaveBeenLastCalledWith(null)
  })

  it('switches the selection between ratings', async () => {
    const user = userEvent.setup()
    render(<ControlledBreakdown />)

    await user.click(screen.getByRole('button', { name: /^5 stars/ }))
    await user.click(screen.getByRole('button', { name: /^1 star/ }))

    const pressed = getRows().filter((row) => row.getAttribute('aria-pressed') === 'true')
    expect(pressed).toHaveLength(1)
    expect(pressed[0]).toHaveAccessibleName('1 star, 40 reviews')
  })

  it('moves focus with arrow keys, wrapping at the ends', async () => {
    const user = userEvent.setup()
    render(<ControlledBreakdown />)
    const rows = getRows()

    await user.tab()
    expect(rows[0]).toHaveFocus()

    await user.keyboard('{ArrowDown}')
    expect(rows[1]).toHaveFocus()

    await user.keyboard('{ArrowUp}{ArrowUp}')
    expect(rows[4]).toHaveFocus()

    await user.keyboard('{ArrowDown}')
    expect(rows[0]).toHaveFocus()
  })

  it('jumps to the first and last rating with Home and End', async () => {
    const user = userEvent.setup()
    render(<ControlledBreakdown />)
    const rows = getRows()

    await user.tab()
    await user.keyboard('{End}')
    expect(rows[4]).toHaveFocus()

    await user.keyboard('{Home}')
    expect(rows[0]).toHaveFocus()
  })

  it('ignores unrelated keys', async () => {
    const user = userEvent.setup()
    render(<ControlledBreakdown />)

    await user.tab()
    await user.keyboard('{ArrowRight}')

    expect(getRows()[0]).toHaveFocus()
  })
})
