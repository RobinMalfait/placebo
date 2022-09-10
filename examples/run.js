let { parseArgs } = require('node:util')
let fs = require('fs/promises')
let { printer, htmlPrinter } = require('../dist')

let cli = parseArgs({
  options: {
    target: {
      type: 'string',
      short: 't',
    },
  },
}).values

let printers = {
  default: printer,
  html: htmlPrinter,
}

module.exports = (diagnose) => {
  return async function run(files = process.argv.slice(2), flush = console.log) {
    let diagnostics = await diagnose(files)
    let sources = new Map(
      await Promise.all(
        Array.from(new Set(diagnostics.map((d) => d.file))).map(async (file) => [
          file,
          await fs.readFile(file, 'utf8'),
        ])
      )
    )
    let printer = printers[cli.target ?? 'default'] ?? printers.default

    printer(sources, diagnostics, flush)

    return diagnostics
  }
}
