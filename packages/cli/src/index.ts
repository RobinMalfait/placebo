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
    let blocks: string[] = []

    function render() {
      return print(diagnostics, {
        write: (block) => blocks.push(block),
        source(file) {
          return fs.readFileSync(file, 'utf8')
        },
      })
    }

    if (cli.live) {
      process.stdout.on('resize', async () => {
        console.clear()
        render()
        write('')
        for (let block of blocks.splice(0)) {
          write(block)
          write('')
        }
      })
      process.stdout.resume()
    }

    render()
    write('')
    for (let block of blocks.splice(0)) {
      write(block)
      write('')
    }

    return diagnostics
  }
}
