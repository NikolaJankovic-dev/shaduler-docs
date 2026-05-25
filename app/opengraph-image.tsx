import { ImageResponse } from 'next/og'

/**
 * OG / Twitter card for shaduler.com. Next.js wires this up automatically:
 * the file at `app/opengraph-image.tsx` becomes the default `og:image` /
 * `twitter:image` for every route under `app/` that doesn't override it.
 */

export const alt = 'shaduler — A composable scheduler grid for shadcn/ui'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          color: '#e2e8f0',
          background:
            'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #0c4a6e 100%)',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        {/* Top row: icon + wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="84"
            height="84"
            fill="#e2e8f0"
          >
            <rect x="3" y="4" width="2.5" height="9" />
            <rect x="6.5" y="4" width="2.5" height="6" />
            <rect x="10" y="4" width="2.5" height="3.5" />
            <rect x="11.5" y="16.5" width="2.5" height="3.5" />
            <rect x="15" y="13.5" width="2.5" height="6.5" />
            <rect x="18.5" y="11" width="2.5" height="9" />
          </svg>
          <span
            style={{
              fontSize: '88px',
              fontWeight: 700,
              letterSpacing: '-0.04em',
              color: '#f8fafc',
            }}
          >
            shaduler
          </span>
        </div>

        {/* Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <span
            style={{
              fontSize: '64px',
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: '#f1f5f9',
            }}
          >
            A scheduler grid built for the shadcn era.
          </span>
          <span
            style={{
              fontSize: '28px',
              color: '#94a3b8',
              lineHeight: 1.4,
            }}
          >
            Composable primitives, opt-in headless hooks, single-file install.
          </span>
        </div>

        {/* Bottom row: URL */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '24px',
            color: '#64748b',
          }}
        >
          <span>shaduler.com</span>
          <span>pnpm dlx shadcn add shaduler</span>
        </div>
      </div>
    ),
    size,
  )
}
