import { printer } from '~/printer/printer'
import type { Diagnostic, Location } from '~/types'
import { dedent } from '~/utils/dedent'

let html = String.raw
let css = String.raw
let javascript = String.raw

interface DeepArray<T> extends Array<T | DeepArray<T>> {}
type Notes = string | DeepArray<string>

function diagnose(
  message: string,
  location: Location,
  {
    notes = [],
    block,
    context,
  }: {
    notes?: Notes
    block?: string
    context?: string
  } = {}
): Diagnostic {
  return { file: '', block, context, message, location, notes }
}

function findLocation(code: string, word: string): Location {
  let row = code.split('\n').findIndex((row) => row.includes(word))
  let col = code.split('\n')[row].indexOf(word)
  let len = word.length

  return [
    [row + 1, col + 1],
    [row + 1, col + 1 + len],
  ]
}

function render(source: string, diagnostics: Diagnostic[] = [], file = './example.txt') {
  let sources = new Map([[file, source]])

  let lines: string[] = []
  function collector(...args: string[]) {
    lines.push(args.join(' '))
  }

  printer(
    sources,
    diagnostics.map((d) => ({ ...d, file })),
    collector
  )

  return lines.join('\n').trimEnd()
}

it('should print a message', () => {
  let code = html`<div class="flex block" />`
  let diagnostics = [diagnose('Message 1', findLocation(code, 'flex'))]

  let result = render(code, diagnostics, './example.html')

  expect(result).toEqual(`
    ┌─[./example.html]
    │
∙ 1 │   <div class="flex block" />
    ·               ─┬──
    ·                ╰──── Message 1
    │
    └─`)
})

it('should print a message and reindent it to save space', () => {
  let code = `                                                 <div class="flex block" />`
  let diagnostics = [diagnose('Message 1', findLocation(code, 'flex'))]

  let result = render(code, diagnostics, './example.html')

  expect(result).toEqual(`
    ┌─[./example.html]
    │
∙ 1 │   <div class="flex block" />
    ·               ─┬──
    ·                ╰──── Message 1
    │
    └─`)
})

it('should print a message and a note', () => {
  let code = html`<div class="flex block" />`
  let diagnostics = [
    diagnose('Message 1', findLocation(code, 'flex'), { notes: ['This is a note'] }),
  ]

  let result = render(code, diagnostics, './example.html')

  expect(result).toEqual(`
    ┌─[./example.html]
    │
∙ 1 │   <div class="flex block" />
    ·               ─┬──
    ·                ╰──── Message 1
    ·
    ├─
    ·   NOTE: This is a note
    └─`)
})

it('should split a single note with \\n into multiple notes', () => {
  let code = html`<div class="flex block" />`
  let diagnostics = [
    diagnose('Message 1', findLocation(code, 'flex'), { notes: ['This is\na note'] }),
  ]

  let result = render(code, diagnostics, './example.html')

  expect(result).toEqual(`
    ┌─[./example.html]
    │
∙ 1 │   <div class="flex block" />
    ·               ─┬──
    ·                ╰──── Message 1
    ·
    ├─
    ·   NOTES:
    ·     - This is
    ·     - a note
    └─`)
})

it('should print a message with multiple notes', () => {
  let code = html`<div class="flex block" />`
  let diagnostics = [
    diagnose('Message 1', findLocation(code, 'flex'), {
      notes: ['This is a note', 'This is another note', 'This is the last note'],
    }),
  ]

  let result = render(code, diagnostics, './example.html')

  expect(result).toEqual(`
    ┌─[./example.html]
    │
∙ 1 │   <div class="flex block" />
    ·               ─┬──
    ·                ╰──── Message 1
    ·
    ├─
    ·   NOTES:
    ·     - This is a note
    ·     - This is another note
    ·     - This is the last note
    └─`)
})

it('should print nested notes in a hierarchy', () => {
  let code = html`<div class="flex block" />`
  let diagnostics = [
    diagnose('Message 1', findLocation(code, 'flex'), {
      notes: [
        'Heading 1',
        ['Heading 2', ['Heading 3 A', ['A', 'B', 'C']], ['Heading 3 B', ['D', 'E', 'F']]],
      ],
    }),
  ]

  let result = render(code, diagnostics, './example.html')

  expect(result).toEqual(`
    ┌─[./example.html]
    │
∙ 1 │   <div class="flex block" />
    ·               ─┬──
    ·                ╰──── Message 1
    ·
    ├─
    ·   NOTE: Heading 1
    ·       - Heading 2
    ·         - Heading 3 A
    ·           - A
    ·           - B
    ·           - C
    ·         - Heading 3 B
    ·           - D
    ·           - E
    ·           - F
    └─`)
})

it('should render syntax highlighted code in notes', () => {
  let code = html`<div class="flex block" />`
  let notes =
    '```css\n' +
    dedent(css`
      .flex {
        display: flex;
      }
    `) +
    '\n```'

  let diagnostics = [
    diagnose('The generated CSS looks like:', findLocation(code, 'flex'), {
      notes,
    }),
  ]

  let result = render(code, diagnostics, './example.html')
  expect(result).toEqual(`
    ┌─[./example.html]
    │
∙ 1 │   <div class="flex block" />
    ·               ─┬──
    ·                ╰──── The generated CSS looks like:
    ·
    ├─
    ·   NOTES:
    ·       \`\`\`css
    ·       .flex {
    ·         display: flex;
    ·       }
    ·       \`\`\`
    └─`)
})

it('should print multiple messages', () => {
  let code = html`<div class="flex block" />`
  let diagnostics = [
    diagnose('Message 1', findLocation(code, 'flex')),
    diagnose('Message 2', findLocation(code, 'block')),
  ]

  let result = render(code, diagnostics, './example.html')

  expect(result).toEqual(`
    ┌─[./example.html]
    │
∙ 1 │   <div class="flex block" />
    ·               ─┬── ──┬──
    ·                │     ╰──── Message 2
    ·                ╰────────── Message 1
    │
    └─`)
})

it('should squash multiple equal messages #1', () => {
  let code = html`<div class="flex block" />`
  let diagnostics = [
    diagnose('I am a message', findLocation(code, 'flex')),
    diagnose('I am a message', findLocation(code, 'block')),
  ]

  let result = render(code, diagnostics, './example.html')

  expect(result).toEqual(`
    ┌─[./example.html]
    │
∙ 1 │   <div class="flex block" />
    ·               ─┬── ──┬──
    ·                ╰─────┴──── I am a message
    │
    └─`)
})

it('should squash multiple equal messages #2', () => {
  let code = html`<div class="flex block text-black text-white" />`
  let diagnostics = [
    diagnose('Colliding on the `display` property', findLocation(code, 'flex')),
    diagnose('Colliding on the `display` property', findLocation(code, 'block')),
    diagnose('Colliding on the `color` property', findLocation(code, 'text-black')),
    diagnose('Colliding on the `color` property', findLocation(code, 'text-white')),
  ]

  let result = render(code, diagnostics, './example.html')

  expect(result).toEqual(`
    ┌─[./example.html]
    │
∙ 1 │   <div class=\"flex block text-black text-white\" />
    ·               ─┬── ──┬── ────┬───── ────┬─────
    ·                │     │       ╰──────────┴─────── Colliding on the \`color\` property
    ·                ╰─────┴────────────────────────── Colliding on the \`display\` property
    │
    └─`)
})

it('should properly render multiple messages for the same location', () => {
  let code = html`<div class="flex block" />`
  let diagnostics = [
    diagnose('This is an attribute in HTML', findLocation(code, 'class')),
    diagnose('This is a prop in React', findLocation(code, 'class')),
  ]

  let result = render(code, diagnostics, './example.html')

  expect(result).toEqual(`
    ┌─[./example.html]
    │
∙ 1 │   <div class="flex block" />
    ·        ──┬──
    ·          ├──── This is a prop in React
    ·          ╰──── This is an attribute in HTML
    │
    └─`)
})

it('should not squash multiple equal messages if there is a message in between', () => {
  let code = html`<div class="flex hidden block" />`
  let diagnostics = [
    diagnose('I am a message', findLocation(code, 'flex')),
    diagnose('I am another message', findLocation(code, 'hidden')),
    diagnose('I am a message', findLocation(code, 'block')),
  ]

  let result = render(code, diagnostics, './example.html')

  expect(result).toEqual(`
    ┌─[./example.html]
    │
∙ 1 │   <div class=\"flex hidden block\" />
    ·               ─┬── ──┬─── ──┬──
    ·                │     │      ╰──── I am a message
    ·                │     ╰─────────── I am another message
    ·                ╰───────────────── I am a message
    │
    └─`)
})

it('should print multiple messages with a note', () => {
  let code = html`<div class="flex block" />`
  let diagnostics = [
    diagnose('Message 1', findLocation(code, 'flex'), { notes: ['I am a note'] }),
    diagnose('Message 2', findLocation(code, 'block')),
  ]

  let result = render(code, diagnostics, './example.html')

  expect(result).toEqual(`
    ┌─[./example.html]
    │
∙ 1 │   <div class="flex block" />
    ·               ─┬── ──┬──
    ·                │     ╰──── Message 2
    ·                ╰────────── Message 1
    ·
    ├─
    ·   NOTE: I am a note
    └─`)
})

it('should print multiple messages with multiple notes', () => {
  let code = html`<div class="flex block" />`
  let diagnostics = [
    diagnose('Message 1', findLocation(code, 'flex'), { notes: ['I am a note'] }),
    diagnose('Message 2', findLocation(code, 'block'), {
      notes: ['I am also a note', 'With another note'],
    }),
  ]

  let result = render(code, diagnostics, './example.html')

  expect(result).toEqual(`
    ┌─[./example.html]
    │
∙ 1 │   <div class="flex block" />
    ·               ─┬── ──┬──
    ·                │     ╰──── Message 2⁽¹⁾
    ·                ╰────────── Message 1⁽²⁾
    ·
    ├─
    ·   NOTES:
    ·     1. I am also a note
    ·     1. With another note
    ·     2. I am a note
    └─`)
})

it('should be possible to print a lot of messages', () => {
  let code = `a b c d e f g h i j k l m n o p q r s t u v w x y z`
  let diagnostics = Array(26)
    .fill(0)
    .map((_, idx) => idx * 2)
    .map((col, idx) =>
      diagnose(`Symbol at position: ${idx}`, [
        [1, col + 1],
        [1, col + 1 + 1],
      ])
    )

  let result = render(code, diagnostics)

  expect(result).toEqual(`
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
    └─`)
})

it('should be possible to print a lot of similar messages', () => {
  let code = `a b c d e f g h i j k l m n o p q r s t u v w x y z`
  let diagnostics = Array(26)
    .fill(0)
    .map((_, idx) => idx * 2)
    .map((col) =>
      diagnose('This is part of the alphabet', [
        [1, col + 1],
        [1, col + 1 + 1],
      ])
    )

  let result = render(code, diagnostics)

  expect(result).toEqual(`
    ┌─[./example.txt]
    │
∙ 1 │   a b c d e f g h i j k l m n o p q r s t u v w x y z
    ·   ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬ ┬
    ·   ╰─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴── This is part of the alphabet
    │
    └─`)
})

it('should be possible to print messages across different lines', () => {
  let code = html`
    <span class="bg-never-500"></span>
    <span class="bg-give-500"></span>
  `

  let diagnostics = [
    diagnose('gonna', findLocation(code, 'never')),
    diagnose('you up', findLocation(code, 'give')),
  ]

  let result = render(code, diagnostics, './example.html')

  expect(result).toEqual(`
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
    └─`)
})

it('should be possible to print messages across different lines and group them in the same context block', () => {
  let code = html`
    <span class="bg-never-500"></span>
    <span class="bg-give-500"></span>
  `
  let diagnostics = [
    diagnose('gonna', findLocation(code, 'never'), { block: 'abc' }),
    diagnose('you up', findLocation(code, 'give'), { block: 'abc' }),
  ]

  let result = render(code, diagnostics, './example.html')

  expect(result).toEqual(`
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
    └─`)
})

it('should be possible to print messages across different lines including notes', () => {
  let code = html`
    <span class="bg-never-500"></span>
    <span class="bg-give-500"></span>
  `
  let diagnostics = [
    diagnose('gonna', findLocation(code, 'never'), { notes: ['I am a note from message 1'] }),
    diagnose('you up', findLocation(code, 'give'), { notes: ['I am a note from message 2'] }),
  ]

  let result = render(code, diagnostics, './example.html')

  expect(result).toEqual(`
    ┌─[./example.html]
    │
∙ 2 │   <span class="bg-never-500"></span>
    ·                   ──┬──
    ·                     ╰──── gonna
    ·
  3 │   <span class="bg-give-500"></span>
    ·
    ├─
    ·   NOTE: I am a note from message 1
    └─

    ┌─[./example.html]
    │
  2 │   <span class="bg-never-500"></span>
∙ 3 │   <span class="bg-give-500"></span>
    ·                   ─┬──
    ·                    ╰──── you up
    ·
    ├─
    ·   NOTE: I am a note from message 2
    └─`)
})

it('should be possible to print messages across different lines and group them in the same context block including notes', () => {
  let code = html`
    <span class="bg-never-500"></span>
    <span class="bg-give-500"></span>
  `
  let diagnostics = [
    diagnose('gonna', findLocation(code, 'never'), {
      block: 'abc',
      notes: ['I am a note from message 1'],
    }),
    diagnose('you up', findLocation(code, 'give'), {
      block: 'abc',
      notes: ['I am a note from message 2'],
    }),
  ]

  let result = render(code, diagnostics, './example.html')

  expect(result).toEqual(`
    ┌─[./example.html]
    │
∙ 2 │   <span class="bg-never-500"></span>
    ·                   ──┬──
    ·                     ╰──── gonna⁽¹⁾
    ·
∙ 3 │   <span class="bg-give-500"></span>
    ·                   ─┬──
    ·                    ╰──── you up⁽²⁾
    ·
    ├─
    ·   NOTES:
    ·     1. I am a note from message 1
    ·     2. I am a note from message 2
    └─`)
})

describe('context lines', () => {
  it('should be possible to print message with additional context', () => {
    let code = html`
      <span class="a"></span>
      <span class="b"></span>
      <span class="c"></span>
      <span class="d"></span>
      <span class="e"></span>
      <span class="f"></span>
    `
    let diagnostics = [diagnose('With context lines around', findLocation(code, '"c"'))]

    let result = render(code, diagnostics, './example.html')
    expect(result).toEqual(`
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
    └─`)
  })

  it('should not print non-existing leading context lines', () => {
    let code = html`
      <span class="a"></span>
      <span class="b"></span>
      <span class="c"></span>
      <span class="d"></span>
      <span class="e"></span>
      <span class="f"></span>
    `
    let diagnostics = [diagnose('With context lines around', findLocation(code, '"b"'))]

    let result = render(code, diagnostics, './example.html')
    expect(result).toEqual(`
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
    └─`)
  })

  it('should not print non-existing trailing context lines', () => {
    let code = html`
      <span class="a"></span>
      <span class="b"></span>
      <span class="c"></span>
      <span class="d"></span>
      <span class="e"></span>
      <span class="f"></span>
    `
    let diagnostics = [diagnose('With context lines around', findLocation(code, '"d"'))]

    let result = render(code, diagnostics, './example.html')
    expect(result).toEqual(`
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
    └─`)
  })

  it('should squash overlapping context lines together', () => {
    let code = html`
      <span class="a"></span>
      <span class="b"></span>
      <span class="c"></span>
      <span class="d"></span>
      <span class="e"></span>
      <span class="f"></span>
    `
    let diagnostics = [
      diagnose('With context lines around', findLocation(code, '"b"'), { block: 'abc' }),
      diagnose('With context lines around', findLocation(code, '"d"'), { block: 'abc' }),
    ]

    let result = render(code, diagnostics, './example.html')
    expect(result).toEqual(`
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
    └─`)
  })

  it('should add an indication when there are context lines that are not immediately attached', () => {
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
      diagnose('With context lines around', findLocation(code, '"b"'), { block: 'abc' }),
      diagnose('With context lines around', findLocation(code, '"l"'), { block: 'abc' }),
    ]

    let result = render(code, diagnostics, './example.html')
    expect(result).toEqual(`
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
     └─`)
  })
})

describe('squashing', () => {
  it('should be possible to squash context lines and diagnostics lines #1', () => {
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

    let result = render(code, diagnostics, './example.html')
    expect(result).toEqual(`
    ┌─[./example.html]
    │
  2 │   <html>
  3 │     <body>
∙ 4 │       <div class="example"></div>
  5 │     </body>       ───┬───
  6 │   </html>            ╰───── This is indeed an example, good job!
    │
    └─`)
  })

  it('should be possible to squash context lines and diagnostics lines #2', () => {
    let code = css`
      @screen 2xl {
        html {
          @apply disabled:font-bold;
        }
      }
    `
    let diagnostics = [diagnose('@screen 2xl is not supported', findLocation(code, '2xl'))]

    let result = render(code, diagnostics, './example.css')
    expect(result).toEqual(`
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
    └─`)
  })
})

describe('message wrapping', () => {
  it('should render multi-line messages', () => {
    let code = html`<div class="text-grey-200"></div>`
    let diagnostics = [
      diagnose(
        'This color should be "gray" and not "grey". This is because the letter "a" has an ascii value of 97 but an "e" has an ascii value of 101. This means that "a" is cheaper to store. Lol, jk, I just need a long message here...',
        findLocation(code, 'grey')
      ),
    ]

    let result = render(code, diagnostics, './example.css')
    expect(result).toEqual(`
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
    └─`)
  })

  it('should squash context lines in multi-line messages', () => {
    let code = html`<div>
      <div class="text-grey-200">
        <div></div>
      </div>
      <div>
        <div></div>
      </div>
    </div>`
    let diagnostics = [
      diagnose(
        'This color should be "gray" and not "grey". This is because the letter "a" has an ascii value of 97 but an "e" has an ascii value of 101. This means that "a" is cheaper to store. Lol, jk, I just need a long message here...',
        findLocation(code, 'grey')
      ),
    ]

    let result = render(code, diagnostics, './example.css')
    expect(result).toEqual(`
    ┌─[./example.css]
    │
  1 │   <div>
∙ 2 │         <div class="text-grey-200">
  3 │           <div></div>    ─┬── ╭─
  4 │         </div>            ╰───┤ This color should be "gray" and not "grey". This is because
  5 │         <div>                 │ the letter "a" has an ascii value of 97 but an "e" has
    ·                               │ an ascii value of 101. This means that "a" is cheaper
    ·                               │ to store. Lol, jk, I just need a long message here...
    ·                               ╰─
    │
    └─`)
  })

  it('should render 2 multi-line messages', () => {
    let code = html`<div class="text-grey-200"></div>`
    let diagnostics = [
      diagnose(
        '(1) Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec pulvinar sapien sit amet tellus dapibus, ut mollis massa porta. Vivamus hendrerit semper risus, vel accumsan nisi iaculis non. Donec mollis massa sit amet lectus sagittis, vel faucibus quam condimentum.',
        findLocation(code, 'grey')
      ),
      diagnose(
        '(2) Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec pulvinar sapien sit amet tellus dapibus, ut mollis massa porta. Vivamus hendrerit semper risus, vel accumsan nisi iaculis non. Donec mollis massa sit amet lectus sagittis, vel faucibus quam condimentum.',
        findLocation(code, '200')
      ),
    ]
    let result = render(code, diagnostics, './example.html')
    expect(result).toEqual(`
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
    └─`)
  })

  it('should render 2 multi-line messages with a single one-liner in between', () => {
    let code = html`<div class="text-grey-200"></div>`
    let diagnostics = [
      diagnose(
        '(1) Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec pulvinar sapien sit amet tellus dapibus, ut mollis massa porta.',
        findLocation(code, 'text')
      ),
      diagnose('(2) Lorem ipsum.', findLocation(code, 'grey')),
      diagnose(
        '(3) Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec pulvinar sapien sit amet tellus dapibus, ut mollis massa porta.',
        findLocation(code, '200')
      ),
    ]
    let result = render(code, diagnostics, './example.css')
    expect(result).toEqual(`
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
    └─`)
  })

  it('should render 2 multi-line diagnostics for the same location', () => {
    let code = html`<div class="text-grey-200"></div>`
    let diagnostics = [
      diagnose(
        '(1) Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec pulvinar sapien sit amet tellus dapibus, ut mollis massa porta. Vivamus hendrerit semper risus, vel accumsan nisi iaculis non. Donec mollis massa sit amet lectus sagittis, vel faucibus quam condimentum.',
        findLocation(code, 'class'),
        { notes: 'Note A' }
      ),
      diagnose(
        '(1) Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec pulvinar sapien sit amet tellus dapibus, ut mollis massa porta. Vivamus hendrerit semper risus, vel accumsan nisi iaculis non. Donec mollis massa sit amet lectus sagittis, vel faucibus quam condimentum.',
        findLocation(code, 'class'),
        { notes: 'Note B' }
      ),
    ]
    let result = render(code, diagnostics, './example.html')
    expect(result).toEqual(`
    ┌─[./example.html]
    │
∙ 1 │   <div class="text-grey-200"></div>
    ·        ──┬── ╭─
    ·          ├───┤ (1) Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec
    ·          │   │ pulvinar sapien sit amet tellus dapibus, ut mollis massa porta. Vivamus
    ·          │   │ hendrerit semper risus, vel accumsan nisi iaculis non. Donec mollis
    ·          │   │ massa sit amet lectus sagittis, vel faucibus quam condimentum.⁽²⁾
    ·          │   ╰─
    ·          │   ╭─
    ·          ╰───┤ (1) Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec
    ·              │ pulvinar sapien sit amet tellus dapibus, ut mollis massa porta. Vivamus
    ·              │ hendrerit semper risus, vel accumsan nisi iaculis non. Donec mollis
    ·              │ massa sit amet lectus sagittis, vel faucibus quam condimentum.⁽¹⁾
    ·              ╰─
    ·
    ├─
    ·   NOTES:
    ·     1. Note A
    ·     2. Note B
    └─`)
  })
})

describe('notes wrapping', () => {
  it('should wrap a single note that is too long', () => {
    let code = html`<div class="text-grey-200"></div>`
    let diagnostics = [
      diagnose('This contains some notes', findLocation(code, 'class'), {
        notes:
          'The `class` you see here is an attribute in html, in React this is typically used as `className` instead. In Vue, you can use `class` but also use `:class` for more dynamic clases.',
      }),
    ]

    let result = render(code, diagnostics, './example.html')
    expect(result).toEqual(`
    ┌─[./example.html]
    │
∙ 1 │   <div class=\"text-grey-200\"></div>
    ·        ──┬──
    ·          ╰──── This contains some notes
    ·
    ├─
    ·   NOTE: The \`class\` you see here is an attribute in html, in React
    ·         this is typically used as \`className\` instead. In Vue, you can
    ·         use \`class\` but also use \`:class\` for more dynamic clases.
    └─`)
  })

  it('should wrap multiple notes that are too long', () => {
    let code = html`<div class="text-grey-200"></div>`
    let diagnostics = [
      diagnose('This contains some notes', findLocation(code, 'class'), {
        notes: [
          'The `class` you see here is an attribute in html, in React this is typically used as `className` instead.',
          'In Vue, you can use `class` but also use `:class` for more dynamic clases.',
        ],
      }),
    ]

    let result = render(code, diagnostics, './example.html')
    expect(result).toEqual(`
    ┌─[./example.html]
    │
∙ 1 │   <div class="text-grey-200"></div>
    ·        ──┬──
    ·          ╰──── This contains some notes
    ·
    ├─
    ·   NOTES:
    ·     - The \`class\` you see here is an attribute in html, in
    ·       React this is typically used as \`className\` instead.
    ·     - In Vue, you can use \`class\` but also use \`:class\` for more dynamic clases.
    └─`)
  })

  it('should wrap multiple nested notes that are too long', () => {
    let code = html`<div class="text-grey-200"></div>`
    let diagnostics = [
      diagnose('This contains some notes', findLocation(code, 'class'), {
        notes: [
          'The `class` you see here is an attribute in html, in React this is typically used as `className` instead.',
          'In Vue, you can use `class` but also use `:class` for more dynamic clases.',
          [
            'The same rules apply to the `style` prop, the `style` prop in React is still called `style`.',
            [
              'Also one small caveat is that in React the `style` prop requires an object instead of a string with all the styles.',
            ],
            'However, in Vue, you can use `style` but also use `:style` for more dynamic styles.',
          ],
        ],
      }),
    ]

    let result = render(code, diagnostics, './example.html')
    expect(result).toEqual(`
    ┌─[./example.html]
    │
∙ 1 │   <div class="text-grey-200"></div>
    ·        ──┬──
    ·          ╰──── This contains some notes
    ·
    ├─
    ·   NOTES:
    ·     - The \`class\` you see here is an attribute in html, in
    ·       React this is typically used as \`className\` instead.
    ·     - In Vue, you can use \`class\` but also use \`:class\` for more dynamic clases.
    ·       - The same rules apply to the \`style\` prop, the
    ·         \`style\` prop in React is still called \`style\`.
    ·         - Also one small caveat is that in React the \`style\` prop
    ·           requires an object instead of a string with all the styles.
    ·       - However, in Vue, you can use \`style\` but also use \`:style\` for more dynamic styles.
    └─`)
  })
})

describe('multi-line diagnostics', () => {
  it('should be possible to print related diagnostics together spread across multiple lines (2x)', () => {
    let code = javascript`
      let sum = (() => {
        let a = 123
        let b = 321

        return a + b
      })()
    `
    let diagnostics = [
      diagnose('This is a group', findLocation(code, '{'), { block: 'one', context: 'one' }),
      diagnose('This is a group', findLocation(code, '}'), { block: 'one', context: 'one' }),
    ]

    let result = render(code, diagnostics, './example.js')
    expect(result).toEqual(`
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
    └─`)
  })

  it('should be possible to print related diagnostics together spread across multiple lines (3x)', () => {
    let code = javascript`
      let sum = (() => {
        let a = 123
        let b = 321
        return a + b
      })()
    `
    let diagnostics = [
      diagnose('This is a group', findLocation(code, '{'), { block: 'one', context: 'one' }),
      diagnose('This is a group', findLocation(code, 'b'), { block: 'one', context: 'one' }),
      diagnose('This is a group', findLocation(code, '}'), { block: 'one', context: 'one' }),
    ]

    let result = render(code, diagnostics, './example.js')
    expect(result).toEqual(`
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
    └─`)
  })

  it('should be possible to print related diagnostics together spread across multiple lines but with very very large text (4x)', () => {
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
        { block: 'one', context: 'one' }
      ),
      diagnose(
        'This is a group with a very long message so we should be able to render this as a multi-line message as well.',
        findLocation(code, 'b'),
        { block: 'one', context: 'one' }
      ),
      diagnose(
        'This is a group with a very long message so we should be able to render this as a multi-line message as well.',
        findLocation(code, '}'),
        { block: 'one', context: 'one' }
      ),
    ]

    let result = render(code, diagnostics, './example.js')
    expect(result).toEqual(`
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
    └─`)
  })

  it('should be possible to print related diagnostics together spread across multiple lines (5x)', () => {
    let code = javascript`
      let sum = (() => {
        let a = 123
        let b = 321
        return a + b
      })()
    `
    let diagnostics = [
      diagnose('This is a group', findLocation(code, '{'), { block: 'one', context: 'one' }),
      diagnose('This is a group', findLocation(code, 'b'), { block: 'one', context: 'one' }),
      diagnose('This is a group', findLocation(code, 'a'), { block: 'one', context: 'one' }),
      diagnose('This is a group', findLocation(code, '}'), { block: 'one', context: 'one' }),
    ]

    let result = render(code, diagnostics, './example.js')
    expect(result).toEqual(`
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
    └─`)
  })

  it('should drop "useless" empty line context lines between diagnostic lines', () => {
    let code = javascript`
      let sum = (() => {
        let a = 123
        let b = 321

        return a + b
      })()
    `
    let diagnostics = [
      diagnose('This is a group', findLocation(code, '{'), { block: 'one', context: 'one' }),
      diagnose('This is a group', findLocation(code, 'b'), { block: 'one', context: 'one' }),
      diagnose('This is a group', findLocation(code, '}'), { block: 'one', context: 'one' }),
    ]

    let result = render(code, diagnostics, './example.js')

    expect(result).toEqual(`
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
    └─`)
  })

  xit('should be possible to print multiple related diagnostics together spread across multiple lines', () => {
    let code = `
      a b c d e f g
      These lines are connected
      1 2 3 4 5 6 7
    `
    let block = 'one'
    let diagnostics = [
      diagnose('Pair 1', findLocation(code, 'a'), { block, context: 0 }),
      diagnose('Pair 1', findLocation(code, '1'), { block, context: 0 }),

      diagnose('Pair 2', findLocation(code, 'b'), { block, context: 1 }),
      diagnose('Pair 2', findLocation(code, '2'), { block, context: 1 }),

      diagnose('Pair 3', findLocation(code, 'c'), { block, context: 2 }),
      diagnose('Pair 3', findLocation(code, '3'), { block, context: 2 }),
    ]

    let result = render(code, diagnostics)
    expect(result).toEqual('')
    expect(result).toEqual(`
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
