import { ProductRatingCard } from './components/ProductRatingCard'

export default function App() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="sr-only">Customer reviews</h1>
      <ProductRatingCard />
    </main>
  )
}
