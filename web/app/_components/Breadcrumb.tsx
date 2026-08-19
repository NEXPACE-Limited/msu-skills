import Link from 'next/link'
import { Fragment } from 'react'

import { breadcrumbJsonLd, type Crumb } from '@/lib/jsonld'
import { pageUrl } from '@/lib/site'
import { JsonLd } from './JsonLd'

/** One step of the trail. `href` is an in-site route path; the last step is the current page
 *  and needs none. */
export type Step = { name: string; href?: string }

/** pageUrl treats '' as the catalog page and strips the slashes off anything else, so a
 *  route path has to lose its own before it is passed in — `pageUrl('/')` would otherwise
 *  double the slash SITE_URL already ends with. */
const routeOf = (href: string): string => href.replace(/^\/+|\/+$/g, '')

/**
 * The visible breadcrumb and its BreadcrumbList, rendered from one array. Structured data
 * has to represent what the page shows, and two lists built from two sets of values would
 * be free to disagree.
 */
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
