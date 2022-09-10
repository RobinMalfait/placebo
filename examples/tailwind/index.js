let file = './code.html'

// ---

let { resolve } = require('path')

function run(flush = console.log, files = resolve(__dirname, file)) {
  return require('./run')(files, flush)
}

if (module.parent === null) {
  run()
} else {
  module.exports = run
}
