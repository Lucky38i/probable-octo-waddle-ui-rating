import { setupWorker } from 'msw/browser'
import { getScenarioHandlers, type MockScenario } from './handlers'

const scenario = new URLSearchParams(window.location.search).get('mockScenario')

export const worker = setupWorker(...getScenarioHandlers(scenario))

declare global {
  interface Window {
    Cypress?: unknown
    setMockScenario?: (scenario: MockScenario) => void
  }
}

// Lets Cypress switch scenarios mid-test (e.g. fail first, then succeed on retry).
if (window.Cypress) {
  window.setMockScenario = (next) => worker.resetHandlers(...getScenarioHandlers(next))
}
