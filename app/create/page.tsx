import { Suspense } from 'react'
import { CreatePage } from '@/components/create-page/create-page'

export const metadata = {
  title: 'Create — shaduler',
  description:
    'Tweak shadcn theme tokens (palette, accent, radius) and see shaduler render live. Paste your project theme to preview the exact match.',
}

// `nuqs` reads `?preset=` via `useSearchParams()`, which Next.js refuses to
// prerender statically without a Suspense boundary. Wrapping the whole page
// CSR-bails the interactive part; the docs shell still renders.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <CreatePage />
    </Suspense>
  )
}
