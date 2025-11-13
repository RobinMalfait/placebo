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
  [30, '<span class="text-placebo-black">'], // black
  [31, '<span class="text-placebo-red">'], // red
  [32, '<span class="text-placebo-green">'], // green
  [33, '<span class="text-placebo-yellow">'], // yellow
  [34, '<span class="text-placebo-blue">'], // blue
  [35, '<span class="text-placebo-magenta">'], // magenta
  [36, '<span class="text-placebo-cyan">'], // cyan
  [37, '<span class="text-placebo-white">'], // white
  [90, '<span class="text-placebo-gray">'], // gray
])

const ANSI_BACKGROUND_COLOR_MAP = new Map([
  [40, '<span class="bg-placebo-black">'], // black
  [41, '<span class="bg-placebo-red">'], // red
  [42, '<span class="bg-placebo-green">'], // green
  [43, '<span class="bg-placebo-yellow">'], // yellow
  [44, '<span class="bg-placebo-blue">'], // blue
  [45, '<span class="bg-placebo-magenta">'], // magenta
  [46, '<span class="bg-placebo-cyan">'], // cyan
  [47, '<span class="bg-placebo-white">'], // white
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
