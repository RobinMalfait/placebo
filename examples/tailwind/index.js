let fs = require('fs')
let path = require('path')
let diagnostics = require('./diagnostics')

let { printer } = require('../../src')

let file = path.resolve(__dirname, './code.html')

let source = fs.readFileSync(file, 'utf8')
let sources = new Map([[file, source]])

async function run() {
  printer(sources, await diagnostics(source, { file }), console.log)
}

run()
