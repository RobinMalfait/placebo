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
  let eslint = new ESLint()

  // 2. Lint files.
  let results = await eslint.lintFiles(files)
  for (let result of results) {
    for (let x of result.messages) {
      try {
        diagnostics.push({
          block: `${x.line}`,
          file: result.filePath,
          message: x.message,
          location: [
            [x.line, x.column],
            [x.line, x.line === x.endLine ? x.endColumn : x.column + 1],
          ],
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
