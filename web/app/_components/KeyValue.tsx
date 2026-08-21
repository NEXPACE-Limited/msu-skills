import { Fragment } from 'react'

/**
 * A definition list of declared facts — the MCP page's connection block. Every row's value
 * is read from a manifest by the caller; nothing is composed here.
 */
export function KeyValue({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <div className="kv">
      <dl>
        {rows.map(row => (
          // A <dt>/<dd> pair is two siblings of the same grid, so the fragment cannot be a
          // wrapper element without breaking the two-column layout.
          <Fragment key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </Fragment>
        ))}
      </dl>
    </div>
  )
}
