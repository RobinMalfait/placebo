import { env } from '../env'

// Implementation based on: https://gist.github.com/fnky/458719343aabd01cfb17a3a4f7296797
const ESC = '\u001b'
const CSI = `${ESC}[`

export const cursor = {
  hide: () => `${CSI}?25l`,
  show: () => `${CSI}?25h`,
  home: () => `${CSI}H`,
  up: (amount = 1) => `${CSI}${amount}A`,
  down: (amount = 1) => `${CSI}${amount}B`,
  right: (amount = 1) => `${CSI}${amount}C`,
  left: (amount = 1) => `${CSI}${amount}D`,
  column: (column: number) => `${CSI}${column}G`,
  position: (row: number, column: number) => `${CSI}${row};${column}H`,
}

export const erase = {
  line: () => `${CSI}2K`,
  screen: () => `${CSI}2J`,
  fromCursor: {
    toBeginningOfScreen: () => `${CSI}1J`,
    toEndOfScreen: () => `${CSI}0J`,
  },
}

function identity(input: string) {
  return input
}

function format(open: string, close: string, reset: string = open) {
  return function (input: string) {
    let idx = input.indexOf(close, open.length)
    return ~idx
      ? `${open}${replaceClose(input, close, reset, idx)}${close}`
      : `${open}${input}${close}`
  }
}

function replaceClose(input: string, close: string, replace: string, idx: number) {
  let result = ''
  let cursor = 0

  do {
    result += input.substring(cursor, idx) + replace
    cursor = idx + close.length
    idx = input.indexOf(close, cursor)
  } while (~idx)

  return result + input.substring(cursor)
}

export const styles = {
  black: env.NO_COLOR ? identity : format(`${CSI}30m`, `${CSI}39m`),
  red: env.NO_COLOR ? identity : format(`${CSI}31m`, `${CSI}39m`),
  green: env.NO_COLOR ? identity : format(`${CSI}32m`, `${CSI}39m`),
  yellow: env.NO_COLOR ? identity : format(`${CSI}33m`, `${CSI}39m`),
  blue: env.NO_COLOR ? identity : format(`${CSI}34m`, `${CSI}39m`),
  magenta: env.NO_COLOR ? identity : format(`${CSI}35m`, `${CSI}39m`),
  cyan: env.NO_COLOR ? identity : format(`${CSI}36m`, `${CSI}39m`),
  white: env.NO_COLOR ? identity : format(`${CSI}37m`, `${CSI}39m`),
  gray: env.NO_COLOR ? identity : format(`${CSI}90m`, `${CSI}39m`),

  bgBlack: env.NO_COLOR ? identity : format(`${CSI}40m`, `${CSI}49m`),
  bgRed: env.NO_COLOR ? identity : format(`${CSI}41m`, `${CSI}49m`),
  bgGreen: env.NO_COLOR ? identity : format(`${CSI}42m`, `${CSI}49m`),
  bgYellow: env.NO_COLOR ? identity : format(`${CSI}43m`, `${CSI}49m`),
  bgBlue: env.NO_COLOR ? identity : format(`${CSI}44m`, `${CSI}49m`),
  bgMagenta: env.NO_COLOR ? identity : format(`${CSI}45m`, `${CSI}49m`),
  bgCyan: env.NO_COLOR ? identity : format(`${CSI}46m`, `${CSI}49m`),
  bgWhite: env.NO_COLOR ? identity : format(`${CSI}47m`, `${CSI}49m`),

  bold: env.NO_COLOR ? identity : format(`${CSI}1m`, `${CSI}22m`, `${CSI}22m${CSI}1m`),
  dim: env.NO_COLOR ? identity : format(`${CSI}2m`, `${CSI}22m`, `${CSI}22m${CSI}2m`),
  italic: env.NO_COLOR ? identity : format(`${CSI}3m`, `${CSI}23m`),
  underline: env.NO_COLOR ? identity : format(`${CSI}4m`, `${CSI}24m`),
  inverse: env.NO_COLOR ? identity : format(`${CSI}7m`, `${CSI}27m`),
  hidden: env.NO_COLOR ? identity : format(`${CSI}8m`, `${CSI}28m`),
  strikethrough: env.NO_COLOR ? identity : format(`${CSI}9m`, `${CSI}29m`),
  link: env.NO_COLOR
    ? (url: string, label?: string) => (label ? `[${label}](${url})` : url)
    : (url: string, label = url) => `${ESC}]8;;${url}${ESC}\\${label}${ESC}]8;;${ESC}\\`,
}
