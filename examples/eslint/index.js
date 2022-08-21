/* eslint-disable */
let fs = require('fs')
let path = require('path')
let diagnostics = require('./diagnostics')

let { printer } = require('../../dist')

let file = path.resolve(__dirname, './code.js')

let source = fs.readFileSync(file, 'utf8')
let sources = new Map([[file, source]])

let executed = module.parent === null

async function run(flush = console.log) {
  printer(sources, await diagnostics(source, { file }), flush)
}

if (executed) {
  run()
} else {
  module.exports = run
}
