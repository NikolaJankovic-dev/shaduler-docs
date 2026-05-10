import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import { source } from '@/lib/source'
import { baseOptions } from '../layout.config'

/**
 * Default fumadocs `docs` layout — nav lives inside the sidebar (no separate
 * subnav bar above the content). `collapsible: false` keeps the sidebar
 * always visible at lg+ widths instead of folding it into a drawer.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      sidebar={{ collapsible: false }}
      {...baseOptions}
    >
      {children}
    </DocsLayout>
  )
}
