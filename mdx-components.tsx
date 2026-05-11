import defaultMdxComponents from 'fumadocs-ui/mdx'
import { Tab, Tabs } from 'fumadocs-ui/components/tabs'
import type { MDXComponents } from 'mdx/types'
import { Preview } from '@/components/preview'
import { QuickTastePreview } from '@/components/demos/quick-taste'
import { DemoDisplayOnly } from '@/components/demos/display-only'
import { DemoClickToCreate } from '@/components/demos/click-to-create'
import { DemoFullInteractivity } from '@/components/demos/full-interactivity'
import { DemoWeekView } from '@/components/demos/week-view'
import { DemoManyResources } from '@/components/demos/many-resources'
import { DemoCustomRender } from '@/components/demos/custom-render'
import { DemoLocales } from '@/components/demos/locales'
import { DemoPartialHours } from '@/components/demos/partial-hours'
import { DemoCustomLabels } from '@/components/demos/custom-labels'
import { DemoAllDay } from '@/components/demos/all-day'
import { DemoCrossMidnight } from '@/components/demos/cross-midnight'
import { DemoGroupedColumns } from '@/components/demos/grouped-columns'
import { DemoFullCustomization } from '@/components/demos/full-customization'
import { LandingHeroDemo } from '@/components/demos/landing-hero'

/**
 * Components made available inside MDX files. Extend this map when you want
 * to expose a custom React component (e.g. live previews) to docs authors.
 */
export function getMDXComponents(
  components?: MDXComponents,
): MDXComponents {
  return {
    ...defaultMdxComponents,
    Tab,
    Tabs,
    Preview,
    QuickTastePreview,
    DemoDisplayOnly,
    DemoClickToCreate,
    DemoFullInteractivity,
    DemoWeekView,
    DemoManyResources,
    DemoCustomRender,
    DemoLocales,
    DemoPartialHours,
    DemoCustomLabels,
    DemoAllDay,
    DemoCrossMidnight,
    DemoGroupedColumns,
    DemoFullCustomization,
    LandingHeroDemo,
    ...components,
  }
}
