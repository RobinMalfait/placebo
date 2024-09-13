import { printer as basePrinter } from '~/printer/printer'
import type { Diagnostic } from '~/types'
import { dedent } from '~/utils/dedent'

const ANSI = /(?:\x9B|\x1B\[)([0-?]*)([ -\/]*)[@-~]/g
const offs = [22, 23, 24, 27, 28, 29, 39, 49]

const ansiStyleMap = new Map([
  [1, '<span class="font-bold">'], // bold
  [2, '<span class="text-gray-400/70">'], // dim
  [3, '<span class="italic">'], // italic
  [4, '<span class="underline">'], // underline
  [7, '<span class="inverse">'], // inverse
  [8, '<span class="hidden">'], // hidden
  [9, '<span class="line-through">'], // strikethrough
])

const ansiTextColorMap = new Map([
  [30, '<span class="text-black">'], // black
  [31, '<span class="text-red-600 dark:text-red-400">'], // red
  [32, '<span class="text-green-600 dark:text-green-400">'], // green
  [33, '<span class="text-yellow-600 dark:text-yellow-400">'], // yellow
  [34, '<span class="text-blue-600 dark:text-blue-400">'], // blue
  [35, '<span class="text-pink-600 dark:text-pink-400">'], // magenta
  [36, '<span class="text-cyan-600 dark:text-cyan-400">'], // cyan
  [37, '<span class="text-white">'], // white
  [90, '<span class="text-gray-800 dark:text-gray-400">'], // gray
])

const ansiBackgroundColorMap = new Map([
  [40, '<span class="bg-black">'], // black
  [41, '<span class="bg-red-600 dark:bg-red-400">'], // red
  [42, '<span class="bg-green-600 dark:bg-green-400">'], // green
  [43, '<span class="bg-yellow-600 dark:bg-yellow-400">'], // yellow
  [44, '<span class="bg-blue-600 dark:bg-blue-400">'], // blue
  [45, '<span class="bg-pink-600 dark:bg-pink-400">'], // magenta
  [46, '<span class="bg-cyan-600 dark:bg-cyan-400">'], // cyan
  [47, '<span class="bg-white">'], // white
])

const ansiMap = new Map([...ansiStyleMap, ...ansiTextColorMap, ...ansiBackgroundColorMap])

const html = String.raw
const template = dedent(html`
  <!DOCTYPE html>
  <html lang="en" class="antialised bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Placebo</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body>
      <div class="py-8">
        <div class="mx-auto max-w-[calc(100ch+1.25rem*2)] space-y-8">
          <!-- SETUP -->
        </div>
      </div>
    </body>
  </html>
`)

export async function printer(
  sources: Map<string, string>,
  diagnostics: Diagnostic[],
  write = console.log,
) {
  function wrap(input: string) {
    return `<div class="bg-white dark:bg-gray-900 px-4 py-8 leading-tight font-mono rounded-lg shadow-md overflow-auto"><pre>${input}</pre></div>`
  }

  let output = ''
  basePrinter(sources, diagnostics, (message: string) => {
    if (message === '') {
      return
    }

    message = message
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/'/g, '&#39;')
      .replace(/"/g, '&#34;')
      .replace(/\//, '&#x2F;')

    output += wrap(
      message
        .split('\n')
        .map((line) =>
          line.replace(ANSI, (_, code) => {
            if (offs.includes(+code)) return '</span>'
            if (ansiMap.has(+code)) return ansiMap.get(+code)!

            return _
          }),
        )
        .join('\n'),
    )
  })

  write(template.replace('<!-- SETUP -->', output))
}
