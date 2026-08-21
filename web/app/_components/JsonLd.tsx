/** lib/jsonld already neutralises `<`, the one character that can close a <script> early;
 *  escaping again here would corrupt the payload. */
export function JsonLd({ json }: { json: string }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
