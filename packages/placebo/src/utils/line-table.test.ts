import dedent from 'dedent'
import { expect, test } from 'vitest'
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
  for (let i = 0; i < text.length; i++) {
    let position = table.find(i)
    let offset = table.findOffset(position)

    expect(offset).toBe(i)
  }
})
