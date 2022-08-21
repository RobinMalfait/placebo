let fs = require('fs')
let path = require('path')

let { printer } = require('../dist')

let css = require('./css/diagnostics.js')
let js = require('./javascript/diagnostics.js')
let html = require('./tailwind/diagnostics.js')

let filePaths = process.argv.slice(2)
if (filePaths.length <= 0) {
  console.log('Please provide a file or multiple files to analyze.')
  process.exit(1)
}
filePaths = filePaths.map((file) => path.resolve(file))

let sources = new Map()

let parsers = { js, css, html }

async function run() {
  let diagnostics = (
    await Promise.all(
      filePaths.map(async (file) => {
        let source = fs.readFileSync(file, 'utf8')

        sources.set(file, source)

        let result = await parsers[path.extname(file).slice(1)](source, { file })

        return result.sort((a, z) => a.loc.row - z.loc.row)
      })
    )
  ).flat(Infinity)

  // ---

  printer(sources, diagnostics, console.log)
}

run()
