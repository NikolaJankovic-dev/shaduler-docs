import { PreviewPage } from '@/components/preview-page/preview-page'

export const metadata = {
  title: 'Preview — shaduler',
  description:
    'Tweak shadcn theme tokens (palette, accent, radius) and see shaduler render live. Paste your project theme to preview the exact match.',
}

export default function Page() {
  return <PreviewPage />
}
