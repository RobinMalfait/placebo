import path from 'path'
import pc from 'picocolors'
import { highlight, plain } from 'cli-highlight'

import { env } from '../env'
import { range } from '../utils/range'
import { wordWrap } from '../utils/word-wrap'

import CHARS from './char-maps/fancy'

interface DeepArray<T> extends Array<T | DeepArray<T>> {}
type Notes = DeepArray<string>

interface Location {
  row: number
  col: number
  len: number
}

interface Diagnostic {
  message: string
  loc: Location
  notes: Notes
  block?: string
  context?: string | number

  //
  file?: string
  type?: string
  locations?: Location[]
}

let WITH_COLOR = pc.isColorSupported
let SUPER_SCRIPT_MAP = {
  0: '⁰',
  1: '¹',
  2: '²',
  3: '³',
  4: '⁴',
  5: '⁵',
  6: '⁶',
  7: '⁷',
  8: '⁸',
  9: '⁹',
  '(': '⁽',
  ')': '⁾',
}

let COLORS = [pc.yellow, pc.red, pc.blue, pc.green, pc.magenta, pc.cyan].map(
  (f) => (v: string) => pc.bold(f(v))
)

// The default indentation to add some padding in the box.
let PADDING = 3

// The margin before the line numbers
let GUTTER_WIDTH = 2

enum RowType {
  // Code
  Code = 1 << 0,
  ContextLine = 1 << 1,

  // Diagnostics
  Diagnostic = 1 << 2,

  // Separator
  LineNumberSeparator = 1 << 3,

  // Notes
  Note = 1 << 4,
  StartOfNote = 1 << 5,
}

function formatCode(row: string[], highlightCode: (v: string) => string) {
  let joined = ''
  for (let char of row) joined += char ?? ' '

  // A list of "off" escapes: All attributes off, bold off, underline off,
  // blink off, default foreground, default background
  // let offs = /((?:\x1B\[0m|\x1B\[21m|\x1B\[24m|\x1B\[25m|\x1B\[39m|\x1B\[49m)+)/g
  let offs = ['\x1B[0m', '\x1B[21m', '\x1B[24m', '\x1B[25m', '\x1B[39m', '\x1B[49m']

  let ansiIdx = joined.indexOf('\x1b')
  if (ansiIdx === -1) {
    joined = highlightCode(joined)
  } else {
    let lastAnsiIdx = Math.max(...offs.map((off) => joined.lastIndexOf(off)))
    let codeBefore = joined.slice(0, ansiIdx)
    let diagnostics = joined.slice(ansiIdx, lastAnsiIdx)
    let codeAfter = joined.slice(lastAnsiIdx)

    joined = highlightCode(codeBefore) + diagnostics + highlightCode(codeAfter)
  }

  return joined
}

function reportBlock(
  sources: Map<string, string>,
  diagnostics: Diagnostic[],
  flush: (input: string) => void
) {
  // Group by same line
  let groupedByRow = new Map()
  for (let diagnostic of diagnostics) {
    if (groupedByRow.has(diagnostic.loc.row)) {
      groupedByRow.get(diagnostic.loc.row).push(diagnostic)
    } else {
      groupedByRow.set(diagnostic.loc.row, [diagnostic])
    }
  }

  // TODO: This should probably be an array when we are rendering issues across
  // different files in the same block. In addition, diagnostic lines _can_
  // cross those file boundaries so that is going to be interesting...
  let file = diagnostics[0].file!

  let h = WITH_COLOR
    ? (input: string) => {
        try {
          return highlight(input, {
            language: path.extname(file).slice(1),
            ignoreIllegals: true,
            theme: {
              keyword: pc.blue,
              built_in: pc.cyan,
              type: (v) => pc.cyan(pc.dim(v)),
              literal: pc.blue,
              number: pc.magenta,
              regexp: pc.red,
              string: pc.green,
              class: pc.blue,
              function: pc.yellow,
              comment: pc.green,
              doctag: pc.green,
              meta: pc.gray,
              tag: pc.gray,
              name: pc.blue,
              'builtin-name': plain,
              attr: pc.cyan,
              emphasis: pc.italic,
              strong: pc.bold,
              link: pc.underline,
              addition: pc.green,
              deletion: pc.red,
            },
          })
        } catch (err) {
          return input
        }
      }
    : (input: string) => input // noop

  let source = sources.get(file)!
  let lines = source.split('\n')

  // Find all printable lines. Lines with issues + context lines. We'll use
  // an object for now which will make it easier for overlapping context
  // lines.
  let printableLines = new Map()
  for (let lineNumber of groupedByRow.keys()) {
    // Before context lines
    let beforeStart = Math.max(lineNumber - env.BEFORE_CONTEXT_LINES_COUNT, 0)
    for (let [idx, line] of lines.slice(beforeStart, lineNumber).entries()) {
      printableLines.set(beforeStart + idx, line)
    }

    // Line with diagnostics
    printableLines.set(lineNumber, lines[lineNumber])

    // After context lines
    let afterEnd = Math.min(lineNumber + 1 + env.AFTER_CONTEXT_LINES_COUNT, lines.length - 1)
    for (let [idx, line] of lines.slice(lineNumber + 1, afterEnd).entries()) {
      printableLines.set(lineNumber + 1 + idx, line)
    }
  }

  // Drop leading empty context lines, they are only noise
  for (let [lineNumber, line] of printableLines.entries()) {
    if (line.trim()) break // Has contents in the line
    if (groupedByRow.has(lineNumber)) break // Has diagnostics attached

    printableLines.delete(lineNumber)
  }

  // Drop trailing empty context lines, they are only noise
  for (let [lineNumber, line] of Array.from(printableLines.entries()).reverse()) {
    if (line.trim()) break // Has contents in the line
    if (groupedByRow.has(lineNumber)) break // Has diagnostics attached

    printableLines.delete(lineNumber)
  }

  // Strip leading whitespace
  let smallestIndentWidth = Infinity
  for (let line of printableLines.values()) {
    if (!line.trim()) continue

    let leadingWhitespace = line.length - line.trimStart().length
    smallestIndentWidth = Math.min(smallestIndentWidth, leadingWhitespace)
  }

  // Re-indent the lines
  for (let [lineNumber, line] of printableLines.entries()) {
    if (!line.trim()) {
      printableLines.set(lineNumber, line)
      continue
    }

    printableLines.set(lineNumber, line.slice(smallestIndentWidth))
  }

  // Adjust column offsets
  for (let diagnostics of groupedByRow.values()) {
    for (let diagnostic of diagnostics) {
      diagnostic.loc.col -= smallestIndentWidth + 1
    }
  }

  // Add padding to the lines
  for (let [lineNumber, line] of printableLines.entries()) {
    if (!line.trim()) {
      printableLines.set(lineNumber, line)
      continue
    }

    printableLines.set(lineNumber, ' '.repeat(PADDING) + line)
  }

  // Adjust column offsets for padding
  for (let diagnostics of groupedByRow.values()) {
    for (let diagnostic of diagnostics) {
      diagnostic.loc.col += PADDING
    }
  }

  type Row = string[]

  // Keep track of things
  let output: Row[] = []
  let rowInfo = new Map<Row, { lineNumber: number; type: RowType }>()
  let lineNumberToRow = new Map<number, Row>()
  let diagnosticToColor = new Map<Diagnostic, (input: string) => string>()

  let diagnosticsByContextIdentifier = new Map<string | number | undefined, Diagnostic[]>()

  // Group by context
  for (let diagnostic of diagnostics) {
    if (!diagnostic.context) continue

    if (diagnosticsByContextIdentifier.has(diagnostic.context)) {
      diagnosticsByContextIdentifier.get(diagnostic.context)!.push(diagnostic)
    } else {
      diagnosticsByContextIdentifier.set(diagnostic.context, [diagnostic])
    }
  }

  // Find the correct color per diagnostic
  for (let [idx, diagnostic] of diagnostics.entries()) {
    if (diagnosticsByContextIdentifier.has(diagnostic.context)) {
      let [firstDiagnostic] = diagnosticsByContextIdentifier.get(diagnostic.context)!

      if (diagnosticToColor.has(firstDiagnostic)) {
        diagnosticToColor.set(diagnostic, diagnosticToColor.get(firstDiagnostic)!)
      } else {
        diagnosticToColor.set(diagnostic, COLORS[idx % COLORS.length])
      }
    } else {
      diagnosticToColor.set(diagnostic, COLORS[idx % COLORS.length])
    }
  }

  // Let's cleanup contexts if there is only a single one
  for (let [context, diagnostics] of diagnosticsByContextIdentifier) {
    if (diagnostics.length > 1) continue

    for (let diagnostic of diagnostics) {
      diagnostic.context = undefined
      diagnosticsByContextIdentifier.delete(context)
    }
  }

  //
  let contextIdentifiers = Array.from(diagnosticsByContextIdentifier.keys())

  // Reserve whitespace for vertical context lines
  for (let [lineNumber, line] of printableLines.entries()) {
    printableLines.set(lineNumber, ' '.repeat(diagnosticsByContextIdentifier.size) + line)
  }

  // Adjust column offsets for vertical context lines
  for (let diagnostics of groupedByRow.values()) {
    for (let diagnostic of diagnostics) {
      diagnostic.loc.col += diagnosticsByContextIdentifier.size
    }
  }

  // Inject a row of a certain type at a certain position
  function inject(idx: number, type: RowType, ...row: string[]) {
    output.splice(idx, 0, row)
    rowInfo.set(row, { type })
    return output[idx]
  }

  function isLastDiagnosticInContext(diagnostic: Diagnostic) {
    let diagnosticsInContext = diagnosticsByContextIdentifier.get(diagnostic.context)!
    return diagnosticsInContext[diagnosticsInContext.length - 1] === diagnostic
  }

  function isFirstDiagnosticInContext(diagnostic: Diagnostic) {
    let diagnosticsInContext = diagnosticsByContextIdentifier.get(diagnostic.context)!
    return diagnosticsInContext[0] === diagnostic
  }

  // Calculate the biggest line number, so that we can pretty print it
  // correctly. E.g.: When we have 420 lines of code, then this number will be
  // `3`, because that's the amount of characters it requires.
  let gutterWidth = Array.from(printableLines.keys())
    .reduce((max, lineNumber) => Math.max(max, lineNumber + 1), -Infinity)
    .toString().length

  // Add printable lines to output
  for (let [lineNumber, line] of printableLines.entries()) {
    let hasDiagnostics = groupedByRow.has(lineNumber)
    let rowIdx = output.push(line.split('')) - 1

    rowInfo.set(output[rowIdx], {
      type: hasDiagnostics ? RowType.Code : RowType.ContextLine,
      lineNumber,
    })

    lineNumberToRow.set(lineNumber, output[rowIdx])
  }

  // Add connector lines
  for (let [lineNumber, diagnosticz] of groupedByRow.entries()) {
    // Group diagnostics that belong together, together
    let diagnostics: Diagnostic[] = []
    for (let diagnostic of diagnosticz) {
      let last = diagnostics[diagnostics.length - 1]
      if (last && last.message === diagnostic.message) {
        if (last.type !== 'combined') {
          last.type = 'combined'
          last.locations = [last.loc]
        }
        last.locations.push(diagnostic.loc)
        continue
      }

      diagnostics.push(diagnostic)
    }

    let lastDiagnostic = diagnostics[diagnostics.length - 1]
    let lastPosition = (() => {
      if (lastDiagnostic.type === 'combined') {
        let { col, len } = lastDiagnostic.locations[lastDiagnostic.locations.length - 1]
        return col + len + 1 /* Spacing */
      }

      return lastDiagnostic.loc.col + lastDiagnostic.loc.len + 1 /* Spacing */
    })()

    for (let [idx, diagnostic] of diagnostics.entries()) {
      let decorate = diagnosticToColor.get(diagnostic)!
      let rowIdx = output.indexOf(lineNumberToRow.get(lineNumber)!)

      let nextLine = output[rowIdx + 1] ?? inject(rowIdx + 1, RowType.Diagnostic)

      // Reserve empty lines (if necessary) so that we can ensure we don't
      // print the diagnostics _over_ the context lines. We only have to do
      // this for the first diagnostic on this line, because the other
      // diagnostics will be printed on the right of the first one.
      if (idx === 0) {
        for (let offset of range(1, diagnostics.length + 2)) {
          let emptyRowIdx = rowIdx + offset
          if (!output[emptyRowIdx] || output[emptyRowIdx].slice(diagnostic.loc.col).length > 0) {
            inject(emptyRowIdx, RowType.Diagnostic)
          }
        }

        // Reserved enough empty rows, let's set our nextLine to the first
        // reserved line
        nextLine = output[rowIdx + 1]
      }

      // Reserve empty lines (if necessary) when we have diagnostics for the
      // same context. When we have the same context, we will draw lines
      // around the code to the left. We have to make sure that we can draw
      // that by reserving empty lines.
      if (diagnostic.context && nextLine.slice(0, diagnostic.loc.col).length > 0) {
        nextLine = inject(rowIdx + 1, RowType.Diagnostic)
      }

      // When highlighting a word, we will have 3 sections, a before
      // horizontal line(s), the connector and the after horizontal line(s).
      // E.g.: ─┬──
      // We will store the attachmentIdx, because we can use this exact
      // position for other lines below it.
      let connectorIdx = diagnostic.loc.col + Math.floor((diagnostic.loc.len - 1) / 2) + 1

      // Underline
      for (let position of range(diagnostic.loc.col, diagnostic.loc.col + diagnostic.loc.len)) {
        nextLine[position + 1] = decorate(CHARS.H)
      }

      // Connector
      nextLine[connectorIdx] = decorate(CHARS.TConnector)

      // Vertical lines
      let requiredVerticalLines = diagnostics.length - idx - 1
      for (let offset of range(requiredVerticalLines)) {
        let nextLineIdx =
          rowIdx +
          offset +
          1 /* 1 line under the code has the `underline` */ +
          1 /* An additional line under the `underline` */

        let nextLine = output[nextLineIdx] ?? inject(nextLineIdx, RowType.Diagnostic)

        if (diagnostic.type === 'combined') {
          for (let { col, len } of diagnostic.locations) {
            let attachmentIdx = col + Math.floor((len - 1) / 2) + 1 // Center of the highlighted word

            nextLine[attachmentIdx] = decorate(CHARS.V)
          }
        } else {
          nextLine[connectorIdx] = decorate(CHARS.V)
        }
      }

      let lastLineIdx = Boolean(diagnostic.context)
        ? rowIdx + 2
        : rowIdx + (diagnostics.length - idx) + 1

      let lastLine = output[lastLineIdx] ?? inject(lastLineIdx, RowType.Diagnostic)

      if (diagnostic.context && lastLine.slice(0, connectorIdx).length > 0) {
        lastLine = inject(lastLineIdx, RowType.Diagnostic)
      }

      // Rounded corner
      if (!diagnostic.context) {
        lastLine[connectorIdx] = decorate(
          lastLine[connectorIdx] === undefined ? CHARS.BLRound : CHARS.LConnector
        )
      } else {
        if (isLastDiagnosticInContext(diagnostic)) {
          lastLine[connectorIdx] = decorate(CHARS.BConnector)
        } else {
          lastLine[connectorIdx] = decorate(CHARS.BRRound)
        }
      }

      // Horizontal line next to rounded corner
      if (!diagnostic.context || isLastDiagnosticInContext(diagnostic)) {
        for (let x of range(lastPosition - connectorIdx + 1)) {
          lastLine[connectorIdx + 1 + x] = decorate(CHARS.H)
        }
      }

      if (diagnostic.context) {
        let offset =
          1 +
          contextIdentifiers.indexOf(diagnostic.context) *
            2 /* To have some breathing room between each line */

        for (let x of range(offset, connectorIdx)) {
          lastLine[x] = decorate(CHARS.H)
        }

        if (isFirstDiagnosticInContext(diagnostic)) {
          lastLine[offset] = decorate(CHARS.TLRound)
        } else if (isLastDiagnosticInContext(diagnostic)) {
          lastLine[offset] = decorate(CHARS.BLRound)
        } else {
          lastLine[offset] = decorate(CHARS.LConnector)
        }
      }

      if (diagnostic.type === 'combined') {
        for (let { col, len } of diagnostic.locations.slice(1)) {
          let attachmentIdx = col + Math.floor((len - 1) / 2) + 1

          // Underline
          for (let position of range(col, col + len)) {
            nextLine[position + 1] = decorate(CHARS.H)
          }

          // Connector
          nextLine[attachmentIdx] = decorate(CHARS.TConnector)

          // Connect to the friend line below
          output[rowIdx + 1 + (diagnostics.length - idx)][attachmentIdx] = decorate(
            CHARS.BConnector
          )
        }
      }

      function injectIfEnoughRoom(idx: number, start: number, type: RowType) {
        if (!output[idx] || output[idx].slice(start).length > 0) {
          return inject(idx, type)
        }

        let info = rowInfo.get(output[idx])
        info.type |= type // Add the current type to the existing type

        return output[idx]
      }

      // Inject the message after the horizontal line
      if (!diagnostic.context || isLastDiagnosticInContext(diagnostic)) {
        let startPosition = lastLine.length - gutterWidth + 1 + GUTTER_WIDTH + PADDING + 1
        let lastLineOffset = lastLine.length
        let availableSpace = env.PRINT_WIDTH - startPosition
        if (availableSpace >= diagnostic.message.length) {
          lastLine.push(' ', ...diagnostic.message.split('').map((v) => decorate(v)))
        } else {
          output[output.indexOf(lastLine) - 1][lastLineOffset - 1] = decorate(CHARS.TLRound)
          output[output.indexOf(lastLine) - 1][lastLineOffset] = decorate(CHARS.H)

          lastLine[lastLine.length - 1] = decorate(CHARS.RConnector)
          let sentences = wordWrap(diagnostic.message, availableSpace)
          for (let [idx, sentence] of sentences.entries()) {
            if (idx === 0) {
              lastLine.push(' ', ...sentence.split('').map((v) => decorate(v)))
            } else {
              lastLine.push(decorate(CHARS.V), ' ', ...sentence.split('').map((v) => decorate(v)))
            }

            lastLine = injectIfEnoughRoom(
              output.indexOf(lastLine) + 1,
              lastLineOffset - 1,
              RowType.Diagnostic
            )
            lastLine[lastLineOffset - 1] = ''
          }

          lastLine.push(decorate(CHARS.BLRound), decorate(CHARS.H))
        }
      }
    }
  }

  // Drop "useless" context lines. A useless context line is one that is empty
  // surrounded by diagnostic lines.
  for (let rowIdx = output.length - 1; rowIdx > 0; rowIdx--) {
    let { type: currentRowType, lineNumber } = rowInfo.get(output[rowIdx]) ?? {}
    let { type: previousRowType } = rowInfo.get(output[rowIdx - 1]) ?? {}
    let { type: nextRowType } = rowInfo.get(output[rowIdx + 1]) ?? {}

    if (
      // Check structure
      previousRowType === RowType.Diagnostic &&
      currentRowType === RowType.ContextLine &&
      nextRowType === RowType.Diagnostic &&
      // Check validity of the context line
      output[rowIdx].join('').trim() === ''
    ) {
      // Drop information about this line
      rowInfo.delete(output[rowIdx])
      lineNumberToRow.delete(lineNumber)

      // Remove line from output
      output.splice(rowIdx, 2) // TODO: Hmm, is this `2` correct? Why?
    }
  }

  // Inject breathing room between code lines and diagnostic lines
  for (let rowIdx = output.length - 1; rowIdx > 0; rowIdx--) {
    let { type: currentRowType } = rowInfo.get(output[rowIdx])
    let { type: previousRowType } = rowInfo.get(output[rowIdx - 1])

    if (
      previousRowType === RowType.Diagnostic &&
      [RowType.Code, RowType.ContextLine].includes(currentRowType)
    ) {
      // Inject empty line between a code line and a non-code line. This will
      // later get turned into a non-code line.
      inject(rowIdx, RowType.Diagnostic)
    }
  }

  // Inject separator
  for (let rowIdx = output.length - 1; rowIdx > 0; rowIdx--) {
    let { type: currentRowType, lineNumber: currentLineNumber } = rowInfo.get(output[rowIdx])
    let { type: previousRowType, lineNumber: previousLineNumber } = rowInfo.get(output[rowIdx - 1])

    if (![RowType.Code, RowType.ContextLine].includes(currentRowType)) continue
    if (![RowType.Code, RowType.ContextLine].includes(previousRowType)) continue

    if (Number(currentLineNumber) - Number(previousLineNumber) > 1) {
      // Inject empty line between a code line and a non-code line. This will
      // later get turned into a non-code line.
      inject(rowIdx, RowType.LineNumberSeparator)
    }
  }

  // Render vertical lines for diagnostics with the same context
  let seen = new Set()
  for (let diagnostic of diagnostics) {
    if (!diagnostic.context) continue
    if (seen.has(diagnostic.context)) continue
    seen.add(diagnostic.context)

    let decorate = diagnosticToColor.get(diagnostic)!
    let offset =
      1 /* Offset for the gutter line */ +
      contextIdentifiers.indexOf(diagnostic.context) *
        2 /* To have some breathing room between each line */

    let diagnosticsInContext = diagnosticsByContextIdentifier.get(diagnostic.context)!.slice()
    let startRowIdx = diagnosticsInContext.reduce(
      (smallestRowIdx, diagnostic) => Math.min(smallestRowIdx, diagnostic.loc.row),
      Infinity
    )
    startRowIdx = output.indexOf(lineNumberToRow.get(startRowIdx)!) + 3
    let endRowIdx = diagnosticsInContext.reduce(
      (largestRowIdx, diagnostic) => Math.max(largestRowIdx, diagnostic.loc.row),
      -Infinity
    )
    endRowIdx = output.indexOf(lineNumberToRow.get(endRowIdx)!) + 1

    // Diagnostics in this group in between the start & end positions
    let inbetweenPositions = new Set()
    for (let diagnostic of diagnosticsInContext.slice(1, -1)) {
      let row = lineNumberToRow.get(diagnostic.loc.row)!
      let rowIdx = output.indexOf(row)

      inbetweenPositions.add(
        rowIdx +
          2 /* Because we have 2 lines below the actual diagnostic. 1 underline, 1 rounded corner */
      )
    }

    for (let position = startRowIdx; position <= endRowIdx; position++) {
      if (inbetweenPositions.has(position)) {
        output[position][offset] = decorate(CHARS.LConnector)
      } else {
        output[position][offset] = decorate(CHARS.V)
      }
    }
  }

  // NOTES
  let notes = Array.from(
    new Set(
      Array.from(groupedByRow.values())
        .flat(Infinity)
        // We print them from top row to bottom row, however we also print the diagnostic from left to
        // right which means that the left most (first) will be rendered at the bottom, that's why we
        // need to flip the `col` coordinates as well so that we end up with 1-9 instead of 9-1.
        .sort((a, z) => a.loc.row - z.loc.row || z.loc.col - a.loc.col)
        .flatMap((diagnostic) => diagnostic.notes ?? [])
    )
  )

  if (notes.length > 0) {
    for (let _ of range(1)) {
      inject(output.length, RowType.Diagnostic)
    }

    inject(output.length, RowType.StartOfNote, pc.dim(CHARS.H))

    if (notes.length === 1) {
      for (let note of notes) {
        inject(
          output.length,
          RowType.Diagnostic,
          ...' '.repeat(PADDING),
          ...'NOTE:'.split('').map((v) => pc.bold(pc.cyan(v))),
          ' ',
          ...note.note
        )
      }
    } else {
      inject(
        output.length,
        RowType.Diagnostic,
        ...' '.repeat(PADDING),
        ...'NOTES:'.split('').map((v) => pc.bold(pc.cyan(v)))
      )

      type MyNotes = { note: string | MyNotes; diagnostic: Diagnostic }[]

      function renderNotes(notes: MyNotes, level = 0) {
        for (let { note, diagnostic } of notes) {
          let decorate = diagnosticToColor.get(diagnostic)!
          if (Array.isArray(note)) {
            renderNotes(note, level + 1)
          } else if (!note || note.trim() === '') {
            inject(output.length, RowType.Diagnostic)
          } else {
            // Starting with a number like "1."
            if (/^\d*\./.test(note)) {
              let [, number, rest] = note.split(/(\d*\.)\s*(.*)/)
              inject(
                output.length,
                RowType.Diagnostic,
                ...' '.repeat(PADDING + 2 + level * 2),
                pc.dim(number),
                ' ',
                ...decorate(rest)
              )
            }

            // Not starting with a number, just use `- {...note}`
            else {
              inject(
                output.length,
                RowType.Diagnostic,
                ...' '.repeat(PADDING + 2 + level * 2),
                pc.dim('-'),
                ' ',
                ...note
              )
            }
          }
        }
      }

      renderNotes(notes)
    }
  }

  // Add a frame around the output
  output = [
    // Opening block
    [
      ...' '.repeat(gutterWidth + 1 + GUTTER_WIDTH),
      pc.dim(CHARS.TLSquare),
      pc.dim(CHARS.H),
      pc.dim('['),
      pc.bold(
        ((relative) =>
          relative.startsWith('.') || relative.startsWith('/') ? relative : `./${relative}`)(
          path.relative(process.cwd(), path.resolve(file))
        )
      ),
      pc.dim(']'),
    ],
    [...' '.repeat(gutterWidth + 1 + GUTTER_WIDTH), CHARS.V].map((v) => pc.dim(v)),

    // Gutter + existing output
    ...output.map((row) => {
      let { type, lineNumber: _lineNumber } = rowInfo.get(row)!
      let emptyIndent = ' '.repeat(gutterWidth + GUTTER_WIDTH)

      let lineNumber = (_lineNumber + 1).toString().padStart(gutterWidth, ' ')

      return {
        [RowType.Code]() {
          return [
            ...' '.repeat(GUTTER_WIDTH - 2),
            pc.bold(pc.red(CHARS.bigdot)),
            ' ',
            ...lineNumber,
            ' ',
            pc.dim(CHARS.V),
            formatCode(row, (raw) => h(raw)),
          ]
        },
        [RowType.ContextLine]() {
          return [
            ...' '.repeat(GUTTER_WIDTH),
            ...lineNumber.split('').map((v) => pc.dim(v)),
            ' ',
            pc.dim(CHARS.V),
            formatCode(row, (raw) => pc.dim(env.COLOR_CONTEXT_LINES ? h(raw) : raw)),
          ]
        },
        [RowType.Diagnostic]() {
          return [...emptyIndent, ' ', pc.dim(CHARS.dot), ...row]
        },
        [RowType.LineNumberSeparator]() {
          return [...emptyIndent, ' ', pc.dim(CHARS.VSeparator), ...row]
        },
        [RowType.StartOfNote]() {
          return [...emptyIndent, ' ', pc.dim(CHARS.LConnector), ...row]
        },
        [RowType.ContextLine | RowType.Diagnostic]() {
          return [
            ...' '.repeat(GUTTER_WIDTH),
            ...lineNumber.split('').map((v) => pc.dim(v)),
            ' ',
            pc.dim(CHARS.V),
            formatCode(row, (raw) => pc.dim(env.COLOR_CONTEXT_LINES ? h(raw) : raw)),
          ]
        },
      }[type]()
    }),

    // Closing block
    notes.length <= 0
      ? [...' '.repeat(gutterWidth + 1 + GUTTER_WIDTH), CHARS.V].map((v) => pc.dim(v))
      : null,
    [...' '.repeat(gutterWidth + 1 + GUTTER_WIDTH), CHARS.BLSquare, CHARS.H].map((v) => pc.dim(v)),
  ].filter(Boolean)

  // Flush everything
  for (let line of output.splice(0)) {
    let modified = ''

    // Some of the output arrays are holey/sparse, using a normal `.map()`,
    // those empty spots won't be mapped, with a normal for loop however,
    // they will be `undefined`.
    for (let cell of line) {
      modified += cell ?? ' '
    }

    flush(modified)
  }
}

export function printer(
  sources: Map<string, string>,
  diagnostics: Diagnostic[],
  flush = console.log
) {
  // Sort diagnostics by location, first by row then by column so that it is
  // sorted top to bottom, left to right
  diagnostics = diagnostics.slice().sort((a, z) => a.loc.row - z.loc.row || a.loc.col - z.loc.col)

  // Ensure that all required properties exist
  diagnostics = diagnostics.map((d) => ({ message: '', file: '', ...d }))

  // Row & Col are 1-based when they come in. For now, let's make it a bit
  // simpler and use them as 0-based values.
  diagnostics = diagnostics.map((d) => ({
    ...d,
    loc: { ...d.loc, row: d.loc.row - 1, col: d.loc.col - 1 },
  }))

  type MyNotes = { note: string | MyNotes[]; diagnostic: Diagnostic }
  function noteObj(note: string | DeepArray<string>, diagnostic: Diagnostic): MyNotes {
    if (Array.isArray(note)) {
      return {
        note: note.map((n) => noteObj(n, diagnostic)),
        diagnostic,
      }
    }

    return {
      note,
      diagnostic,
    }
  }

  // Ensure that all notes are array of objects with a link to their (parent) diagnostic
  diagnostics.forEach((d) => {
    d.notes = []
      .concat(d.notes)
      .filter(Boolean)
      .map((n) => noteObj(n, d))
  })

  // Group by block
  let grouped = new Map()
  for (let diagnostic of diagnostics) {
    let block = diagnostic.block ?? diagnostic.file + '-' + diagnostic.loc.row

    if (grouped.has(block)) {
      grouped.get(block).push(diagnostic)
    } else {
      grouped.set(block, [diagnostic])
    }
  }

  // Report per block, that will be cleaner from a UI perspective
  let blocks = Array.from(grouped.values())
  flush('')
  for (let diagnostics of blocks) {
    visuallyLinkNotesToDiagnostics(diagnostics)
    reportBlock(sources, diagnostics, flush)
    flush('')
  }
}

function visuallyLinkNotesToDiagnostics(diagnostics: Diagnostic[]) {
  let hasMultipleNotes = 0

  for (let diagnostic of diagnostics) {
    if (diagnostic.notes?.length > 0) {
      if (++hasMultipleNotes > 1) {
        break
      }
    }
  }

  if (hasMultipleNotes > 1) {
    let count = 0

    for (let diagnostic of diagnostics
      .slice()
      // We print them from top row to bottom row, however we also print the diagnostic from left to
      // right which means that the left most (first) will be rendered at the bottom, that's why we
      // need to flip the `col` coordinates as well so that we end up with 1-9 instead of 9-1.
      .sort((a, z) => a.loc.row - z.loc.row || z.loc.col - a.loc.col)) {
      if (diagnostic.notes?.length > 0) {
        let myCount = ++count
        diagnostic.message = `${diagnostic.message}${superScript(`(${myCount})`)}`
        for (let i = 0; i < diagnostic.notes.length; i++) {
          diagnostic.notes[i].note = `${myCount}. ${diagnostic.notes[i].note}`
        }
      }
    }
  }

  return diagnostics
}

function superScript(n: string) {
  return n
    .toString()
    .split('')
    .map((c) => SUPER_SCRIPT_MAP[c] ?? c)
    .join('')
}