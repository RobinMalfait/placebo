/* eslint-disable */
let { ESLint } = require('eslint')

module.exports = async function run(source, { file }) {
  let diagnostics = []

  // 1. Create an instance.
  let eslint = new ESLint()

  // 2. Lint files.
  let results = await eslint.lintFiles([file])
  for (let result of results) {
    for (let x of result.messages) {
      diagnostics.push({
        block: x.line,
        file,
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

  // Original ESLint output
  if (false) {
    // 3. Format the results.
    let formatter = await eslint.loadFormatter('stylish')
    let resultText = formatter.format(results)

    // 4. Output it.
    console.log(resultText)
  }

  return diagnostics
}
