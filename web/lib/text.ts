/**
 * Text shaping shared by the pages and by llms.txt. Ported from scripts/build-site.mjs
 * :49 and :51-59; the published llms.txt is compared against that generator's output, so
 * the cut points here are behaviour, not formatting.
 */

/** A note in llms.txt is one line in a list, so a description is cut to its first sentence
 *  and then to this many characters at a word boundary. */
const NOTE_LIMIT = 200

export const plural = (count: number, noun: string): string =>
  count === 1 ? `one ${noun}` : `${count} ${noun}s`

/** The first sentence of a description, shortened at a word boundary. An llms.txt note is one
 *  line of a list, while a frontmatter description is written for skill matching and runs
 *  several times longer. */
export const shortNote = (text: string): string => {
  const [sentence] = text.trim().split(/(?<=\.)\s+(?=[A-Z])/)
  if (sentence.length <= NOTE_LIMIT) return sentence
  const cut = sentence.slice(0, NOTE_LIMIT)
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:—-]$/, '')}…`
}
