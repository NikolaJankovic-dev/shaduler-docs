import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'

/** Shared layout options used by both the home and docs layouts. */
export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <span className="flex items-center gap-2 font-semibold tracking-tight">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          className="size-5"
        >
          <rect x="3" y="4" width="2.5" height="9" />
          <rect x="6.5" y="4" width="2.5" height="6" />
          <rect x="10" y="4" width="2.5" height="3.5" />
          <rect x="11.5" y="16.5" width="2.5" height="3.5" />
          <rect x="15" y="13.5" width="2.5" height="6.5" />
          <rect x="18.5" y="11" width="2.5" height="9" />
        </svg>
        shaduler
      </span>
    ),
  },
  links: [
    {
      text: 'Docs',
      url: '/docs',
      active: 'nested-url',
    },
    {
      text: 'Preview',
      url: '/preview',
      active: 'nested-url',
    },
    {
      text: 'GitHub',
      url: 'https://github.com/nikola-jankovic/shaduler',
      external: true,
    },
  ],
  githubUrl: 'https://github.com/nikola-jankovic/shaduler',
}
