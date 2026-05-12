import { LandingHeroDemo } from '@/components/demos/landing-hero'

export const metadata = {
  title: 'shaduler — hero',
  robots: { index: false, follow: false },
}

/**
 * Chrome-free render target for the GIF recording script
 * (`scripts/record-hero.mjs`). Same visual wrapping as the landing page
 * hero so the recorded frames match what users see on `/`. Not linked
 * from anywhere; `robots: noindex` so search engines ignore it.
 */
export default function EmbedHeroPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-fd-background p-8">
      <div
        data-shaduler-embed="hero"
        className="w-full max-w-4xl overflow-hidden rounded-xl border bg-fd-card shadow-2xl shadow-slate-900/10 dark:shadow-black/40"
      >
        <LandingHeroDemo />
      </div>
    </main>
  )
}
