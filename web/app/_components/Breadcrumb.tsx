import Link from 'next/link'
import { Fragment } from 'react'

import { breadcrumbJsonLd, type Crumb } from '@/lib/jsonld'
import { pageUrl } from '@/lib/site'
import { JsonLd } from './JsonLd'

/** One step of the trail. `href` is an in-site route path; the last step needs none. */
export type Step = { name: string; href?: string }

/** pageUrl treats '' as the catalog page and strips slashes off anything else, so a route
 *  path has to lose its own first — `pageUrl('/')` would double the slash. */
const routeOf = (href: string): string => href.replace(/^\/+|\/+$/g, '')

/** The visible breadcrumb and its BreadcrumbList, rendered from one array so the two
 *  cannot disagree. */
export function Breadcrumb({ trail }: { trail: Step[] }) {
  const steps = trail.map((step, index) => {
    const current = index === trail.length - 1
    return {
      ...step,
      current,
      // The page itself is not a destination, so it carries no `item` in either rendering.
      item: current || step.href === undefined ? undefined : pageUrl(routeOf(step.href))
    }
  })

  const crumbs: Crumb[] = steps.map(({ name, item }) => ({ name, item }))

  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        {steps.map((step, index) => (
          <Fragment key={step.name}>
            {index > 0 && <span>/</span>}
            {step.current || step.href === undefined ? (
              <span aria-current={step.current ? 'page' : undefined}>{step.name}</span>
            ) : (
              <Link href={step.href}>{step.name}</Link>
            )}
          </Fragment>
        ))}
      </nav>
      <JsonLd json={breadcrumbJsonLd(crumbs)} />
    </>
  )
}
