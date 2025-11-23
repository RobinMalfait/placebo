import dedent from 'dedent'
import { expect, test } from 'vitest'
import type { Offset } from '../types'
import { createLineTable } from './line-table'

const css = dedent

test('line tables', () => {
  let text = css`
    .foo {
      color: red;
    }

    .magic {
      content: '🔥';
    }
  `
  text += '\n'

  let table = createLineTable(text)
  for (let i = 0 as Offset; i < text.length; i++) {
    let position = table.find(i)

    // Ensure line/column is 1-based
    expect(position.line).toBeGreaterThanOrEqual(1)
    expect(position.column).toBeGreaterThanOrEqual(1)

    let offset = table.findOffset(position)

    // Ensure offset is 0-based
    expect(offset).toBeGreaterThanOrEqual(0)

    // Ensure we are dealing with the same offset
    expect(offset).toBe(i)
  }
})
