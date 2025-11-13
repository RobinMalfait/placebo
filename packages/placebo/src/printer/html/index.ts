import { print as basePrint, type PrinterOptions } from '../../printer/printer'
import type { Diagnostic } from '../../types'

const OFFS = [0, 22, 23, 24, 27, 28, 29, 39, 49]

const ANSI_STYLE_MAP = new Map([
  [1, '<span class="font-bold">'], // bold
  [2, '<span class="text-current/50">'], // dim
  [3, '<span class="italic">'], // italic
  [4, '<span class="underline">'], // underline
  [7, '<span class="invert">'], // inverse
  [8, '<span class="hidden">'], // hidden
  [9, '<span class="line-through">'], // strikethrough
])

const ANSI_TEXT_COLOR_MAP = new Map([
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

const ANSI_BACKGROUND_COLOR_MAP = new Map([
  [40, '<span class="bg-black">'], // black
  [41, '<span class="bg-red-600 dark:bg-red-400">'], // red
  [42, '<span class="bg-green-600 dark:bg-green-400">'], // green
  [43, '<span class="bg-yellow-600 dark:bg-yellow-400">'], // yellow
  [44, '<span class="bg-blue-600 dark:bg-blue-400">'], // blue
  [45, '<span class="bg-pink-600 dark:bg-pink-400">'], // magenta
  [46, '<span class="bg-cyan-600 dark:bg-cyan-400">'], // cyan
  [47, '<span class="bg-white">'], // white
])

const ANSI_MAP = new Map([...ANSI_STYLE_MAP, ...ANSI_TEXT_COLOR_MAP, ...ANSI_BACKGROUND_COLOR_MAP])

export function toHtml(
  diagnostics: Iterable<Diagnostic>,
  options: Omit<PrinterOptions, 'write'> = {},
) {
  let output = ''
  basePrint(diagnostics, {
    ...options,
    write(message: string) {
      if (message === '') {
        return
      }

      output += message
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/'/g, '&#39;')
        .replace(/"/g, '&#34;')
        .replace(/\//, '&#x2F;')
        .split('\n')
        .map((line) => {
          return line
            .replace(
              /(?:\\x1b|\\u001b)\]8;;(.*?)(?:\\x1b|\\u001b)\\\\(.*?)(?:\\x1b|\\u001b)]8;;(?:\\x1b|\\u001b)\\\\/gi,
              (_, url, label) => {
                return `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`
              },
            )
            .replace(/(?:\x9B|\x1B\[)([0-?]*)([ -\/]*)[@-~]/gi, (_, code) => {
              if (OFFS.includes(+code)) return '</span>'

              let html = ANSI_MAP.get(+code)
              if (html !== undefined) return html

              return _
            })
        })
        .join('\n')
    },
  })

  return `<pre>${output}</pre>`
}
