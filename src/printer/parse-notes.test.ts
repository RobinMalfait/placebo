import { expect, it } from 'vitest'
import { parseNotes } from '~/printer/parse-notes'
import { clearAnsiEscapes } from '~/utils/highlight-code'

it('should parse no notes to a notes object', () => {
  expect(parseNotes(undefined)(80)).toEqual([])
})

it('should parse a string note to a notes object', () => {
  expect(parseNotes('Example notes')(80)).toEqual(['Example notes'])
})

it('should parse tables', () => {
  expect(
    parseNotes(
      `
      | Left | Center | Right |
      | :--- | :----: | ----: |
      | A    | B      | C     |
      | 1    | 2      | 3     |
      `,
    )(80).map((x) => clearAnsiEscapes(x)),
  ).toEqual([
    '┌──────┬────────┬───────┐',
    '│ Left │ Center │ Right │',
    '├──────┼────────┼───────┤',
    '│ A    │   B    │     C │',
    '├──────┼────────┼───────┤',
    '│ 1    │   2    │     3 │',
    '└──────┴────────┴───────┘',
  ])
})

it('should parse markdown-esque notes', () => {
  expect(
    parseNotes(
      `
        This issue only occurs in certain scenario's

        1. When the code is incorrect
        2. When the code is correct but some bits flipped
          - Because of some solar flares
        3. Because, reasons!

        You can solve it by doing something like:

        \`\`\`js
        console.log('Hello world:', 1 + 2)
        \`\`\`

        To make things easier, you can apply the following changes:

        \`\`\`diff-js
        - console.log('Hello w0rld:', 1 + 2)
        + console.log('Hello world:', 1 + 2)
        \`\`\`
      `,
    )(80).map((x) => clearAnsiEscapes(x)),
  ).toEqual([
    "This issue only occurs in certain scenario's",
    '',
    '1. When the code is incorrect',
    '2. When the code is correct but some bits flipped',
    '',
    '- Because of some solar flares',
    '',
    '3. Because, reasons!',
    '',
    'You can solve it by doing something like:',
    '',
    '```js',
    "console.log('Hello world:', 1 + 2)",
    '```',
    '',
    'To make things easier, you can apply the following changes:',
    '',
    '```js (diff)',
    "- console.log('Hello w0rld:', 1 + 2)",
    "+ console.log('Hello world:', 1 + 2)",
    '```',
  ])
})
