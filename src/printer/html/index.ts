import { printer as basePrinter } from '~/printer/printer'
import { Diagnostic } from '~/types'

let ANSI = /(?:\x9B|\x1B\[)([0-?]*)([ -\/]*)[@-~]/g
let offs = [22, 23, 24, 27, 28, 29, 39, 49]

let ansiStyleMap = new Map([
  [1, '<span class="font-bold">'], // bold
  [2, '<span class="text-gray-400/70">'], // dim
  [3, '<span class="italic">'], // italic
  [4, '<span class="underline">'], // underline
  [7, '<span class="inverse">'], // inverse
  [8, '<span class="hidden">'], // hidden
  [9, '<span class="line-through">'], // strikethrough
])

let ansiTextColorMap = new Map([
  [30, '<span class="text-black">'], // black
  [31, '<span class="text-red-400">'], // red
  [32, '<span class="text-green-400">'], // green
  [33, '<span class="text-yellow-400">'], // yellow
  [34, '<span class="text-blue-400">'], // blue
  [35, '<span class="text-pink-400">'], // magenta
  [36, '<span class="text-cyan-400">'], // cyan
  [37, '<span class="text-white">'], // white
  [90, '<span class="text-gray-400">'], // gray
])

let ansiBackgroundColorMap = new Map([
  [40, '<span class="bg-black">'], // black
  [41, '<span class="bg-red-400">'], // red
  [42, '<span class="bg-green-400">'], // green
  [43, '<span class="bg-yellow-400">'], // yellow
  [44, '<span class="bg-blue-400">'], // blue
  [45, '<span class="bg-pink-400">'], // magenta
  [46, '<span class="bg-cyan-400">'], // cyan
  [47, '<span class="bg-white">'], // white
])

let ansiMap = new Map([...ansiStyleMap, ...ansiTextColorMap, ...ansiBackgroundColorMap])

let html = String.raw
let template = html`
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Placebo</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body>
      <div class="bg-gray-800 py-8 min-h-screen text-gray-300">
        <div class="mx-auto max-w-[calc(100ch+1.25rem*2)] space-y-8">
          <!-- SETUP -->
        </div>
      </div>
    </body>
  </html>
`

export async function printer(
  sources: Map<string, string>,
  diagnostics: Diagnostic[],
  flush = console.log
) {
  let container = '<div class="bg-gray-900 px-4 py-8 leading-tight font-mono rounded-lg shadow-md">'
  let output = container
  basePrinter(sources, diagnostics, (message) => {
    if (message === '') {
      output += '</div>'
      output += container
    }

    output +=
      '<pre>' +
      (message.split('\n') as string[])
        .map((line) =>
          line.replace(ANSI, (_, code) => {
            if (offs.includes(+code)) {
              return '</span>'
            }

            if (ansiMap.has(+code)) {
              return ansiMap.get(+code)!
            }

            return _
          })
        )
        .join('') +
      '</pre>'
  })
  output += '</div>'

  flush(template.replace('<!-- SETUP -->', output))
}
