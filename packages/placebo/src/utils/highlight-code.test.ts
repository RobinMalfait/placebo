import { expect, it } from 'vitest'
import { rasterizeCode } from '../utils/highlight-code'

const html = String.raw

// This is a bit stupid, but this just result in an array where each item is a character.
it('should rasterize the code (without highlight)', async () => {
  let result = rasterizeCode(html`<span>Hello</span>`)

  expect(result).toEqual([
    ['<', 's', 'p', 'a', 'n', '>', 'H', 'e', 'l', 'l', 'o', '<', '/', 's', 'p', 'a', 'n', '>'],
  ])
})
