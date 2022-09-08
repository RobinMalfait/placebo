import { Diagnostic, InternalDiagnostic, Notes } from '~/types'

export function parseNotes(
  notes: Diagnostic['notes'] | undefined,
  diagnostic: InternalDiagnostic
): Notes {
  if (typeof notes === 'string') {
    return [{ message: notes, children: [], diagnostic }]
  }

  if (Array.isArray(notes)) {
    let returnValue: Notes = []
    let last: Notes[number] | null = null
    for (let note of notes) {
      if (typeof note === 'string') {
        last = returnValue[returnValue.push({ message: note, children: [], diagnostic }) - 1]
      } else if (last !== null) {
        last.children.push(...parseNotes(note, diagnostic))
      }
    }

    return returnValue
  }

  return []
}
