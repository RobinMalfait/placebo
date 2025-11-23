import type { Location } from '@robinmalfait/placebo'
import { ESLint } from 'eslint'

function severity(input: 0 | 1 | 2): string {
  return {
    0: 'Off',
    1: 'Warning',
    2: 'Error',
  }[input]
}

export async function diagnose(files: string[]) {
  let diagnostics = []

  // 1. Create an instance.
  let eslint = new ESLint({
    cwd: __dirname,
  })

  // 2. Lint files.
  let results = await eslint.lintFiles(files)
  for (let result of results) {
    for (let x of result.messages) {
      try {
        diagnostics.push({
          blockId: `${x.line}`,
          file: result.filePath,
          message: x.message,
          location: {
            start: { line: x.line, column: x.column },
            // endColumn -1 because ESLint endColumn is _after_ the last character
            end: { line: x.endLine ?? x.line, column: x.endColumn ? x.endColumn - 1 : x.column },
          } satisfies Location,
          notes:
            x.suggestions?.map((suggestion) => suggestion.fix.text).join('\n') ??
            ['Severity: ' + severity(x.severity), 'Rule: ' + x.ruleId].join('\n'),
        })
      } catch {
        // Ignore
      }
    }
  }

  return diagnostics
}
