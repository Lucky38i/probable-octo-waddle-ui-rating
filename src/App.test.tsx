import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import App from './App'

describe('App', () => {
  it('renders the page landmark, heading and rating card', async () => {
    const { container } = render(<App />)

    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Customer reviews' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 2, name: 'Excellent' })).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })
})
