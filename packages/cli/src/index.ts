import { printer, type Diagnostic } from '@robinmalfait/placebo'
import * as fs from 'node:fs'
import { parseArgs } from 'node:util'
import { DefaultMap } from './utils/default-map'

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
    let sources = new DefaultMap((path) => fs.readFileSync(path, 'utf8'))

    function render() {
      return printer(sources, diagnostics, write)
    }

    if (cli.live) {
      process.stdout.on('resize', async () => {
        console.clear()
        await render()
      })
      process.stdout.resume()
    }

    await render()

    return diagnostics
  }
}
