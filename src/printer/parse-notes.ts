import { Diagnostic, InternalDiagnostic, Notes } from '~/types'

export function parseNotes(
  notes: Diagnostic['notes'] | undefined,
  diagnostic: InternalDiagnostic
): Notes {
  if (typeof notes === 'string') {
    let lines = notes.split('\n')
    if (lines.length === 1) {
      return [{ message: notes, children: [], diagnostic }]
    }

    notes = lines
  }

  if (Array.isArray(notes)) {
    let returnValue: Notes = []
    let last: Notes[number] | null = null
    for (let note of notes) {
      let parsed = parseNotes(note, diagnostic)
      if (typeof note === 'string') {
        last = returnValue[returnValue.push(...parsed) - 1]
      } else if (last !== null) {
        last.children.push(...parsed)
      }
    }

    return returnValue
  }

  return []
}
