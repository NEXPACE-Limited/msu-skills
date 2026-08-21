/** The structured data the pages embed. Every value is read from the manifests the pages
 *  already render, so the markup stays a true representation of what the page shows. */

import type { Catalog } from './types'

/** One step of a breadcrumb trail. The page's own step carries no `item`. */
export type Crumb = { name: string; item?: string }

/** Inside a <script> element an entity is not decoded, so only `<` needs neutralising. */
const scriptJson = (value: unknown): string =>
  JSON.stringify(value, null, 2).replaceAll('<', '\\u003c')

/** A sub-page's visible breadcrumb in schema.org form: same labels, same destinations.
 *  `position` is 1-based; the last item is the page itself and carries no `item` URL. */
export const breadcrumbJsonLd = (trail: Crumb[]): string =>
  scriptJson({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      ...(crumb.item === undefined ? {} : { item: crumb.item })
    }))
  })

/** Who publishes the catalog. Only what the manifest's owner block declares — any further
 *  identity URL would be an assertion no manifest here backs. */
export const organizationJsonLd = (catalog: Catalog): string =>
  scriptJson({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: catalog.owner.name,
    url: catalog.owner.url
  })
