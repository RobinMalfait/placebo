/* eslint-disable */
let { ESLint } = require('eslint')

module.exports = async function run(files) {
  let diagnostics = []

  // 1. Create an instance.
  let eslint = new ESLint()

  // 2. Lint files.
  let results = await eslint.lintFiles(files)
  for (let result of results) {
    for (let x of result.messages) {
      diagnostics.push({
        block: x.line,
        file: result.filePath,
        message: x.message,
        loc: {
          row: x.line,
          col: x.column,
          len: x.line !== x.endLine ? 1 : Math.max(0, x.endColumn - x.column),
        },
        notes: x.ruleId,
      })
    }
  }

  return diagnostics
}
