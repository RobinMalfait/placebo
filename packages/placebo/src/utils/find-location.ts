import { type Location } from '../types'
import { createLineTable } from './line-table'

export function findLocation(
  input: string,
  options: {
    regex: RegExp
    test?: (match: RegExpExecArray) => boolean
    highlight?: (match: RegExpExecArray) => string
  },
): Location | null {
  let lines = createLineTable(input)

  for (let match of input.matchAll(options.regex)) {
    if (!(options.test?.(match) ?? true)) continue // Skip

    let highlighted = options.highlight?.(match) ?? match[0]
    if (!highlighted) continue // Skip if nothing to highlight

    let offset = match[0].indexOf(highlighted)
    if (offset === -1) continue // Skip if highlight not found

    let index = match.index + offset

    let start = lines.find(index)
    let end = lines.find(index + highlighted.length)

    return [start.line, start.column, end.line, end.column]
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
  let lines = createLineTable(input)
  let result: Location[] = []

  for (let match of input.matchAll(options.regex)) {
    if (!(options.test?.(match) ?? true)) continue // Skip

    let highlighted = options.highlight?.(match) ?? match[0]
    if (!highlighted) continue // Skip if nothing to highlight

    let offset = match[0].indexOf(highlighted)
    if (offset === -1) continue // Skip if highlight not found

    let index = match.index + offset

    let start = lines.find(index)
    let end = lines.find(index + highlighted.length)

    result.push([start.line, start.column, end.line, end.column])
  }

  return result
}
