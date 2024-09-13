import { expect, it, vi } from 'vitest'

const html = String.raw

it('should highlight code', async () => {
  vi.stubEnv('FORCE_COLOR', 'true')
  vi.stubEnv('NO_COLOR', undefined)

  let { highlightCode } = await import('~/utils/highlight-code')

  let result = highlightCode(html`<span>Hello</span>`, 'html')
  expect(result).toEqual(
    '\x1B[90m<\x1B[34mspan\x1B[90m>\x1B[39mHello\x1B[90m</\x1B[34mspan\x1B[90m>\x1B[39m',
  )
})

// This is a bit stupid, but this just result in an array where each item is a character.
it('should rasterize the code (without highlight)', async () => {
  vi.stubEnv('FORCE_COLOR', undefined)
  vi.stubEnv('NO_COLOR', undefined)

  let { rasterizeCode } = await import('~/utils/highlight-code')
  let result = rasterizeCode(html`<span>Hello</span>`)

  expect(result).toEqual([
    ['<', 's', 'p', 'a', 'n', '>', 'H', 'e', 'l', 'l', 'o', '<', '/', 's', 'p', 'a', 'n', '>'],
  ])
})

it('should rasterize the code (with highlight)', async () => {
  vi.stubEnv('FORCE_COLOR', 'true')
  vi.stubEnv('NO_COLOR', undefined)

  let { highlightCode, rasterizeCode } = await import('~/utils/highlight-code')

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
