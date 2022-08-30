let ts = require('typescript')

module.exports = async function run(source, { file }) {
  let diagnostics = []

  function diagnose(message, location, { block, context, notes } = {}) {
    return { file, message, loc: location, block, context, notes }
  }

  function location(row, col, len = 1) {
    return { row: row, col: col, len }
  }

  let program = ts.createProgram([file], {
    noEmitOnError: true,
    noImplicitAny: true,
    target: ts.ScriptTarget.ES5,
    module: ts.ModuleKind.CommonJS,
  })

  let allDiagnostics = ts.getPreEmitDiagnostics(program)

  for (let diagnostic of allDiagnostics) {
    let { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start)
    diagnostics.push(
      diagnose(
        ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        location(line + 1, character + 1, diagnostic.length),
        {
          block: diagnostic.code,
          notes: [
            diagnostic.relatedInformation,
            `TS${diagnostic.code} (https://typescript.tv/errors/#TS${diagnostic.code})`,
          ].filter(Boolean),
        }
      )
    )
  }

  return diagnostics
}
