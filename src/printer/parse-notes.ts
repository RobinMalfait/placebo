import pc from 'picocolors'
import { Diagnostic, InternalDiagnostic, Notes } from '~/types'
import { highlightCode } from '~/utils/highlight-code'

export function parseNotes(
  notes: Diagnostic['notes'] | undefined,
  diagnostic: InternalDiagnostic
): Notes {
  if (typeof notes === 'string') {
    let match = /```(?<lang>.*)\n(?<code>[\s\S]*)\n```/g.exec(notes)
    if (match) {
      let { lang, code } = match.groups!
      let isDiff = false
      if (lang.startsWith('diff')) {
        isDiff = true
        lang = lang.slice('diff-'.length)
      }
      let diffs: string[] = []
      notes = [
        pc.dim('```' + lang + (isDiff ? ' (diff)' : '')),
        highlightCode(
          isDiff
            ? code
                .split('\n')
                .map((row, idx) => {
                  diffs[idx] = row.slice(0, 2)
                  return row.slice(2)
                })
                .join('\n')
            : code,
          lang
        )
          .split('\n')
          .map((row, idx) => {
            if (!isDiff) {
              return row
            }

            let color = diffs[idx].startsWith('+')
              ? pc.green
              : diffs[idx].startsWith('-')
              ? pc.red
              : (v: string) => v
            return `${color(diffs[idx])}${row}`
          })
          .join('\n'),
        pc.dim('```'),
      ].join('\n')
    }

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
