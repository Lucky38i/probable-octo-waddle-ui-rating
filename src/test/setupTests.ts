import '@testing-library/jest-dom'
import { toHaveNoViolations } from 'jest-axe'
import { server } from './server'

expect.extend(toHaveNoViolations)

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  server.resetHandlers()
  localStorage.clear()
})
afterAll(() => server.close())
