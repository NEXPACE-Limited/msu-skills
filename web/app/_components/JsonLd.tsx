/**
 * A structured-data block. lib/jsonld already neutralises the one character that can close
 * a <script> element early, so the JSON arrives safe; escaping it again here would corrupt
 * the payload rather than protect it.
 */
export function JsonLd({ json }: { json: string }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
