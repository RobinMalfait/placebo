const { parseArgs } = require('node:util')
const fs = require('node:fs/promises')
const { printer, htmlPrinter } = require('../dist')

const cli = parseArgs({
  allowPositionals: true,
  options: {
    target: {
      type: 'string',
      short: 't',
    },
    live: {
      type: 'boolean',
    },
  },
}).values

const printers = {
  default: printer,
  html: htmlPrinter,
}

module.exports = (diagnose) => {
  return async function run(files = process.argv.slice(2), write = console.log) {
    let diagnostics = await diagnose(files)
    let sources = new Map(
      await Promise.all(
        Array.from(new Set(diagnostics.map((d) => d.file))).map(async (file) => [
          file,
          await fs.readFile(file, 'utf8'),
        ]),
      ),
    )
    let printer = printers[cli.target ?? 'default'] ?? printers.default

    function render() {
      printer(sources, diagnostics, write)
    }

    if (cli.live) {
      process.stdout.on('resize', () => {
        console.clear()
        render()
      })
      process.stdout.resume()
    }

    render()

    return diagnostics
  }
}
