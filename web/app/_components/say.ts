/**
 * A skill's description runs from 149 to 689 characters today and the standard allows
 * 1024, so a list cannot show all of it and cannot clamp it to a fixed height either.
 * It splits at the same sentence boundary llms.txt uses: the first sentence carries the
 * claim, the rest carries the matching triggers.
 */
const BOUNDARY = /(?<=\.)\s+(?=[A-Z])/

export const splitSay = (text: string): { first: string; rest: string } => {
  const [first, ...tail] = text.trim().split(BOUNDARY)
  return { first, rest: tail.join(' ') }
}
