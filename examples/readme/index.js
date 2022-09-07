let fs = require('fs')
let path = require('path')
let diagnostics = require('./diagnostics')

let { printer } = require('../../dist')

let file = path.resolve(__dirname, './code.md')

let source = fs.readFileSync(file, 'utf8')
let sources = new Map([['README.md', source]])

let executed = module.parent === null

async function run(flush = console.log) {
  let x = diagnostics(source, { file })
  printer(sources, x, flush)
  return x
}

if (executed) {
  run()
} else {
  module.exports = run
}
