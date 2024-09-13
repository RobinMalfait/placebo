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
