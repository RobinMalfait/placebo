import run from '@robinmalfait/placebo-cli'
import { globSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { diagnose } from './diagnostics'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

if (import.meta.url.endsWith(process.argv[1])) {
  run(diagnose)(process.argv.length > 2 ? process.argv.slice(2) : globSync(`${__dirname}code/*`))
}

export default function (write = console.log) {
  return run(diagnose)(globSync(`${__dirname}code/*`), write)
}
