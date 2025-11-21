import type { Diagnostic, Location } from '@robinmalfait/placebo'
import { randomUUID as uuid } from 'crypto'
import ts from 'typescript'

function location(row: number, col: number, len = 1): Location {
  return [row, col, row, col + len]
}

export async function diagnose(_files: string[]) {
  function diagnose(
    file: string,
    message: string,
    location: Location,
    rest: Partial<Diagnostic> = {},
  ): Diagnostic {
    return { file, message, location, ...rest }
  }

  let diagnostics: Diagnostic[] = []

  let root = process.cwd()

  let configPath = ts.findConfigFile(root, ts.sys.fileExists, 'tsconfig.json')
  if (!configPath) {
    console.error("Could not find a valid 'tsconfig.json'.")
    process.exit(1)
  }
  let configFile = ts.readConfigFile(configPath, ts.sys.readFile)
  let compilerOptions = ts.parseJsonConfigFileContent(configFile.config, ts.sys, root)
  let program = ts.createProgram(compilerOptions.fileNames, compilerOptions.options)

  let allDiagnostics = ts.getPreEmitDiagnostics(program)

  for (let diagnostic of allDiagnostics) {
    try {
      let { line, character } = ts.getLineAndCharacterOfPosition(
        diagnostic.file!,
        diagnostic.start!,
      )
      let id = uuid()

      let hasRelatedFiles = (diagnostic.relatedInformation?.length ?? 0) > 0

      diagnostics.push(
        diagnose(
          diagnostic.file?.fileName ?? 'unknown',
          ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
          location(line + 1, character + 1, diagnostic.length),
          {
            ...(hasRelatedFiles ? { relatedId: id } : { blockId: `${diagnostic.code}` }),
            notes: [`\`TS${diagnostic.code}\` (https://typescript.tv/errors/#TS${diagnostic.code})`]
              .filter(Boolean)
              .join('\n'),
          },
        ),
      )

      // Related files
      for (let other of diagnostic.relatedInformation ?? []) {
        if (!other.file) continue
        if (!other.start) continue

        let { line, character } = ts.getLineAndCharacterOfPosition(other.file, other.start)
        diagnostics.push(
          diagnose(
            other.file?.fileName ?? 'unknown',
            ts.flattenDiagnosticMessageText(other.messageText, '\n'),
            location(line + 1, character + 1, diagnostic.length),
            { relatedId: id },
          ),
        )
      }
    } catch {}
  }

  return diagnostics
}
