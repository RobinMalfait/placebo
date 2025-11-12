import { stripVTControlCharacters } from 'node:util'
import { describe, expect, it } from 'vitest'
import { print } from '../printer/printer'
import type { Diagnostic, Location } from '../types'

const html = String.raw
const css = String.raw
const javascript = String.raw

function diagnose(
  message: string,
  locations: Location[],
  rest: Partial<Diagnostic> = {},
): Diagnostic[] {
  return locations.map((location) => {
    return { file: '', message, location, ...rest } satisfies Diagnostic
  })
}

function findLocation(code: string, word: string, occurrences: number | number[] = 1): Location[] {
  if (!Array.isArray(occurrences)) {
    occurrences = [occurrences]
  }

  let result: Location[] = []
  for (let occurrence of occurrences) {
    let row = 0
    let col = 0

    let lines = code.split('\n')

    outer: for (let [rowIdx, line] of lines.entries()) {
      let offset = 0

      while (occurrence > 0) {
        let idx = line.indexOf(word, offset + 1)
        if (idx === -1) continue outer

        if (occurrence !== 1) {
          offset = idx
          occurrence--
          continue
        }

        row = rowIdx
        col = idx
        break outer
      }
    }

    result.push([
      [row + 1, col + 1],
      [row + 1, col + 1 + word.length],
    ])
  }

  return result
}

async function render(source: string, diagnostics: Diagnostic[][] = [], file = './example.txt') {
  const PRINT_WIDTH = 100
  let sources = new Map([[file, source]])

  let lines: string[] = []

  print(
    diagnostics.flat().map((d) => ({ ...d, file })),
    {
      write: (line) => lines.push(line),
      source: (file) => sources.get(file) || '',
      rendering: { printWidth: PRINT_WIDTH },
    },
  )

  let debug = false // For debugging width issues
  if (debug) {
    lines.unshift('\u25A1'.repeat(PRINT_WIDTH))
    lines.push('\u25A1'.repeat(PRINT_WIDTH))
  }

  return stripVTControlCharacters(lines.join('\n').trimEnd())
}

it('should print a message', async () => {
  let code = html`<div class="flex block" />`
  let diagnostics = [diagnose('Message 1', findLocation(code, 'flex'))]

  let result = await render(code, diagnostics, './example.html')

  expect(result).toMatchInlineSnapshot(`
    "
        ┌─[./example.html]
        │
    ∙ 1 │   <div class="flex block" />
        ·               ─┬──
        ·                ╰──── Message 1
        │
        └─"
  `)
})

it("should allow for diagnostics for places that don't exist", async () => {
  let code = javascript`
    console.log('Hello World')
  `
  let diagnostics = [
    diagnose(
      'Missing semicolon',
      findLocation(code, ')').map((x) => {
        x[0][1]++
        x[1][1]++
        return x
      }),
    ),
  ]

  let result = await render(code, diagnostics, './example.html')

  expect(result).toMatchInlineSnapshot(`
    "
        ┌─[./example.html]
        │
    ∙ 2 │   console.log('Hello World')
        ·                             ┬
        ·                             ╰── Missing semicolon
        │
        └─"
  `)
})

it('should print a message and re-indent it to save space', async () => {
  let code = `                                                 <div class="flex block" />`
  let diagnostics = [diagnose('Message 1', findLocation(code, 'flex'))]

  let result = await render(code, diagnostics, './example.html')

  expect(result).toMatchInlineSnapshot(`
    "
        ┌─[./example.html]
        │
    ∙ 1 │   <div class="flex block" />
        ·               ─┬──
        ·                ╰──── Message 1
        │
        └─"
  `)
})

it('should print a message and a note', async () => {
  let code = html`<div class="flex block" />`
  let diagnostics = [
    diagnose('Message 1', findLocation(code, 'flex'), {
      notes: 'This is a note',
    }),
  ]

  let result = await render(code, diagnostics, './example.html')

  expect(result).toMatchInlineSnapshot(`
    "
        ┌─[./example.html]
        │
    ∙ 1 │   <div class="flex block" />
        ·               ─┬──
        ·                ╰──── Message 1
        ·
        ├─
        ·   This is a note
        └─"
  `)
})

it('should flatten duplicate notes when they occur multiple times in the same block', async () => {
  let code = html`<div class="flex block" />`
  let diagnostics = [
    diagnose('Message 1', findLocation(code, 'flex'), {
      notes: 'This is a note',
    }),
    diagnose('Message 2', findLocation(code, 'block'), {
      notes: 'This is a note',
    }),
    diagnose('Message 3', findLocation(code, '/>'), {
      notes:
        'This is a separate note, but it is also very long so therefore we have to still make sure that this note gets cut in pieces.',
    }),
  ]

  let result = await render(code, diagnostics, './example.html')

  expect(result).toMatchInlineSnapshot(`
    "
        ┌─[./example.html]
        │
    ∙ 1 │   <div class="flex block" />
        ·               ─┬── ──┬──  ┬─
        ·                │     │    ╰─── Message 3
        ·                │     ╰──────── Message 2
        ·                ╰────────────── Message 1
        ·
        ├─
        ·   This is a separate note, but it is also very long so therefore we have to still make sure that this note gets cut in pieces.
        ├─
        ·   This is a note
        └─"
  `)
})

it('should print a message with multiple notes', async () => {
  let code = html`<div class="flex block" />`
  let diagnostics = [
    diagnose('Message 1', findLocation(code, 'flex'), {
      notes: ['- This is a note', '- This is another note', '- This is the last note'].join('\n'),
    }),
  ]

  let result = await render(code, diagnostics, './example.html')
  expect(result).toMatchInlineSnapshot(`
    "
        ┌─[./example.html]
        │
    ∙ 1 │   <div class="flex block" />
        ·               ─┬──
        ·                ╰──── Message 1
        ·
        ├─
        ·   - This is a note
        ·   - This is another note
        ·   - This is the last note
        └─"
  `)
})

it('should print nested notes in a hierarchy', async () => {
  let code = html`<div class="flex block" />`
  let diagnostics = [
    diagnose('Message 1', findLocation(code, 'flex'), {
      notes: [
        '- Heading 1',
        '- Heading 2',
        '  - Heading 3 A',
        '    - A',
        '    - B',
        '    - C',
        '  - Heading 3 B',
        '    - D',
        '    - E',
        '    - F',
      ].join('\n'),
    }),
  ]

  let result = await render(code, diagnostics, './example.html')
  expect(result).toMatchInlineSnapshot(`
    "
        ┌─[./example.html]
        │
    ∙ 1 │   <div class="flex block" />
        ·               ─┬──
        ·                ╰──── Message 1
        ·
        ├─
        ·   - Heading 1
        ·   - Heading 2
        ·     - Heading 3 A
        ·       - A
        ·       - B
        ·       - C
        ·     - Heading 3 B
        ·       - D
        ·       - E
        ·       - F
        └─"
  `)
})

it('should render syntax highlighted code in notes', async () => {
  let code = html`<div class="flex block" />`
  let notes = ['```css', '.flex {', '  display: flex;', '}', '```'].join('\n')

  let diagnostics = [
    diagnose('The generated CSS looks like:', findLocation(code, 'flex'), {
      notes,
    }),
  ]

  let result = await render(code, diagnostics, './example.html')
  expect(result).toMatchInlineSnapshot(`
    "
        ┌─[./example.html]
        │
    ∙ 1 │   <div class="flex block" />
        ·               ─┬──
        ·                ╰──── The generated CSS looks like:
        ·
        ├─
        ·   \`\`\`css
        ·   .flex {
        ·     display: flex;
        ·   }
        ·   \`\`\`
        └─"
  `)
})

it('should print multiple messages', async () => {
  let code = html`<div class="flex block" />`
  let diagnostics = [
    diagnose('Message 1', findLocation(code, 'flex')),
    diagnose('Message 2', findLocation(code, 'block')),
  ]

  let result = await render(code, diagnostics, './example.html')

  expect(result).toMatchInlineSnapshot(`
    "
        ┌─[./example.html]
        │
    ∙ 1 │   <div class="flex block" />
        ·               ─┬── ──┬──
        ·                │     ╰──── Message 2
        ·                ╰────────── Message 1
        │
        └─"
  `)
})

it('should squash multiple equal messages #1', async () => {
  let code = html`<div class="flex block" />`
  let diagnostics = [
    diagnose('I am a message', findLocation(code, 'flex')),
    diagnose('I am a message', findLocation(code, 'block')),
  ]

  let result = await render(code, diagnostics, './example.html')

  expect(result).toMatchInlineSnapshot(`
    "
        ┌─[./example.html]
        │
    ∙ 1 │   <div class="flex block" />
        ·               ─┬── ──┬──
        ·                ╰─────┴──── I am a message
        │
        └─"
  `)
})

it('should squash multiple equal messages #2', async () => {
  let code = html`<div class="flex block text-black text-white" />`
  let diagnostics = [
    diagnose('Colliding on the `display` property', findLocation(code, 'flex')),
    diagnose('Colliding on the `display` property', findLocation(code, 'block')),
    diagnose('Colliding on the `color` property', findLocation(code, 'text-black')),
    diagnose('Colliding on the `color` property', findLocation(code, 'text-white')),
  ]

  let result = await render(code, diagnostics, './example.html')

  expect(result).toMatchInlineSnapshot(`
    "
        ┌─[./example.html]
        │
    ∙ 1 │   <div class="flex block text-black text-white" />
        ·               ─┬── ──┬── ────┬───── ────┬─────
        ·                │     │       ╰──────────┴─────── Colliding on the \`color\` property
        ·                ╰─────┴────────────────────────── Colliding on the \`display\` property
        │
        └─"
  `)
})

it('should properly render multiple messages for the same location', async () => {
  let code = html`<div class="flex block" />`
  let diagnostics = [
    diagnose('This is an attribute in HTML', findLocation(code, 'class')),
    diagnose('This is a prop in React', findLocation(code, 'class')),
  ]

  let result = await render(code, diagnostics, './example.html')

  expect(result).toMatchInlineSnapshot(`
    "
        ┌─[./example.html]
        │
    ∙ 1 │   <div class="flex block" />
        ·        ──┬──
        ·          ├──── This is a prop in React
        ·          ╰──── This is an attribute in HTML
        │
        └─"
  `)
})

it('should not squash multiple equal messages if there is a message in between', async () => {
  let code = html`<div class="flex hidden block" />`
  let diagnostics = [
    diagnose('I am a message', findLocation(code, 'flex')),
    diagnose('I am another message', findLocation(code, 'hidden')),
    diagnose('I am a message', findLocation(code, 'block')),
  ]

  let result = await render(code, diagnostics, './example.html')

  expect(result).toMatchInlineSnapshot(`
    "
        ┌─[./example.html]
        │
    ∙ 1 │   <div class="flex hidden block" />
        ·               ─┬── ──┬─── ──┬──
        ·                │     │      ╰──── I am a message
        ·                │     ╰─────────── I am another message
        ·                ╰───────────────── I am a message
        │
        └─"
  `)
})

it('should print multiple messages with a note', async () => {
  let code = html`<div class="flex block" />`
  let diagnostics = [
    diagnose('Message 1', findLocation(code, 'flex'), { notes: 'I am a note' }),
    diagnose('Message 2', findLocation(code, 'block')),
  ]

  let result = await render(code, diagnostics, './example.html')

  expect(result).toMatchInlineSnapshot(`
    "
        ┌─[./example.html]
        │
    ∙ 1 │   <div class="flex block" />
        ·               ─┬── ──┬──
        ·                │     ╰──── Message 2
        ·                ╰────────── Message 1
        ·
        ├─
        ·   I am a note
        └─"
  `)
})

it('should print multiple messages with multiple notes', async () => {
  let code = html`<div class="flex block" />`
  let diagnostics = [
    diagnose('Message 1', findLocation(code, 'flex'), { notes: 'I am a note' }),
    diagnose('Message 2', findLocation(code, 'block'), {
      notes: ['- I am also a note', '- With another note'].join('\n'),
    }),
  ]

  let result = await render(code, diagnostics, './example.html')
  expect(result).toMatchInlineSnapshot(`
    "
        ┌─[./example.html]
        │
    ∙ 1 │   <div class="flex block" />
        ·               ─┬── ──┬──
        ·                │     ╰──── Message 2
        ·                ╰────────── Message 1
        ·
        ├─
        ·
        ·   - I am also a note
        ·   - With another note
        ·
        ├─
        ·   I am a note
        └─"
  `)
})

it('should be possible to print a lot of messages', async () => {
  let code = 'a b c d e f g h i j k l m n o p q r s t u v w x y z'
  let diagnostics = Array(26)
    .fill(0)
    .map((_, idx) => idx * 2)
    .map((col, idx) => diagnose(`Symbol at position: ${idx}`, findLocation(code, code[col])))

  let result = await render(code, diagnostics)

  expect(result).toMatchInlineSnapshot(`
    "
        ┌─[./example.txt]
        │
    ∙ 1 │   a b c d e f g h i j k l m n o p q r s t u v w x y z
        ·   ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬
        ·   │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ ╰── Symbol at position: 25
        ·   │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ ╰──── Symbol at position: 24
        ·   │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ ╰────── Symbol at position: 23
        ·   │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ ╰──────── Symbol at position: 22
        ·   │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ ╰────────── Symbol at position: 21
        ·   │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ ╰──────────── Symbol at position: 20
        ·   │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ ╰────────────── Symbol at position: 19
        ·   │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ ╰──────────────── Symbol at position: 18
        ·   │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ ╰────────────────── Symbol at position: 17
        ·   │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ ╰──────────────────── Symbol at position: 16
        ·   │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ ╰────────────────────── Symbol at position: 15
        ·   │ │ │ │ │ │ │ │ │ │ │ │ │ │ ╰──────────────────────── Symbol at position: 14
        ·   │ │ │ │ │ │ │ │ │ │ │ │ │ ╰────────────────────────── Symbol at position: 13
        ·   │ │ │ │ │ │ │ │ │ │ │ │ ╰──────────────────────────── Symbol at position: 12
        ·   │ │ │ │ │ │ │ │ │ │ │ ╰────────────────────────────── Symbol at position: 11
        ·   │ │ │ │ │ │ │ │ │ │ ╰──────────────────────────────── Symbol at position: 10
        ·   │ │ │ │ │ │ │ │ │ ╰────────────────────────────────── Symbol at position: 9
        ·   │ │ │ │ │ │ │ │ ╰──────────────────────────────────── Symbol at position: 8
        ·   │ │ │ │ │ │ │ ╰────────────────────────────────────── Symbol at position: 7
        ·   │ │ │ │ │ │ ╰──────────────────────────────────────── Symbol at position: 6
        ·   │ │ │ │ │ ╰────────────────────────────────────────── Symbol at position: 5
        ·   │ │ │ │ ╰──────────────────────────────────────────── Symbol at position: 4
        ·   │ │ │ ╰────────────────────────────────────────────── Symbol at position: 3
        ·   │ │ ╰──────────────────────────────────────────────── Symbol at position: 2
        ·   │ ╰────────────────────────────────────────────────── Symbol at position: 1
        ·   ╰──────────────────────────────────────────────────── Symbol at position: 0
        │
        └─"
  `)
})

it('should be possible to print a lot of similar messages', async () => {
  let code = 'a b c d e f g h i j k l m n o p q r s t u v w x y z'
  let diagnostics = Array(26)
    .fill(0)
    .map((_, idx) => idx * 2)
    .map((col) => diagnose('This is part of the alphabet', findLocation(code, code[col])))

  let result = await render(code, diagnostics)

  expect(result).toMatchInlineSnapshot(`
    "
        ┌─[./example.txt]
        │
    ∙ 1 │   a b c d e f g h i j k l m n o p q r s t u v w x y z
        ·   ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬
        ·   ╰─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴── This is part of the alphabet
        │
        └─"
  `)
})

it('should be possible to print messages across different lines', async () => {
  let code = html`
    <span class="bg-never-500"></span>
    <span class="bg-give-500"></span>
  `

  let diagnostics = [
    diagnose('gonna', findLocation(code, 'never')),
    diagnose('you up', findLocation(code, 'give')),
  ]

  let result = await render(code, diagnostics, './example.html')

  expect(result).toMatchInlineSnapshot(`
    "
        ┌─[./example.html]
        │
    ∙ 2 │   <span class="bg-never-500"></span>
        ·                   ──┬──
        ·                     ╰──── gonna
        ·
      3 │   <span class="bg-give-500"></span>
        │
        └─

        ┌─[./example.html]
        │
      2 │   <span class="bg-never-500"></span>
    ∙ 3 │   <span class="bg-give-500"></span>
        ·                   ─┬──
        ·                    ╰──── you up
        │
        └─"
  `)
})

it('should be possible to print messages across different lines and group them in the same context block', async () => {
  let code = html`
    <span class="bg-never-500"></span>
    <span class="bg-give-500"></span>
  `
  let diagnostics = [
    diagnose('gonna', findLocation(code, 'never'), { blockId: 'abc' }),
    diagnose('you up', findLocation(code, 'give'), { blockId: 'abc' }),
  ]

  let result = await render(code, diagnostics, './example.html')

  expect(result).toMatchInlineSnapshot(`
    "
        ┌─[./example.html]
        │
    ∙ 2 │   <span class="bg-never-500"></span>
        ·                   ──┬──
        ·                     ╰──── gonna
        ·
    ∙ 3 │   <span class="bg-give-500"></span>
        ·                   ─┬──
        ·                    ╰──── you up
        │
        └─"
  `)
})

it('should be possible to print messages across different lines including notes', async () => {
  let code = html`
    <span class="bg-never-500"></span>
    <span class="bg-give-500"></span>
  `
  let diagnostics = [
    diagnose('gonna', findLocation(code, 'never'), {
      notes: 'I am a note from message 1',
    }),
    diagnose('you up', findLocation(code, 'give'), {
      notes: 'I am a note from message 2',
    }),
  ]

  let result = await render(code, diagnostics, './example.html')
  expect(result).toMatchInlineSnapshot(`
    "
        ┌─[./example.html]
        │
    ∙ 2 │   <span class="bg-never-500"></span>
        ·                   ──┬──
        ·                     ╰──── gonna
        ·
      3 │   <span class="bg-give-500"></span>
        ·
        ├─
        ·   I am a note from message 1
        └─

        ┌─[./example.html]
        │
      2 │   <span class="bg-never-500"></span>
    ∙ 3 │   <span class="bg-give-500"></span>
        ·                   ─┬──
        ·                    ╰──── you up
        ·
        ├─
        ·   I am a note from message 2
        └─"
  `)
})

it('should be possible to print messages across different lines and group them in the same context block including notes', async () => {
  let code = html`
    <span class="bg-never-500"></span>
    <span class="bg-give-500"></span>
  `
  let diagnostics = [
    diagnose('gonna', findLocation(code, 'never'), {
      blockId: 'abc',
      notes: 'I am a note from message 1',
    }),
    diagnose('you up', findLocation(code, 'give'), {
      blockId: 'abc',
      notes: 'I am a note from message 2',
    }),
  ]

  let result = await render(code, diagnostics, './example.html')
  expect(result).toMatchInlineSnapshot(`
    "
        ┌─[./example.html]
        │
    ∙ 2 │   <span class="bg-never-500"></span>
        ·                   ──┬──
        ·                     ╰──── gonna
        ·
    ∙ 3 │   <span class="bg-give-500"></span>
        ·                   ─┬──
        ·                    ╰──── you up
        ·
        ├─
        ·   I am a note from message 1
        ├─
        ·   I am a note from message 2
        └─"
  `)
})

describe('context lines', () => {
  it('should be possible to print message with additional context', async () => {
    let code = html`
      <span class="a"></span>
      <span class="b"></span>
      <span class="c"></span>
      <span class="d"></span>
      <span class="e"></span>
      <span class="f"></span>
    `
    let diagnostics = [diagnose('With context lines around', findLocation(code, '"c"'))]

    let result = await render(code, diagnostics, './example.html')
    expect(result).toMatchInlineSnapshot(`
      "
          ┌─[./example.html]
          │
        2 │   <span class="a"></span>
        3 │   <span class="b"></span>
      ∙ 4 │   <span class="c"></span>
          ·               ─┬─
          ·                ╰─── With context lines around
          ·
        5 │   <span class="d"></span>
        6 │   <span class="e"></span>
        7 │   <span class="f"></span>
          │
          └─"
    `)
  })

  it('should not print non-existing leading context lines', async () => {
    let code = html`
      <span class="a"></span>
      <span class="b"></span>
      <span class="c"></span>
      <span class="d"></span>
      <span class="e"></span>
      <span class="f"></span>
    `
    let diagnostics = [diagnose('With context lines around', findLocation(code, '"b"'))]

    let result = await render(code, diagnostics, './example.html')
    expect(result).toMatchInlineSnapshot(`
      "
          ┌─[./example.html]
          │
        2 │   <span class="a"></span>
      ∙ 3 │   <span class="b"></span>
          ·               ─┬─
          ·                ╰─── With context lines around
          ·
        4 │   <span class="c"></span>
        5 │   <span class="d"></span>
        6 │   <span class="e"></span>
          │
          └─"
    `)
  })

  it('should not print non-existing trailing context lines', async () => {
    let code = html`
      <span class="a"></span>
      <span class="b"></span>
      <span class="c"></span>
      <span class="d"></span>
      <span class="e"></span>
      <span class="f"></span>
    `
    let diagnostics = [diagnose('With context lines around', findLocation(code, '"d"'))]

    let result = await render(code, diagnostics, './example.html')
    expect(result).toMatchInlineSnapshot(`
      "
          ┌─[./example.html]
          │
        2 │   <span class="a"></span>
        3 │   <span class="b"></span>
        4 │   <span class="c"></span>
      ∙ 5 │   <span class="d"></span>
          ·               ─┬─
          ·                ╰─── With context lines around
          ·
        6 │   <span class="e"></span>
        7 │   <span class="f"></span>
          │
          └─"
    `)
  })

  it('should squash overlapping context lines together', async () => {
    let code = html`
      <span class="a"></span>
      <span class="b"></span>
      <span class="c"></span>
      <span class="d"></span>
      <span class="e"></span>
      <span class="f"></span>
    `
    let diagnostics = [
      diagnose('With context lines around', findLocation(code, '"b"'), {
        blockId: 'abc',
      }),
      diagnose('With context lines around', findLocation(code, '"d"'), {
        blockId: 'abc',
      }),
    ]

    let result = await render(code, diagnostics, './example.html')
    expect(result).toMatchInlineSnapshot(`
      "
          ┌─[./example.html]
          │
        2 │   <span class="a"></span>
      ∙ 3 │   <span class="b"></span>
          ·               ─┬─
          ·                ╰─── With context lines around
          ·
        4 │   <span class="c"></span>
      ∙ 5 │   <span class="d"></span>
          ·               ─┬─
          ·                ╰─── With context lines around
          ·
        6 │   <span class="e"></span>
        7 │   <span class="f"></span>
          │
          └─"
    `)
  })

  it('should add an indication when there are context lines that are not immediately attached', async () => {
    let code = html`
      <span class="a"></span>
      <span class="b"></span>
      <span class="c"></span>
      <span class="d"></span>
      <span class="e"></span>
      <span class="f"></span>
      <span class="g"></span>
      <span class="h"></span>
      <span class="i"></span>
      <span class="j"></span>
      <span class="k"></span>
      <span class="l"></span>
      <span class="m"></span>
      <span class="n"></span>
    `
    let diagnostics = [
      diagnose('With context lines around', findLocation(code, '"b"'), {
        blockId: 'abc',
      }),
      diagnose('With context lines around', findLocation(code, '"l"'), {
        blockId: 'abc',
      }),
    ]

    let result = await render(code, diagnostics, './example.html')
    expect(result).toMatchInlineSnapshot(`
      "
           ┌─[./example.html]
           │
         2 │   <span class="a"></span>
      ∙  3 │   <span class="b"></span>
           ·               ─┬─
           ·                ╰─── With context lines around
           ·
         4 │   <span class="c"></span>
         5 │   <span class="d"></span>
         6 │   <span class="e"></span>
           ┊
        10 │   <span class="i"></span>
        11 │   <span class="j"></span>
        12 │   <span class="k"></span>
      ∙ 13 │   <span class="l"></span>
           ·               ─┬─
           ·                ╰─── With context lines around
           ·
        14 │   <span class="m"></span>
        15 │   <span class="n"></span>
           │
           └─"
    `)
  })
})

describe('squashing', () => {
  it('should be possible to squash context lines and diagnostics lines #1', async () => {
    let code = html`
      <html>
        <body>
          <div class="example"></div>
        </body>
      </html>
    `
    let diagnostics = [
      diagnose('This is indeed an example, good job!', findLocation(code, 'example')),
    ]

    let result = await render(code, diagnostics, './example.html')
    expect(result).toMatchInlineSnapshot(`
      "
          ┌─[./example.html]
          │
        2 │   <html>
        3 │     <body>
      ∙ 4 │       <div class="example"></div>
        5 │     </body>       ───┬───
        6 │   </html>            ╰───── This is indeed an example, good job!
          │
          └─"
    `)
  })

  it('should be possible to squash context lines and diagnostics lines #2', async () => {
    let code = css`
      @screen 2xl {
        html {
          @apply disabled:font-bold;
        }
      }
    `
    let diagnostics = [diagnose('@screen 2xl is not supported', findLocation(code, '2xl'))]

    let result = await render(code, diagnostics, './example.css')
    expect(result).toMatchInlineSnapshot(`
      "
          ┌─[./example.css]
          │
      ∙ 2 │   @screen 2xl {
          ·           ─┬─
          ·            ╰─── @screen 2xl is not supported
          ·
        3 │     html {
        4 │       @apply disabled:font-bold;
        5 │     }
          │
          └─"
    `)
  })
})

describe('multi-line diagnostics', () => {
  it('should be possible to print related diagnostics together spread across multiple lines (2x)', async () => {
    let code = javascript`
      let sum = (() => {
        let a = 123
        let b = 321

        return a + b
      })()
    `
    let diagnostics = [
      diagnose('This is a group', findLocation(code, '{'), {
        blockId: 'one',
        relatedId: 'one',
      }),
      diagnose('This is a group', findLocation(code, '}'), {
        blockId: 'one',
        relatedId: 'one',
      }),
    ]

    let result = await render(code, diagnostics, './example.js')
    expect(result).toMatchInlineSnapshot(`
      "
          ┌─[./example.js]
          │
      ∙ 2 │    let sum = (() => {
          ·                     ┬
          · ╭───────────────────╯
          · │
        3 │ │    let a = 123
        4 │ │    let b = 321
          · │
        6 │ │    return a + b
      ∙ 7 │ │  })()
          · │  ┬
          · ╰──┴── This is a group
          │
          └─"
    `)
  })

  it('should be possible to print related diagnostics together spread across multiple lines (3x)', async () => {
    let code = javascript`
      let sum = (() => {
        let a = 123
        let b = 321
        return a + b
      })()
    `
    let diagnostics = [
      diagnose('This is a group', findLocation(code, '{'), {
        blockId: 'one',
        relatedId: 'one',
      }),
      diagnose('This is a group', findLocation(code, 'b'), {
        blockId: 'one',
        relatedId: 'one',
      }),
      diagnose('This is a group', findLocation(code, '}'), {
        blockId: 'one',
        relatedId: 'one',
      }),
    ]

    let result = await render(code, diagnostics, './example.js')
    expect(result).toMatchInlineSnapshot(`
      "
          ┌─[./example.js]
          │
      ∙ 2 │    let sum = (() => {
          ·                     ┬
          · ╭───────────────────╯
          · │
        3 │ │    let a = 123
      ∙ 4 │ │    let b = 321
          · │        ┬
          · ├────────╯
          · │
        5 │ │    return a + b
      ∙ 6 │ │  })()
          · │  ┬
          · ╰──┴── This is a group
          │
          └─"
    `)
  })

  it('should be possible to print related diagnostics together spread across multiple lines but with very very large text (4x)', async () => {
    let code = javascript`
      let sum = (() => {
        let a = 123
        let b = 321
        return a + b
      })()
    `
    let diagnostics = [
      diagnose(
        'This is a group with a very long message so we should be able to render this as a multi-line message as well.',
        findLocation(code, '{'),
        { blockId: 'one', relatedId: 'one' },
      ),
      diagnose(
        'This is a group with a very long message so we should be able to render this as a multi-line message as well.',
        findLocation(code, 'b'),
        { blockId: 'one', relatedId: 'one' },
      ),
      diagnose(
        'This is a group with a very long message so we should be able to render this as a multi-line message as well.',
        findLocation(code, '}'),
        { blockId: 'one', relatedId: 'one' },
      ),
    ]

    let result = await render(code, diagnostics, './example.js')
    expect(result).toMatchInlineSnapshot(`
      "
          ┌─[./example.js]
          │
      ∙ 2 │    let sum = (() => {
          ·                     ┬
          · ╭───────────────────╯
          · │
        3 │ │    let a = 123
      ∙ 4 │ │    let b = 321
          · │        ┬
          · ├────────╯
          · │
        5 │ │    return a + b
      ∙ 6 │ │  })()
          · │  ┬ ╭─
          · ╰──┴─┤ This is a group with a very long message so we should
          ·      │ be able to render this as a multi-line message as well.
          ·      ╰─
          │
          └─"
    `)
  })

  it('should be possible to print related diagnostics together spread across multiple lines (5x)', async () => {
    let code = javascript`
      let sum = (() => {
        let a = 123
        let b = 321
        return a + b
      })()
    `
    let diagnostics = [
      diagnose('This is a group', findLocation(code, '{'), {
        blockId: 'one',
        relatedId: 'one',
      }),
      diagnose('This is a group', findLocation(code, 'b'), {
        blockId: 'one',
        relatedId: 'one',
      }),
      diagnose('This is a group', findLocation(code, 'a'), {
        blockId: 'one',
        relatedId: 'one',
      }),
      diagnose('This is a group', findLocation(code, '}'), {
        blockId: 'one',
        relatedId: 'one',
      }),
    ]

    let result = await render(code, diagnostics, './example.js')
    expect(result).toMatchInlineSnapshot(`
      "
          ┌─[./example.js]
          │
      ∙ 2 │    let sum = (() => {
          ·                     ┬
          · ╭───────────────────╯
          · │
      ∙ 3 │ │    let a = 123
          · │        ┬
          · ├────────╯
          · │
      ∙ 4 │ │    let b = 321
          · │        ┬
          · ├────────╯
          · │
        5 │ │    return a + b
      ∙ 6 │ │  })()
          · │  ┬
          · ╰──┴── This is a group
          │
          └─"
    `)
  })

  it('should drop "useless" empty line context lines between diagnostic lines', async () => {
    let code = javascript`
      let sum = (() => {
        let a = 123
        let b = 321

        return a + b
      })()
    `
    let diagnostics = [
      diagnose('This is a group', findLocation(code, '{'), {
        blockId: 'one',
        relatedId: 'one',
      }),
      diagnose('This is a group', findLocation(code, 'b'), {
        blockId: 'one',
        relatedId: 'one',
      }),
      diagnose('This is a group', findLocation(code, '}'), {
        blockId: 'one',
        relatedId: 'one',
      }),
    ]

    let result = await render(code, diagnostics, './example.js')

    expect(result).toMatchInlineSnapshot(`
      "
          ┌─[./example.js]
          │
      ∙ 2 │    let sum = (() => {
          ·                     ┬
          · ╭───────────────────╯
          · │
        3 │ │    let a = 123
      ∙ 4 │ │    let b = 321
          · │        ┬
          · ├────────╯
          · │
        6 │ │    return a + b
      ∙ 7 │ │  })()
          · │  ┬
          · ╰──┴── This is a group
          │
          └─"
    `)
  })

  it.skip('should be possible to print multiple related diagnostics together spread across multiple lines', async () => {
    let code = `
      a b c d e f g
      These lines are connected
      1 2 3 4 5 6 7
    `
    let blockId = 'one'
    let diagnostics = [
      diagnose('Pair 1', findLocation(code, 'a'), { blockId, relatedId: '0' }),
      diagnose('Pair 1', findLocation(code, '1'), { blockId, relatedId: '0' }),

      diagnose('Pair 2', findLocation(code, 'b'), { blockId, relatedId: '1' }),
      diagnose('Pair 2', findLocation(code, '2'), { blockId, relatedId: '1' }),

      diagnose('Pair 3', findLocation(code, 'c'), { blockId, relatedId: '2' }),
      diagnose('Pair 3', findLocation(code, '3'), { blockId, relatedId: '2' }),
    ]

    let result = await render(code, diagnostics)
    expect(result).toMatchInlineSnapshot('')
    expect(result).toMatchInlineSnapshot(`
    ┌─[./example.txt]
    │
∙ 2 │     a b c d e f g
    ·     ┬ ┬ ┬
    · ╭───╯ │ │
    · │╭────╯ │
    · ││╭─────╯
    · │││
  3 │ │││ These lines are connected
∙ 4 │ │││ 1 2 3 4 5 6 7
    · │││ ┬ ┬ ┬
    · ││╰─│─│─┴── Pair 3
    · │╰──│─┴──── Pair 2
    · ╰───┴────── Pair 1
    │
    └─`)
  })
})

describe('responsiveness', () => {
  describe('filename', () => {
    it('should ensure the file name is printed correctly when there is not enough room', async () => {
      let code = html`<div class="flex"></div>`
      let diagnostics = [diagnose('This applies a `display: flex;`', findLocation(code, 'flex'))]

      let result = await render(
        code,
        diagnostics,
        './products/tailwind-ui-marketing/components/contact-pages.03-split-with-image-and-centered-cta-section.html',
      )
      expect(result).toMatchInlineSnapshot(`
        "
            ┌─[./p/t/components/contact-pages.03-split-with-image-and-centered-cta-section.html]
            │
        ∙ 1 │   <div class="flex"></div>
            ·               ─┬──
            ·                ╰──── This applies a \`display: flex;\`
            │
            └─"
      `)
    })
  })

  describe('code', () => {
    it('should wrap the code, and add an ellipsis for context lines', async () => {
      let code = String.raw`
        <div class="min-h-full bg-white px-4 py-16 sm:px-6 sm:py-24 md:grid md:place-items-center lg:px-8">
          <div class="mx-auto max-w-max">
            <main class="sm:flex">
              <p class="text-4xl font-bold tracking-tight text-indigo-600 sm:text-5xl">404</p>
              <div class="sm:ml-6">
                <div class="mt-10 flex space-x-3 sm:border-l sm:border-transparent sm:pl-6">
                  <a href="#" class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Go back home</a>
                  <a href="#" class="inline-flex items-center rounded-md border border-transparent bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Contact support</a>
                </div>
              </div>
            </main>
          </div>
        </div>
      `
      let diagnostics = [
        diagnose('Diagnostic message 1', findLocation(code, 'inline-flex')),
        diagnose('Diagnostic message 2', findLocation(code, 'bg-indigo-600')),
        diagnose('Diagnostic message 3', findLocation(code, 'focus:ring-offset-2')),
      ]

      let result = await render(code, diagnostics, './example.js')
      expect(result).toMatchInlineSnapshot(`
        "
             ┌─[./example.js]
             │
           5 │   <p class="text-4xl font-bold tracking-tight text-indigo-600 sm:text-5xl">404</p>
           6 │   <div class="sm:ml-6">
           7 │     <div class="mt-10 flex space-x-3 sm:border-l sm:border-transparent sm:pl-6">
        ∙  8 │       <a href="#" class="inline-flex items-center rounded-md border 
             ·                          ─────┬─────
             ·                               ╰─────── Diagnostic message 1
             ·
             │         ↳ border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium 
             ·                              ──────┬──────
             ·                                    ╰──────── Diagnostic message 2
             ·
             │         ↳ text-white shadow-sm hover:bg-indigo-700 focus:outline-none 
             │         ↳ focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Go back 
             │         ↳ home</a>                           ─────────┬─────────
             ·                                                       ╰─────────── Diagnostic message 3
             ·
           9 │       <a href="#" class="inline-flex items-center rounded-md border border-transparent…
          10 │     </div>
          11 │   </div>
             │
             └─"
      `)
    })

    it('should split diagnostics that span 2 lines after wrapping into multiple diagnostics', async () => {
      let code = String.raw`
        <div class="min-h-full bg-white px-4 py-16 sm:px-6 sm:py-24 md:grid md:place-items-center lg:px-8">
          <div class="mx-auto max-w-max">
            <main class="sm:flex">
              <p class="text-4xl font-bold tracking-tight text-indigo-600 sm:text-5xl">404</p>
              <div class="sm:ml-6">
                <div class="mt-10 flex space-x-3 sm:border-l sm:border-transparent sm:pl-6">
                  <a href="#" class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Go back home</a>
                  <a href="#" class="inline-flex items-center rounded-md border border-transparent bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Contact support</a>
                </div>
              </div>
            </main>
          </div>
        </div>
      `
      let diagnostics = [
        diagnose(
          'Diagnostic message 4',
          findLocation(
            code,
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
            2,
          ),
        ),
      ]

      let result = await render(code, diagnostics, './example.js')
      expect(result).toMatchInlineSnapshot(`
        "
             ┌─[./example.js]
             │
           6 │     <div class="sm:ml-6">
           7 │       <div class="mt-10 flex space-x-3 sm:border-l sm:border-transparent sm:pl-6">
           8 │         <a href="#" class="inline-flex items-center rounded-md border border-transpare…
        ∙  9 │         <a href="#" class="inline-flex items-center rounded-md 
             │           ↳ border border-transparent bg-indigo-100 px-4 py-2 text-sm 
             │           ↳ font-medium text-indigo-700 hover:bg-indigo-200 focus:outline-none 
             ·                                                             ────────┬───────── ╭─
             ·                                                                     ╰──────────┤ Diagnostic
             │           ↳ focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Contact    │ message 4
             ·             ──────────────────────────┬─────────────────────────── ╭─          ╰─
             ·                                       ╰────────────────────────────┤ Diagnostic
             │           ↳ support</a>                                            │ message 4
          10 │       </div>                                                       ╰─
             ·
          11 │     </div>
          12 │   </main>
             │
             └─"
      `)
    })
  })

  describe('message wrapping', () => {
    it('should render multi-line messages', async () => {
      let code = html`<div class="text-grey-200"></div>`
      let diagnostics = [
        diagnose(
          'This color should be "gray" and not "grey". This is because the letter "a" has an ascii value of 97 but an "e" has an ascii value of 101. This means that "a" is cheaper to store. Lol, jk, I just need a long message here...',
          findLocation(code, 'grey'),
        ),
      ]

      let result = await render(code, diagnostics, './example.css')
      expect(result).toMatchInlineSnapshot(`
        "
            ┌─[./example.css]
            │
        ∙ 1 │   <div class="text-grey-200"></div>
            ·                    ─┬── ╭─
            ·                     ╰───┤ This color should be "gray" and not "grey". This is because
            ·                         │ the letter "a" has an ascii value of 97 but an "e" has
            ·                         │ an ascii value of 101. This means that "a" is cheaper
            ·                         │ to store. Lol, jk, I just need a long message here...
            ·                         ╰─
            │
            └─"
      `)
    })

    it('should squash context lines in multi-line messages', async () => {
      let code = html`
        <div>
          <div class="text-grey-200">
            <div></div>
          </div>
          <div>
            <div></div>
          </div>
        </div>
      `
      let diagnostics = [
        diagnose(
          'This color should be "gray" and not "grey". This is because the letter "a" has an ascii value of 97 but an "e" has an ascii value of 101. This means that "a" is cheaper to store. Lol, jk, I just need a long message here...',
          findLocation(code, 'grey'),
        ),
      ]

      let result = await render(code, diagnostics, './example.css')
      expect(result).toMatchInlineSnapshot(`
        "
            ┌─[./example.css]
            │
          2 │   <div>
        ∙ 3 │     <div class="text-grey-200">
          4 │       <div></div>    ─┬── ╭─
          5 │     </div>            ╰───┤ This color should be "gray" and not "grey". This is because
          6 │     <div>                 │ the letter "a" has an ascii value of 97 but an "e" has
            ·                           │ an ascii value of 101. This means that "a" is cheaper
            ·                           │ to store. Lol, jk, I just need a long message here...
            ·                           ╰─
            │
            └─"
      `)
    })

    it('should render 2 multi-line messages', async () => {
      let code = html`<div class="text-grey-200"></div>`
      let diagnostics = [
        diagnose(
          '(1) Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec pulvinar sapien sit amet tellus dapibus, ut mollis massa porta. Vivamus hendrerit semper risus, vel accumsan nisi iaculis non. Donec mollis massa sit amet lectus sagittis, vel faucibus quam condimentum.',
          findLocation(code, 'grey'),
        ),
        diagnose(
          '(2) Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec pulvinar sapien sit amet tellus dapibus, ut mollis massa porta. Vivamus hendrerit semper risus, vel accumsan nisi iaculis non. Donec mollis massa sit amet lectus sagittis, vel faucibus quam condimentum.',
          findLocation(code, '200'),
        ),
      ]
      let result = await render(code, diagnostics, './example.html')
      expect(result).toMatchInlineSnapshot(`
        "
            ┌─[./example.html]
            │
        ∙ 1 │   <div class="text-grey-200"></div>
            ·                    ─┬── ─┬─ ╭─
            ·                     │    ╰──┤ (2) Lorem ipsum dolor sit amet, consectetur adipiscing
            ·                     │       │ elit. Donec pulvinar sapien sit amet tellus dapibus,
            ·                     │       │ ut mollis massa porta. Vivamus hendrerit semper risus,
            ·                     │       │ vel accumsan nisi iaculis non. Donec mollis massa sit
            ·                     │       │ amet lectus sagittis, vel faucibus quam condimentum.
            ·                     │       ╰─
            ·                     │       ╭─
            ·                     ╰───────┤ (1) Lorem ipsum dolor sit amet, consectetur adipiscing
            ·                             │ elit. Donec pulvinar sapien sit amet tellus dapibus,
            ·                             │ ut mollis massa porta. Vivamus hendrerit semper risus,
            ·                             │ vel accumsan nisi iaculis non. Donec mollis massa sit
            ·                             │ amet lectus sagittis, vel faucibus quam condimentum.
            ·                             ╰─
            │
            └─"
      `)
    })

    it('should render 2 multi-line messages with a single one-liner in between', async () => {
      let code = html`<div class="text-grey-200"></div>`
      let diagnostics = [
        diagnose(
          '(1) Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec pulvinar sapien sit amet tellus dapibus, ut mollis massa porta.',
          findLocation(code, 'text'),
        ),
        diagnose('(2) Lorem ipsum.', findLocation(code, 'grey')),
        diagnose(
          '(3) Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec pulvinar sapien sit amet tellus dapibus, ut mollis massa porta.',
          findLocation(code, '200'),
        ),
      ]
      let result = await render(code, diagnostics, './example.css')
      expect(result).toMatchInlineSnapshot(`
        "
            ┌─[./example.css]
            │
        ∙ 1 │   <div class="text-grey-200"></div>
            ·               ─┬── ─┬── ─┬─ ╭─
            ·                │    │    ╰──┤ (3) Lorem ipsum dolor sit amet, consectetur
            ·                │    │       │ adipiscing elit. Donec pulvinar sapien sit
            ·                │    │       │ amet tellus dapibus, ut mollis massa porta.
            ·                │    │       ╰─
            ·                │    ╰──────── (2) Lorem ipsum.
            ·                │            ╭─
            ·                ╰────────────┤ (1) Lorem ipsum dolor sit amet, consectetur
            ·                             │ adipiscing elit. Donec pulvinar sapien sit
            ·                             │ amet tellus dapibus, ut mollis massa porta.
            ·                             ╰─
            │
            └─"
      `)
    })

    it('should render 2 multi-line diagnostics for the same location', async () => {
      let code = html`<div class="text-grey-200"></div>`
      let diagnostics = [
        diagnose(
          '(1) Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec pulvinar sapien sit amet tellus dapibus, ut mollis massa porta. Vivamus hendrerit semper risus, vel accumsan nisi iaculis non. Donec mollis massa sit amet lectus sagittis, vel faucibus quam condimentum.',
          findLocation(code, 'class'),
          { notes: 'Note A' },
        ),
        diagnose(
          '(2) Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec pulvinar sapien sit amet tellus dapibus, ut mollis massa porta. Vivamus hendrerit semper risus, vel accumsan nisi iaculis non. Donec mollis massa sit amet lectus sagittis, vel faucibus quam condimentum.',
          findLocation(code, 'class'),
          { notes: 'Note B' },
        ),
      ]
      let result = await render(code, diagnostics, './example.html')
      expect(result).toMatchInlineSnapshot(`
        "
            ┌─[./example.html]
            │
        ∙ 1 │   <div class="text-grey-200"></div>
            ·        ──┬── ╭─
            ·          ├───┤ (2) Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec
            ·          │   │ pulvinar sapien sit amet tellus dapibus, ut mollis massa porta.
            ·          │   │ Vivamus hendrerit semper risus, vel accumsan nisi iaculis non. Donec
            ·          │   │ mollis massa sit amet lectus sagittis, vel faucibus quam condimentum.
            ·          │   ╰─
            ·          │   ╭─
            ·          ╰───┤ (1) Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec
            ·              │ pulvinar sapien sit amet tellus dapibus, ut mollis massa porta.
            ·              │ Vivamus hendrerit semper risus, vel accumsan nisi iaculis non. Donec
            ·              │ mollis massa sit amet lectus sagittis, vel faucibus quam condimentum.
            ·              ╰─
            ·
            ├─
            ·   Note A
            ├─
            ·   Note B
            └─"
      `)
    })
  })

  describe('notes wrapping', () => {
    it('should wrap a single note that is too long', async () => {
      let code = html`<div class="text-grey-200"></div>`
      let diagnostics = [
        diagnose('This contains some notes', findLocation(code, 'class'), {
          notes:
            'The `class` you see here is an attribute in html, in React this is typically used as `className` instead. In Vue, you can use `class` but also use `:class` for more dynamic clases.',
        }),
      ]

      let result = await render(code, diagnostics, './example.html')
      expect(result).toMatchInlineSnapshot(`
        "
            ┌─[./example.html]
            │
        ∙ 1 │   <div class="text-grey-200"></div>
            ·        ──┬──
            ·          ╰──── This contains some notes
            ·
            ├─
            ·   The \`class\` you see here is an attribute in html, in React this is typically used as \`className\` instead. In Vue, you can use \`class\` but also use \`:class\` for more dynamic clases.
            └─"
      `)
    })

    it('should wrap multiple notes that are too long', async () => {
      let code = html`<div class="text-grey-200"></div>`
      let diagnostics = [
        diagnose('This contains some notes', findLocation(code, 'class'), {
          notes: [
            'The \`class\` you see here is an attribute in html, in React this is typically used as \`className\` instead.',
            'In Vue, you can use \`class\` but also use \`:class\` for more dynamic clases.',
          ].join('\n'),
        }),
      ]

      let result = await render(code, diagnostics, './example.html')
      expect(result).toMatchInlineSnapshot(`
        "
            ┌─[./example.html]
            │
        ∙ 1 │   <div class="text-grey-200"></div>
            ·        ──┬──
            ·          ╰──── This contains some notes
            ·
            ├─
            ·   The \`class\` you see here is an attribute in html, in React this is typically used as \`className\` instead.
            ·   In Vue, you can use \`class\` but also use \`:class\` for more dynamic clases.
            └─"
      `)
    })

    it('should wrap multiple nested notes that are too long', async () => {
      let code = html`<div class="text-grey-200"></div>`
      let diagnostics = [
        diagnose('This contains some notes', findLocation(code, 'class'), {
          notes: [
            '- The \`class\` you see here is an attribute in html, in React this is typically used as \`className\` instead.',
            '- In Vue, you can use \`class\` but also use \`:class\` for more dynamic clases.',
            '  - The same rules apply to the \`style\` prop, the \`style\` prop in React is still called \`style\`.',
            '    - Also one small caveat is that in React the \`style\` prop requires an object instead of a string with all the styles.',
            '  - However, in Vue, you can use \`style\` but also use \`:style\` for more dynamic styles.',
          ].join('\n'),
        }),
      ]

      let result = await render(code, diagnostics, './example.html')
      expect(result).toMatchInlineSnapshot(`
        "
            ┌─[./example.html]
            │
        ∙ 1 │   <div class="text-grey-200"></div>
            ·        ──┬──
            ·          ╰──── This contains some notes
            ·
            ├─
            ·   - The \`class\` you see here is an attribute in html, in React this is typically used as \`className\` instead.
            ·   - In Vue, you can use \`class\` but also use \`:class\` for more dynamic clases.
            ·     - The same rules apply to the \`style\` prop, the \`style\` prop in React is still called \`style\`.
            ·       - Also one small caveat is that in React the \`style\` prop requires an object instead of a string with all the styles.
            ·     - However, in Vue, you can use \`style\` but also use \`:style\` for more dynamic styles.
            └─"
      `)
    })
  })
})
