let fs = require('fs/promises')
let { printer } = require('../dist')

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

    printer(sources, diagnostics, flush)

    return diagnostics
  }
}
