import { highlight, plain, supportsLanguage } from 'cli-highlight'
import pc from 'picocolors'

let ESCAPE = /((?:\x9B|\x1B\[)[0-?]*[ -\/]*[@-~])/g

let ansiStyleMap = new Map([
  ['\x1B[1m', '\x1B[22m'], // bold
  ['\x1B[2m', '\x1B[22m'], // dim
  ['\x1B[3m', '\x1B[23m'], // italic
  ['\x1B[4m', '\x1B[24m'], // underline
  ['\x1B[7m', '\x1B[27m'], // inverse
  ['\x1B[8m', '\x1B[28m'], // hidden
  ['\x1B[9m', '\x1B[29m'], // strikethrough
])

let ansiTextColorMap = new Map([
  ['\x1B[30m', '\x1B[39m'], // black
  ['\x1B[31m', '\x1B[39m'], // red
  ['\x1B[32m', '\x1B[39m'], // green
  ['\x1B[33m', '\x1B[39m'], // yellow
  ['\x1B[34m', '\x1B[39m'], // blue
  ['\x1B[35m', '\x1B[39m'], // magenta
  ['\x1B[36m', '\x1B[39m'], // cyan
  ['\x1B[37m', '\x1B[39m'], // white
  ['\x1B[90m', '\x1B[39m'], // gray
])

let ansiBackgroundColorMap = new Map([
  ['\x1B[40m', '\x1B[49m'], // black
  ['\x1B[41m', '\x1B[49m'], // red
  ['\x1B[42m', '\x1B[49m'], // green
  ['\x1B[43m', '\x1B[49m'], // yellow
  ['\x1B[44m', '\x1B[49m'], // blue
  ['\x1B[45m', '\x1B[49m'], // magenta
  ['\x1B[46m', '\x1B[49m'], // cyan
  ['\x1B[47m', '\x1B[49m'], // white
])

let ansiMap = new Map<string, string>([
  ...ansiStyleMap,
  ...ansiTextColorMap,
  ...ansiBackgroundColorMap,
])
let offs = new Set(ansiMap.values())

export function highlightCode(code: string, language: string) {
  return highlight(code, {
    language: supportsLanguage(language) ? language : undefined,
    ignoreIllegals: true,
    theme: {
      keyword: pc.blue,
      built_in: pc.cyan,
      type: (v) => pc.cyan(pc.dim(v)),
      literal: pc.blue,
      number: pc.magenta,
      regexp: pc.red,
      string: pc.green,
      class: pc.blue,
      function: pc.yellow,
      comment: pc.gray,
      doctag: pc.green,
      meta: pc.gray,
      tag: pc.gray,
      name: pc.blue,
      'builtin-name': plain,
      attr: pc.cyan,
      emphasis: pc.italic,
      strong: pc.bold,
      link: pc.underline,
      addition: pc.green,
      deletion: pc.red,
    },
  })
}

export function rasterizeCode(input: string) {
  let stack: string[] = []
  return input.split('\n').map((row) => {
    return row.split(ESCAPE).flatMap((current) => {
      if (current.startsWith('\x1B[')) {
        // - If ansi escape is an "off" ansi escape, remove last item from the stack (assuming that
        //   the ansi escapes are in proper order)
        // - If ansi escape is a text color, drop all other text colors from the stack, push
        //   current ansi escape.
        // - If ansi escape is a background color, drop all other background colors from the stack, push
        //   current ansi escape.
        if (offs.has(current)) {
          stack.pop()
        } else {
          // Text color
          if (ansiTextColorMap.has(current)) {
            stack = stack.filter((value) => !ansiTextColorMap.has(value))
          }
          // Background color
          else if (ansiBackgroundColorMap.has(current)) {
            stack = stack.filter((value) => !ansiBackgroundColorMap.has(value))
          }

          // Remember current ansi escape
          stack.push(current)
        }

        return []
      }

      let before = stack.join('')
      let after = stack
        .slice()
        .reverse()
        .map((ansi) => ansiMap.get(ansi))
        .join('')

      // Wrap each character in whatever is on the stack and close it again once we are done with
      // the character.
      return current.split('').flatMap((character) => `${before}${character}${after}`)
    })
  })
}

export function clearAnsiEscapes(input: string) {
  return input.replace(ESCAPE, '')
}
