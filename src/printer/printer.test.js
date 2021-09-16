let kleur = require('kleur')
let printer = require('./printer')

kleur.enabled = false

let html = String.raw
let css = String.raw
let javascript = String.raw

function diagnose(message, location, { notes = [], block, context } = {}) {
  return { block, context, message, loc: location, notes }
}

function findLocation(code, word) {
  let row = code.split('\n').findIndex((row) => row.includes(word))
  let col = code.split('\n')[row].indexOf(word)
  let len = word.length

  return { row: row + 1, col: col + 1, len }
}

function magic(source, diagnostics = [], file = './example.txt') {
  let sources = new Map([[file, source]])

  let lines = []
  function collector(...args) {
    lines.push(args.join(' '))
  }

  printer(
    sources,
    diagnostics.map((d) => ({ ...d, file })),
    collector
  )

  return '\n' + lines.join('\n')
}

it('should print a message', () => {
  let code = html`<div class="flex block" />`
  let diagnostics = [diagnose('Message 1', findLocation(code, 'flex'))]

  let result = magic(code, diagnostics, './example.html')

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

  let result = magic(code, diagnostics, './example.html')

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

  let result = magic(code, diagnostics, './example.html')

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

it('should print a message with multiple notes', () => {
  let code = html`<div class="flex block" />`
  let diagnostics = [
    diagnose('Message 1', findLocation(code, 'flex'), {
      notes: ['This is a note', 'This is another note', 'This is the last note'],
    }),
  ]

  let result = magic(code, diagnostics, './example.html')

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

  let result = magic(code, diagnostics, './example.html')

  expect(result).toEqual(`
    ┌─[./example.html]
    │
∙ 1 │   <div class="flex block" />
    ·               ─┬──
    ·                ╰──── Message 1
    ·
    ├─
    ·   NOTES:
    ·     - Heading 1
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

it('should print multiple messages', () => {
  let code = html`<div class="flex block" />`
  let diagnostics = [
    diagnose('Message 1', findLocation(code, 'flex')),
    diagnose('Message 2', findLocation(code, 'block')),
  ]

  let result = magic(code, diagnostics, './example.html')

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

  let result = magic(code, diagnostics, './example.html')

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
    diagnose('Collding on the `display` property', findLocation(code, 'flex')),
    diagnose('Collding on the `display` property', findLocation(code, 'block')),
    diagnose('Collding on the `color` property', findLocation(code, 'text-black')),
    diagnose('Collding on the `color` property', findLocation(code, 'text-white')),
  ]

  let result = magic(code, diagnostics, './example.html')

  expect(result).toEqual(`
    ┌─[./example.html]
    │
∙ 1 │   <div class=\"flex block text-black text-white\" />
    ·               ─┬── ──┬── ────┬───── ────┬─────
    ·                │     │       ╰──────────┴─────── Collding on the \`color\` property
    ·                ╰─────┴────────────────────────── Collding on the \`display\` property
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

  let result = magic(code, diagnostics, './example.html')

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

  let result = magic(code, diagnostics, './example.html')

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

  let result = magic(code, diagnostics, './example.html')

  expect(result).toEqual(`
    ┌─[./example.html]
    │
∙ 1 │   <div class="flex block" />
    ·               ─┬── ──┬──
    ·                │     ╰──── Message 2
    ·                ╰────────── Message 1
    ·
    ├─
    ·   NOTES:
    ·     - I am a note
    ·     - I am also a note
    ·     - With another note
    └─`)
})

it('should be possible to print a lot of messages', () => {
  let code = `a b c d e f g h i j k l m n o p q r s t u v w x y z`
  let diagnostics = Array(26)
    .fill(0)
    .map((_, idx) => idx * 2)
    .map((col, idx) => diagnose(`Symbol at position: ${idx}`, { row: 1, col: col + 1, len: 1 }))

  let result = magic(code, diagnostics)

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
    .map((col) => diagnose('This is part of the alphabet', { row: 1, col: col + 1, len: 1 }))

  let result = magic(code, diagnostics)

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

  let result = magic(code, diagnostics, './example.html')

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

  let result = magic(code, diagnostics, './example.html')

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

  let result = magic(code, diagnostics, './example.html')

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

  let result = magic(code, diagnostics, './example.html')

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
    ·
    ├─
    ·   NOTES:
    ·     - I am a note from message 1
    ·     - I am a note from message 2
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

    let result = magic(code, diagnostics, './example.html')
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

    let result = magic(code, diagnostics, './example.html')
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

    let result = magic(code, diagnostics, './example.html')
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

    let result = magic(code, diagnostics, './example.html')
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

    let result = magic(code, diagnostics, './example.html')
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

    let result = magic(code, diagnostics, './example.html')
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

    let result = magic(code, diagnostics, './example.css')
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

    let result = magic(code, diagnostics, './example.css')
    expect(result).toEqual(`
    ┌─[./example.css]
    │
∙ 1 │   <div class="text-grey-200"></div>
    ·                    ─┬── ╭─
    ·                     ╰───┤ This color should be "gray" and not "grey". This is because the
    ·                         │ letter "a" has an ascii value of 97 but an "e" has an ascii value of
    ·                         │ 101. This means that "a" is cheaper to store. Lol, jk, I just need a
    ·                         │ long message here...
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

    let result = magic(code, diagnostics, './example.css')
    expect(result).toEqual(`
    ┌─[./example.css]
    │
  1 │   <div>
∙ 2 │         <div class="text-grey-200">
  3 │           <div></div>    ─┬── ╭─
  4 │         </div>            ╰───┤ This color should be "gray" and not "grey". This is because
  5 │         <div>                 │ the letter "a" has an ascii value of 97 but an "e" has an ascii
    ·                               │ value of 101. This means that "a" is cheaper to store. Lol, jk,
    ·                               │ I just need a long message here...
    ·                               ╰─
    │
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

    let result = magic(code, diagnostics, './example.js')
    expect(result).toEqual(`
    ┌─[./example.js]
    │
∙ 2 │    let sum = (() => {
    ·                     ┬
    · ╭───────────────────╯
    · │
  3 │ │    let a = 123
  4 │ │    let b = 321
  5 │ │
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

    let result = magic(code, diagnostics, './example.js')
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

  it('should be possible to print related diagnostics together spread across multiple lines (4x)', () => {
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

    let result = magic(code, diagnostics, './example.js')
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

    let result = magic(code, diagnostics, './example.js')

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

  it.skip('should be possible to print multiple related diagnostics together spread across multiple lines', () => {
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

    let result = magic(code, diagnostics)
    expect(result).toEqual()
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
