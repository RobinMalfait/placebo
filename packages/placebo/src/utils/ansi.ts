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

export const styles = {
  black: env.NO_COLOR ? identity : (input: string) => `${CSI}30m${input}${CSI}0m`,
  red: env.NO_COLOR ? identity : (input: string) => `${CSI}31m${input}${CSI}0m`,
  green: env.NO_COLOR ? identity : (input: string) => `${CSI}32m${input}${CSI}0m`,
  yellow: env.NO_COLOR ? identity : (input: string) => `${CSI}33m${input}${CSI}0m`,
  blue: env.NO_COLOR ? identity : (input: string) => `${CSI}34m${input}${CSI}0m`,
  magenta: env.NO_COLOR ? identity : (input: string) => `${CSI}35m${input}${CSI}0m`,
  cyan: env.NO_COLOR ? identity : (input: string) => `${CSI}36m${input}${CSI}0m`,
  white: env.NO_COLOR ? identity : (input: string) => `${CSI}37m${input}${CSI}0m`,
  bgBlack: env.NO_COLOR ? identity : (input: string) => `${CSI}40m${input}${CSI}0m`,
  bgRed: env.NO_COLOR ? identity : (input: string) => `${CSI}41m${input}${CSI}0m`,
  bgGreen: env.NO_COLOR ? identity : (input: string) => `${CSI}42m${input}${CSI}0m`,
  bgYellow: env.NO_COLOR ? identity : (input: string) => `${CSI}43m${input}${CSI}0m`,
  bgBlue: env.NO_COLOR ? identity : (input: string) => `${CSI}44m${input}${CSI}0m`,
  bgMagenta: env.NO_COLOR ? identity : (input: string) => `${CSI}45m${input}${CSI}0m`,
  bgCyan: env.NO_COLOR ? identity : (input: string) => `${CSI}46m${input}${CSI}0m`,
  bgWhite: env.NO_COLOR ? identity : (input: string) => `${CSI}47m${input}${CSI}0m`,
  bold: env.NO_COLOR ? identity : (input: string) => `${CSI}1m${input}${CSI}0m`,
  dim: env.NO_COLOR ? identity : (input: string) => `${CSI}2m${input}${CSI}0m`,
  italic: env.NO_COLOR ? identity : (input: string) => `${CSI}3m${input}${CSI}0m`,
  underline: env.NO_COLOR ? identity : (input: string) => `${CSI}4m${input}${CSI}0m`,
  inverse: env.NO_COLOR ? identity : (input: string) => `${CSI}7m${input}${CSI}0m`,
  hidden: env.NO_COLOR ? identity : (input: string) => `${CSI}8m${input}${CSI}0m`,
  strikethrough: env.NO_COLOR ? identity : (input: string) => `${CSI}9m${input}${CSI}0m`,
  link: env.NO_COLOR
    ? (url: string, label?: string) => (label ? `[${label}](${url})` : url)
    : (url: string, label = url) => `\u001b]8;;${url}\u001b\\${label}\u001b]8;;\u001b\\`,
}
