/** A skill description runs long (the standard allows 1024 chars), so a list shows the first
 *  sentence and discloses the rest. Same sentence boundary llms.txt uses. */
const BOUNDARY = /(?<=\.)\s+(?=[A-Z])/

export const splitSay = (text: string): { first: string; rest: string } => {
  const [first, ...tail] = text.trim().split(BOUNDARY)
  return { first, rest: tail.join(' ') }
}
