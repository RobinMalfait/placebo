import { print, type Diagnostic } from '@robinmalfait/placebo'
import * as fs from 'node:fs'
import { parseArgs } from 'node:util'

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

export default function (diagnose: (files: string[]) => Promise<Diagnostic[]>) {
  return async function run(files = process.argv.slice(2), write = console.log) {
    let diagnostics = await diagnose(files)

    function render() {
      return print(diagnostics, {
        write,
        source(file) {
          return fs.readFileSync(file, 'utf8')
        },
      })
    }

    if (cli.live) {
      process.stdout.on('resize', async () => {
        console.clear()
        render()
      })
      process.stdout.resume()
    }

    render()

    return diagnostics
  }
}
