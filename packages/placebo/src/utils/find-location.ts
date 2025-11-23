import { type Location } from '../types'

export function findLocation(
  input: string,
  options: {
    regex: RegExp
    test?: (match: RegExpExecArray) => boolean
    highlight?: (match: RegExpExecArray) => string
  },
): Location | null {
  for (let match of input.matchAll(options.regex)) {
    if (!(options.test?.(match) ?? true)) continue // Skip

    let highlighted = options.highlight?.(match) ?? match[0]
    if (!highlighted) continue // Skip if nothing to highlight

    let offset = match[0].indexOf(highlighted)
    if (offset === -1) continue // Skip if highlight not found

    let index = match.index + offset

    return {
      start: { offset: index },
      end: { offset: index + highlighted.length },
    }
  }

  return null
}

export function findLocations(
  input: string,
  options: {
    regex: RegExp
    test?: (match: RegExpExecArray) => boolean
    highlight?: (match: RegExpExecArray) => string
  },
): Location[] {
  let result: Location[] = []

  for (let match of input.matchAll(options.regex)) {
    if (!(options.test?.(match) ?? true)) continue // Skip

    let highlighted = options.highlight?.(match) ?? match[0]
    if (!highlighted) continue // Skip if nothing to highlight

    let offset = match[0].indexOf(highlighted)
    if (offset === -1) continue // Skip if highlight not found

    let index = match.index + offset

    result.push({
      start: { offset: index },
      end: { offset: index + highlighted.length },
    })
  }

  return result
}
