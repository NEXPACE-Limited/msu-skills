/** Text shaping shared by the pages and llms.txt. */

/** An llms.txt note is one line of a list: the first sentence, cut at a word boundary. */
const NOTE_LIMIT = 200

export const plural = (count: number, noun: string): string =>
  count === 1 ? `one ${noun}` : `${count} ${noun}s`

export const shortNote = (text: string): string => {
  const [sentence] = text.trim().split(/(?<=\.)\s+(?=[A-Z])/)
  if (sentence.length <= NOTE_LIMIT) return sentence
  const cut = sentence.slice(0, NOTE_LIMIT)
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:—-]$/, '')}…`
}
