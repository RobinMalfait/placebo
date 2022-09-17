/* eslint-disable */
let { ESLint } = require('eslint')

function severity(input) {
  return {
    0: 'Off',
    1: 'Warning',
    2: 'Error',
  }[input]
}

module.exports = async function run(files) {
  files = [].concat(files)
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
        location: [
          [x.line, x.column],
          [x.line, x.line === x.endLine ? x.endColumn : x.column + 1],
        ],
        notes: `
          | Severity                | Rule        |
          | :---------------------- | :---------- |
          | ${severity(x.severity)} | ${x.ruleId} | 
        `,
      })
    }
  }

  return diagnostics
}
