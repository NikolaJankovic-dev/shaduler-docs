import { HomeLayout } from 'fumadocs-ui/layouts/home'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { baseOptions } from '../layout.config'
import { PREVIEW_FONT_VARIABLES } from '@/components/preview-page/fonts'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <HomeLayout {...baseOptions}>
      <NuqsAdapter>
        <div className={PREVIEW_FONT_VARIABLES}>{children}</div>
      </NuqsAdapter>
    </HomeLayout>
  )
}
