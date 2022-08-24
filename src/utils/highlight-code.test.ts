let pc = require('picocolors')
let OLD_ENV = process.env

beforeEach(() => {
  jest.resetModules()
  process.env = { ...OLD_ENV }
})

afterAll(() => {
  process.env = OLD_ENV
})

let html = String.raw

it('should highlight code', () => {
  process.env.FORCE_COLOR = 'true'
  delete process.env.NO_COLOR
  let { highlightCode } = require('./highlight-code')

  let result = highlightCode(html`<span>Hello</span>`, 'html')
  expect(result).toEqual(
    '\x1B[90m<\x1B[34mspan\x1B[90m>\x1B[39mHello\x1B[90m</\x1B[34mspan\x1B[90m>\x1B[39m'
  )
})

// This is a bit stupid, but this just result in an array where each item is a character.
it('should rasterize the code (without highlight)', () => {
  let { rasterizeCode } = require('./highlight-code')
  let result = rasterizeCode(html`<span>Hello</span>`)

  expect(result).toEqual([
    ['<', 's', 'p', 'a', 'n', '>', 'H', 'e', 'l', 'l', 'o', '<', '/', 's', 'p', 'a', 'n', '>'],
  ])
})

it('should rasterize the code (with highlight)', () => {
  process.env.FORCE_COLOR = 'true'
  delete process.env.NO_COLOR
  let { highlightCode, rasterizeCode } = require('./highlight-code')

  let result = rasterizeCode(highlightCode(html`<span>Hello</span>`, 'html'))

  expect(result).toEqual([
    [
      '\x1B[90m<\x1B[39m',
      '\x1B[34ms\x1B[39m',
      '\x1B[34mp\x1B[39m',
      '\x1B[34ma\x1B[39m',
      '\x1B[34mn\x1B[39m',
      '\x1B[90m>\x1B[39m',
      'H',
      'e',
      'l',
      'l',
      'o',
      '\x1B[90m<\x1B[39m',
      '\x1B[90m/\x1B[39m',
      '\x1B[34ms\x1B[39m',
      '\x1B[34mp\x1B[39m',
      '\x1B[34ma\x1B[39m',
      '\x1B[34mn\x1B[39m',
      '\x1B[90m>\x1B[39m',
    ],
  ])
})
