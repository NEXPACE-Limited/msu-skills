/**
 * The structured data the pages embed, ported from scripts/build-site.mjs :355-388.
 * Both values are read from the manifests the pages already render, so the markup stays a
 * true representation of what the page shows.
 */

import type { Catalog } from './types'

/** One step of a breadcrumb trail. The page's own step carries no `item`. */
export type Crumb = { name: string; item?: string }

/** JSON for a <script type="application/ld+json"> body. Inside a <script> element an entity
 *  is not decoded, so only `<` needs neutralising. */
const scriptJson = (value: unknown): string =>
  JSON.stringify(value, null, 2).replaceAll('<', '\\u003c')

/** A sub-page's visible breadcrumb, in schema.org form: the same labels and the same
 *  destinations. `position` is 1-based and follows the trail's order; the last item is the
 *  page itself and so carries no `item` URL.
 *
 *  The source fixed the trail at catalog + page. It takes a trail of any length here because
 *  a skill page sits three deep — catalog, its plugin, itself. */
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

/** Who publishes the catalog, for search engines that resolve entities rather than pages. Both
 *  values come from the manifest's owner block, so the page and the catalog cannot name
 *  different owners. Any further identity URL would be an assertion about the company that no
 *  manifest here backs, so this states only what the catalog already declares. */
export const organizationJsonLd = (catalog: Catalog): string =>
  scriptJson({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: catalog.owner.name,
    url: catalog.owner.url
  })
