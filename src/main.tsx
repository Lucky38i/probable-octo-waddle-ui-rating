import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

async function enableMocking() {
  if (import.meta.env.VITE_API_MOCKING === 'disabled') return

  const { worker } = await import('./mocks/browser.ts')
  await worker.start({ onUnhandledFrame: 'bypass', quiet: import.meta.env.PROD })
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root not found')

void enableMocking().then(() => {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
