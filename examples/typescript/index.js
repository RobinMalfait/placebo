let file = './code.ts'

// ---

let { resolve } = require('path')

function run(write = console.log, files = resolve(__dirname, file)) {
  return require('./run')(files, write)
}

if (module.parent == null) {
  run(console.log, process.argv.slice(2))
} else {
  module.exports = run
}
