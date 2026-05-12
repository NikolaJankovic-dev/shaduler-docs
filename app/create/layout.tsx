import { HomeLayout } from 'fumadocs-ui/layouts/home'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { baseOptions } from '../layout.config'
import { CREATE_FONT_VARIABLES } from '@/components/create-page/fonts'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <HomeLayout {...baseOptions}>
      <NuqsAdapter>
        <div className={CREATE_FONT_VARIABLES}>{children}</div>
      </NuqsAdapter>
    </HomeLayout>
  )
}
