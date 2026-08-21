import { Fragment } from 'react'

/** A definition list of declared facts. Every value is read from a manifest by the caller. */
export function KeyValue({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <div className="kv">
      <dl>
        {rows.map(row => (
          // <dt>/<dd> are siblings of one grid, so the wrapper cannot be an element.
          <Fragment key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </Fragment>
        ))}
      </dl>
    </div>
  )
}
