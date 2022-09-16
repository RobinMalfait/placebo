/* eslint-disable */
let file = './code.js'

// ---

let { resolve } = require('path')

function run(write = console.log, files = resolve(__dirname, file)) {
  return require('./run')(files, write)
}

if (module.parent === null) {
  run()
} else {
  module.exports = run
}
