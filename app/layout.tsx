import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { RootProvider } from 'fumadocs-ui/provider/next'
import { ThemeShortcut } from '@/components/theme-shortcut'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  // Lets Next.js resolve relative URLs (OG, canonical, sitemap, robots…)
  // against the production domain instead of the request host.
  metadataBase: new URL('https://shaduler.com'),
  title: {
    default: 'shaduler',
    template: '%s — shaduler',
  },
  description:
    'A composable scheduler grid for shadcn/ui — primitives + headless hooks for resource-allocation, booking, and daily-schedule UIs.',
  openGraph: {
    title: 'shaduler',
    description:
      'A composable scheduler grid for shadcn/ui — primitives + headless hooks for resource-allocation, booking, and daily-schedule UIs.',
    url: 'https://shaduler.com',
    siteName: 'shaduler',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'shaduler',
    description:
      'A composable scheduler grid for shadcn/ui — primitives + headless hooks.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="flex min-h-screen flex-col">
        <RootProvider>
          <ThemeShortcut />
          {children}
        </RootProvider>
      </body>
    </html>
  )
}
