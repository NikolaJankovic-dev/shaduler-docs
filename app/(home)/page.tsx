import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <div className="mb-6 flex items-center gap-3 text-fd-foreground">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          className="size-12"
        >
          <rect x="3" y="4" width="2.5" height="9" />
          <rect x="6.5" y="4" width="2.5" height="6" />
          <rect x="10" y="4" width="2.5" height="3.5" />
          <rect x="11.5" y="16.5" width="2.5" height="3.5" />
          <rect x="15" y="13.5" width="2.5" height="6.5" />
          <rect x="18.5" y="11" width="2.5" height="9" />
        </svg>
        <span className="text-3xl font-semibold tracking-tight">shaduler</span>
      </div>
      <span className="mb-4 inline-block rounded-full border bg-fd-muted/40 px-3 py-1 text-xs font-medium text-fd-muted-foreground">
        v0.1 · in development
      </span>
      <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
        A scheduler grid built for the shadcn era.
      </h1>
      <p className="mt-6 max-w-2xl text-balance text-lg text-fd-muted-foreground">
        Composable primitives plus opt-in headless hooks for resource-allocation,
        booking, and daily-schedule UIs. Drops into any shadcn project, inherits
        your theme automatically, no CSS to fight.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/docs"
          className="inline-flex h-10 items-center justify-center rounded-md bg-fd-primary px-5 text-sm font-medium text-fd-primary-foreground transition hover:bg-fd-primary/90"
        >
          Read the docs
        </Link>
        <Link
          href="/docs/installation"
          className="inline-flex h-10 items-center justify-center rounded-md border bg-fd-background px-5 text-sm font-medium transition hover:bg-fd-muted"
        >
          Install
        </Link>
        <a
          href="https://github.com/NikolaJankovic-dev/shaduler-docs"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center justify-center rounded-md border bg-fd-background px-5 text-sm font-medium transition hover:bg-fd-muted"
        >
          GitHub
        </a>
      </div>
    </main>
  )
}
