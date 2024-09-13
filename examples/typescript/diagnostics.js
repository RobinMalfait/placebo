const { randomUUID: uuid } = require('node:crypto')
const path = require('node:path')
const ts = require('typescript')

function location(row, col, len = 1) {
  return [
    [row, col],
    [row, col + len],
  ]
}

function diagnose(file, message, location, { block, context, notes } = {}) {
  return { file, message, location, block, context, notes }
}

module.exports = async function run(files) {
  files = [].concat(files)

  let diagnostics = []

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
      let { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start)
      let id = uuid()

      let hasRelatedFiles = diagnostic.relatedInformation?.length > 0

      diagnostics.push(
        diagnose(
          diagnostic.file.fileName,
          ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
          location(line + 1, character + 1, diagnostic.length),
          {
            ...(hasRelatedFiles ? { context: id } : { block: diagnostic.code }),
            notes: [`\`TS${diagnostic.code}\` (https://typescript.tv/errors/#TS${diagnostic.code})`]
              .filter(Boolean)
              .join('\n'),
          },
        ),
      )

      // Related files
      for (let other of diagnostic.relatedInformation ?? []) {
        let { line, character } = ts.getLineAndCharacterOfPosition(other.file, other.start)
        diagnostics.push(
          diagnose(
            other.file.fileName,
            ts.flattenDiagnosticMessageText(other.messageText, '\n'),
            location(line + 1, character + 1, diagnostic.length),
            { context: id },
          ),
        )
      }
    } catch {}
  }

  return diagnostics
}
