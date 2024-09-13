const file = './code.css'

// ---

const { resolve } = require('node:path')

function run(write = console.log, files = resolve(__dirname, file)) {
  return require('./run')(files, write)
}

if (module.parent === null) {
  run()
} else {
  module.exports = run
}
