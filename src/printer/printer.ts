import path from 'path'
import pc from 'picocolors'
import type { Diagnostic, InternalDiagnostic, Notes } from '~/types'

import { env } from '~/env'
import { clearAnsiEscapes, highlightCode, rasterizeCode } from '~/utils/highlight-code'
import { range } from '~/utils/range'
import { superScript } from '~/utils/super-script'
import { wordWrap } from '~/utils/word-wrap'
import { parseNotes } from '~/printer/parse-notes'
import CHARS from '~/printer/char-maps/fancy'

let COLORS = [pc.yellow, pc.red, pc.blue, pc.green, pc.magenta, pc.cyan]

// The default indentation to add some padding in the box.
let PADDING = 3

// The margin before the line numbers
let GUTTER_WIDTH = 2

enum Type {
  None = 0,

  // Code
  Code = 1 << 0,
  Whitespace = 1 << 1,
  ContextLine = 1 << 2,

  // Diagnostics
  Diagnostic = 1 << 3,
  DiagnosticVerticalConnector = 1 << 4,

  // Notes
  Note = 1 << 5,
  StartOfNote = 1 << 6,
}

function createCell(value: string, type: Type) {
  return { type, value }
}

function* createCells<T>(amount: number, cb: () => T) {
  for (let _ of range(amount)) {
    yield cb()
  }
}

function createDiagnosticCell(value: string, type = Type.None) {
  return createCell(value, type | Type.Diagnostic)
}

function createWhitespaceCell(value: string = ' ') {
  return { type: Type.Whitespace, value }
}

function createNoteCells(input: string | number, decorate = (s: string) => s) {
  if (typeof input === 'number') {
    return createCells(input, () => createCell(' ', Type.Note))
  }

  return input.split('').map((v) => createCell(decorate(v), Type.Note))
}

function createNoteTitle(input: string) {
  return createNoteCells(input, (s) => pc.bold(pc.cyan(s)))
}

type Row = Array<{ type: Type; value: string }>

function reportBlock(
  sources: Map<string, string>,
  diagnostics: InternalDiagnostic[],
  flush: (input: string) => void
) {
  // Group by same line
  let groupedByRow = new Map<number, InternalDiagnostic[]>()
  for (let diagnostic of diagnostics) {
    if (groupedByRow.has(diagnostic.loc.row)) {
      groupedByRow.get(diagnostic.loc.row)!.push(diagnostic)
    } else {
      groupedByRow.set(diagnostic.loc.row, [diagnostic])
    }
  }

  // TODO: This should probably be an array when we are rendering issues across
  // different files in the same block. In addition, diagnostic lines _can_
  // cross those file boundaries so that is going to be interesting...
  let file = diagnostics[0].file!
  let extension = path.extname(file).slice(1)

  let source = sources.get(file)!

  function typeCode(input: string[][]): Row[] {
    return input.map((row) =>
      row.map((value) => {
        let type = Type.Code
        if (clearAnsiEscapes(value) === ' ') type |= Type.Whitespace

        return { type, value }
      })
    )
  }

  let code = typeCode(rasterizeCode(highlightCode(source, extension)))

  // Find all printable lines. Lines with issues + context lines. We'll use an object for now which
  // will make it easier for overlapping context lines.
  let printableLines = new Map<number, Row>()
  for (let lineNumber of groupedByRow.keys()) {
    // Before context lines
    let beforeStart = Math.max(lineNumber - env.BEFORE_CONTEXT_LINES_COUNT, 0)
    for (let [idx, line] of code.slice(beforeStart, lineNumber).entries()) {
      printableLines.set(beforeStart + idx, line)
    }

    // Line with diagnostics
    printableLines.set(lineNumber, code[lineNumber])

    // After context lines
    let afterEnd = Math.min(lineNumber + 1 + env.AFTER_CONTEXT_LINES_COUNT, code.length - 1)
    for (let [idx, line] of code.slice(lineNumber + 1, afterEnd).entries()) {
      printableLines.set(lineNumber + 1 + idx, line)
    }
  }

  // Drop leading empty context lines, they are only noise
  for (let [lineNumber, line] of printableLines.entries()) {
    if (line.length > 0) break // Has contents in the line
    if (groupedByRow.has(lineNumber)) break // Has diagnostics attached

    printableLines.delete(lineNumber)
  }

  // Drop trailing empty context lines, they are only noise
  for (let [lineNumber, line] of Array.from(printableLines.entries()).reverse()) {
    if (line.length > 0) break // Has contents in the line
    if (groupedByRow.has(lineNumber)) break // Has diagnostics attached

    printableLines.delete(lineNumber)
  }

  // Strip leading whitespace
  let smallestIndentWidth = Infinity
  for (let line of printableLines.values()) {
    if (line.length === 0) continue // Empty line
    smallestIndentWidth = Math.min(
      smallestIndentWidth,
      Math.max(
        0,
        line.findIndex((v) => !(v.type & Type.Whitespace))
      )
    )
  }

  // Re-indent the lines
  for (let [lineNumber, line] of printableLines.entries()) {
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
    if (line.length <= 0) {
      printableLines.set(lineNumber, line)
      continue
    }

    printableLines.set(lineNumber, [...createCells(PADDING, createWhitespaceCell), ...line])
  }

  // Adjust column offsets for padding
  for (let diagnostics of groupedByRow.values()) {
    for (let diagnostic of diagnostics) {
      diagnostic.loc.col += PADDING
    }
  }

  // Keep track of things
  let output: Row[] = []
  let rowToLineNumber = new Map<Row, number>()
  let lineNumberToRow = new Map<number, Row>()
  let diagnosticToColor = new Map<InternalDiagnostic, (input: string) => string>()

  let diagnosticsByContextIdentifier = new Map<string | number | undefined, InternalDiagnostic[]>()

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
    printableLines.set(lineNumber, [
      ...createCells(diagnosticsByContextIdentifier.size, createWhitespaceCell),
      ...line,
    ])
  }

  // Adjust column offsets for vertical context lines
  for (let diagnostics of groupedByRow.values()) {
    for (let diagnostic of diagnostics) {
      diagnostic.loc.col += diagnosticsByContextIdentifier.size
    }
  }

  // Inject a row of a certain type at a certain position
  function inject(idx: number, ...row: Row) {
    output.splice(idx, 0, row)
    return output[idx]
  }

  function isLastDiagnosticInContext(diagnostic: InternalDiagnostic) {
    let diagnosticsInContext = diagnosticsByContextIdentifier.get(diagnostic.context)!
    return diagnosticsInContext[diagnosticsInContext.length - 1] === diagnostic
  }

  function isFirstDiagnosticInContext(diagnostic: InternalDiagnostic) {
    let diagnosticsInContext = diagnosticsByContextIdentifier.get(diagnostic.context)!
    return diagnosticsInContext[0] === diagnostic
  }

  // Calculate the biggest line number, so that we can pretty print it
  // correctly. E.g.: When we have 420 lines of code, then this number will be
  // `3`, because that's the amount of characters it requires.
  let lineNumberGutterWidth = Array.from(printableLines.keys())
    .reduce((max, lineNumber) => Math.max(max, lineNumber + 1), -Infinity)
    .toString().length

  // Add printable lines to output
  for (let [lineNumber, line] of printableLines.entries()) {
    let hasDiagnostics = groupedByRow.has(lineNumber)
    if (!hasDiagnostics) {
      for (let cell of line) {
        cell.type |= Type.ContextLine
      }
    }

    let rowIdx = output.push(line) - 1

    rowToLineNumber.set(output[rowIdx], lineNumber)
    lineNumberToRow.set(lineNumber, output[rowIdx])
  }

  // Add connector lines
  for (let [lineNumber, diagnosticz] of groupedByRow.entries()) {
    // Group diagnostics that belong together, together
    let diagnostics: InternalDiagnostic[] = []
    for (let diagnostic of diagnosticz) {
      let last = diagnostics[diagnostics.length - 1]
      if (last && last.message === diagnostic.message) {
        if (last.type !== 'combined') {
          last.type = 'combined'
          last.locations = [last.loc]
        }
        if (last.locations) {
          last.locations.push(diagnostic.loc)
        }
        continue
      }

      diagnostics.push(diagnostic)
    }

    let lastDiagnostic = diagnostics[diagnostics.length - 1]
    let lastPosition = (() => {
      if (lastDiagnostic.type === 'combined') {
        let { col, len } = lastDiagnostic.locations?.[lastDiagnostic.locations.length - 1]!
        return col + len + 1 /* Spacing */
      }

      return lastDiagnostic.loc.col + lastDiagnostic.loc.len + 1 /* Spacing */
    })()

    for (let [idx, diagnostic] of diagnostics.entries()) {
      let decorate = diagnosticToColor.get(diagnostic)!
      let rowIdx = output.indexOf(lineNumberToRow.get(lineNumber)!)

      let nextLine = output[rowIdx + 1] ?? inject(rowIdx + 1)

      // Reserve empty lines (if necessary) so that we can ensure we don't
      // print the diagnostics _over_ the context lines. We only have to do
      // this for the first diagnostic on this line, because the other
      // diagnostics will be printed on the right of the first one.
      if (idx === 0) {
        for (let offset of range(1, diagnostics.length + 2)) {
          let emptyRowIdx = rowIdx + offset
          if (!output[emptyRowIdx] || output[emptyRowIdx].slice(diagnostic.loc.col).length > 0) {
            inject(emptyRowIdx)
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
        nextLine = inject(rowIdx + 1)
      }

      // When highlighting a word, we will have 3 sections, a before
      // horizontal line(s), the connector and the after horizontal line(s).
      // E.g.: ─┬──
      // We will store the attachmentIdx, because we can use this exact
      // position for other lines below it.
      let connectorIdx = diagnostic.loc.col + Math.floor((diagnostic.loc.len - 1) / 2) + 1

      // Underline
      for (let position of range(diagnostic.loc.col, diagnostic.loc.col + diagnostic.loc.len)) {
        nextLine[position + 1] = createDiagnosticCell(
          decorate(CHARS.H),
          Type.DiagnosticVerticalConnector
        )
      }

      // Connector
      nextLine[connectorIdx] = createDiagnosticCell(decorate(CHARS.TConnector))

      // Vertical lines
      let requiredVerticalLines = diagnostics.length - idx - 1
      for (let offset of range(requiredVerticalLines)) {
        let nextLineIdx =
          rowIdx +
          offset +
          1 /* 1 line under the code has the `underline` */ +
          1 /* An additional line under the `underline` */

        let nextLine = output[nextLineIdx] ?? inject(nextLineIdx)

        if (diagnostic.type === 'combined') {
          for (let { col, len } of diagnostic.locations!) {
            let attachmentIdx = col + Math.floor((len - 1) / 2) + 1 // Center of the highlighted word

            nextLine[attachmentIdx] = createDiagnosticCell(
              decorate(CHARS.V),
              Type.DiagnosticVerticalConnector
            )
          }
        } else {
          nextLine[connectorIdx] = createDiagnosticCell(
            decorate(CHARS.V),
            Type.DiagnosticVerticalConnector
          )
        }
      }

      let lastLineIdx = Boolean(diagnostic.context)
        ? rowIdx + 2
        : rowIdx + (diagnostics.length - idx) + 1

      let lastLine = output[lastLineIdx] ?? inject(lastLineIdx)

      if (diagnostic.context && lastLine.slice(0, connectorIdx).length > 0) {
        lastLine = inject(lastLineIdx)
      }

      // Rounded corner
      if (!diagnostic.context) {
        lastLine[connectorIdx] = createDiagnosticCell(
          decorate(lastLine[connectorIdx] === undefined ? CHARS.BLRound : CHARS.LConnector)
        )
      } else {
        if (isLastDiagnosticInContext(diagnostic)) {
          lastLine[connectorIdx] = createDiagnosticCell(decorate(CHARS.BConnector))
        } else {
          lastLine[connectorIdx] = createDiagnosticCell(decorate(CHARS.BRRound))
        }
      }

      // Horizontal line next to rounded corner
      if (!diagnostic.context || isLastDiagnosticInContext(diagnostic)) {
        for (let x of range(lastPosition - connectorIdx + 1)) {
          lastLine[connectorIdx + 1 + x] = createDiagnosticCell(decorate(CHARS.H))
        }
      }

      if (diagnostic.context) {
        let offset =
          1 +
          contextIdentifiers.indexOf(diagnostic.context) *
            2 /* To have some breathing room between each line */

        for (let x of range(offset, connectorIdx)) {
          lastLine[x] = createDiagnosticCell(decorate(CHARS.H))
        }

        if (isFirstDiagnosticInContext(diagnostic)) {
          lastLine[offset] = createDiagnosticCell(decorate(CHARS.TLRound))
        } else if (isLastDiagnosticInContext(diagnostic)) {
          lastLine[offset] = createDiagnosticCell(decorate(CHARS.BLRound))
        } else {
          lastLine[offset] = createDiagnosticCell(decorate(CHARS.LConnector))
        }
      }

      if (diagnostic.type === 'combined') {
        for (let { col, len } of diagnostic.locations!.slice(1)) {
          let attachmentIdx = col + Math.floor((len - 1) / 2) + 1

          // Underline
          for (let position of range(col, col + len)) {
            nextLine[position + 1] = createDiagnosticCell(decorate(CHARS.H))
          }

          // Connector
          nextLine[attachmentIdx] = createDiagnosticCell(decorate(CHARS.TConnector))

          // Connect to the friend line below
          output[rowIdx + 1 + (diagnostics.length - idx)][attachmentIdx] = createDiagnosticCell(
            decorate(CHARS.BConnector)
          )
        }
      }

      function injectIfEnoughRoom(idx: number, start: number) {
        if (!output[idx] || output[idx].slice(start).length > 0) {
          return inject(idx)
        }

        return output[idx]
      }

      // Inject the message after the horizontal line
      if (!diagnostic.context || isLastDiagnosticInContext(diagnostic)) {
        let startPosition = lastLine.length - lineNumberGutterWidth + 1 + GUTTER_WIDTH + PADDING + 1
        let lastLineOffset = lastLine.length
        let availableSpace = env.PRINT_WIDTH - startPosition
        let mustBeMultiLine = diagnostic.message.includes('\n')
        if (!mustBeMultiLine && availableSpace >= diagnostic.message.length) {
          lastLine.push(
            createCell(' ', Type.Diagnostic | Type.Whitespace),
            ...diagnostic.message.split('').map((v) => createDiagnosticCell(decorate(v)))
          )
        } else {
          // For the additional character that we are about to put in front of the multi-line
          // message. (1*)
          availableSpace -= 1
          let sentences = diagnostic.message
            .split('\n')
            .flatMap((line) => wordWrap(line, availableSpace))

          output[output.indexOf(lastLine)][connectorIdx] ??= createDiagnosticCell(decorate(CHARS.V))

          // When the sentences are too long, we split them in multi-line messages which in turn
          // will be "wrapped" in a little box which requires an additional line above and below.
          // This will make sure that we get that _before_ new line to work with.
          if (idx !== diagnostics.length - 1 && sentences.length > 1) {
            inject(output.indexOf(lastLine))
          }

          {
            let offset = 1
            let base = output.indexOf(lastLine)
            while (output[base - offset]?.[connectorIdx] === undefined) {
              output[base - offset][connectorIdx] ??= createDiagnosticCell(decorate(CHARS.V))
              offset++
            }
          }

          // The "before" box art
          output[output.indexOf(lastLine) - 1][lastLineOffset - 1] = createDiagnosticCell(
            decorate(CHARS.TLRound)
          )
          output[output.indexOf(lastLine) - 1][lastLineOffset] = createDiagnosticCell(
            decorate(CHARS.H)
          )

          // Override the default `-` with a `|` to make the box look like a box.
          lastLine[lastLine.length - 1] = createDiagnosticCell(decorate(CHARS.RConnector))

          for (let [idx, sentence] of sentences.entries()) {
            if (idx !== 0) {
              lastLine.push(
                /* (1*) This extra character is why we added `availableSpace -= 1` */
                createDiagnosticCell(decorate(CHARS.V))
              )
            }

            lastLine.push(
              createCell(' ', Type.Diagnostic | Type.Whitespace),
              ...sentence.split('').map((v) => createDiagnosticCell(decorate(v)))
            )

            lastLine = injectIfEnoughRoom(output.indexOf(lastLine) + 1, lastLineOffset - 1)

            lastLine[lastLineOffset - 1] = createDiagnosticCell('')

            // Copy diagnostic lines from previous lines
            let previousLine = output[output.indexOf(lastLine) - 1].slice(0, connectorIdx)
            for (let [idx, cell] of previousLine.entries()) {
              if (cell && cell.type & Type.DiagnosticVerticalConnector) {
                output[output.indexOf(lastLine)][idx] ??= { ...cell }
              }
            }
          }

          // Fill in the blanks for all diagnostics that are not the first nor the last one, just
          // the inbetween ones.
          if (
            idx !== 0 &&
            diagnostics.filter(
              (d) => d.loc.row === diagnostic.loc.row && d.loc.col === diagnostic.loc.col
            ).length > 1
          ) {
            let offset = 0
            let base = output.indexOf(lastLine)
            while (output[base - offset]?.[connectorIdx] === undefined) {
              output[base - offset][connectorIdx] ??= createDiagnosticCell(decorate(CHARS.V))
              offset++
            }
          }

          // The "after" box art
          lastLine.push(
            createDiagnosticCell(decorate(CHARS.BLRound)),
            createDiagnosticCell(decorate(CHARS.H))
          )
        }
      }
    }
  }

  // Drop "useless" context lines. A useless context line is one that is empty
  // surrounded by diagnostic lines.
  for (let rowIdx = output.length - 1; rowIdx > 0; rowIdx--) {
    let previousRow = output[rowIdx - 1] ?? []
    let currentRow = output[rowIdx] ?? []
    let nextRow = output[rowIdx + 1] ?? []

    let previousRowType =
      previousRow.reduce((acc, cell) => acc | cell.type, Type.None) || Type.Diagnostic
    let currentRowType =
      currentRow.reduce((acc, cell) => acc | cell.type, Type.None) || Type.Diagnostic
    let nextRowType = nextRow.reduce((acc, cell) => acc | cell.type, Type.None) || Type.Diagnostic

    if (
      // Check structure
      previousRowType & Type.Diagnostic &&
      currentRowType & Type.ContextLine &&
      nextRowType & Type.Diagnostic &&
      // Check validity of the context line
      currentRow.every((c) => c.type & Type.Whitespace)
    ) {
      // Drop information about this line
      lineNumberToRow.delete(rowToLineNumber.get(currentRow)!)
      rowToLineNumber.delete(output[rowIdx])

      // Remove line from output
      output.splice(rowIdx, 2) // TODO: Hmm, is this `2` correct? Why?
    }
  }

  // Inject breathing room between code lines and diagnostic lines
  for (let rowIdx = output.length - 1; rowIdx > 0; rowIdx--) {
    let previousRow = output[rowIdx - 1] ?? []
    let currentRow = output[rowIdx] ?? []

    // Both are diagnostic lines, so no need to inject breathing room between them
    if (
      previousRow.some((cell) => cell.type & Type.Diagnostic) &&
      currentRow.some((cell) => cell.type & Type.Diagnostic)
    ) {
      continue
    }

    if (
      previousRow.some((cell) => cell.type & Type.Diagnostic) &&
      currentRow.some((cell) => cell.type & (Type.ContextLine | Type.Code))
    ) {
      // Inject empty line between a code line and a non-code line. This will
      // later get turned into a non-code line.
      inject(rowIdx)
    }
  }

  // Inject separator
  for (let rowIdx = output.length - 1; rowIdx > 0; rowIdx--) {
    let previousRow = output[rowIdx - 1] ?? []
    let currentRow = output[rowIdx] ?? []

    if (!currentRow.some((cell) => cell.type & (Type.Code | Type.ContextLine))) continue
    if (!previousRow.some((cell) => cell.type & (Type.Code | Type.ContextLine))) continue

    let currentLineNumber = rowToLineNumber.get(currentRow)
    let previousLineNumber = rowToLineNumber.get(previousRow)

    if (Number(currentLineNumber) - Number(previousLineNumber) > 1) {
      // Inject empty line between a code line and a non-code line. This will
      // later get turned into a non-code line.
      inject(rowIdx)
    }
  }

  // Render vertical lines for diagnostics with the same context
  let seen = new Set<string | number>()
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
    let inbetweenPositions = new Set<number>()
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
        output[position][offset] = createDiagnosticCell(decorate(CHARS.LConnector))
      } else {
        output[position][offset] = createDiagnosticCell(decorate(CHARS.V))
      }
    }
  }

  // NOTES
  let notes: Notes = Array.from(
    new Set(
      (Array.from(groupedByRow.values()).flat(Infinity) as InternalDiagnostic[])
        // We print them from top row to bottom row, however we also print the diagnostic from left to
        // right which means that the left most (first) will be rendered at the bottom, that's why we
        // need to flip the `col` coordinates as well so that we end up with 1-9 instead of 9-1.
        .sort((a, z) => a.loc.row - z.loc.row || z.loc.col - a.loc.col)
        .flatMap((diagnostic) => diagnostic.notes ?? [])
    )
  )

  if (notes.length > 0) {
    for (let _ of range(1)) {
      inject(output.length)
    }

    inject(output.length, createCell(pc.dim(CHARS.H), Type.StartOfNote))

    if (notes.length === 1 && notes[0].children.length === 0) {
      for (let note of notes) {
        let lastLine = inject(
          output.length,
          ...createCells(PADDING, () => createCell(' ', Type.Note)),
          ...createNoteTitle('NOTE: ')
        )
        let indent = lastLine.length

        let availableSpace = env.PRINT_WIDTH - indent
        let wrapped = wordWrap(note.message, availableSpace)

        for (let [idx, line] of wrapped.entries()) {
          lastLine.push(...createNoteCells(line))
          if (idx !== wrapped.length - 1) {
            lastLine = inject(output.length, ...createNoteCells(indent))
          }
        }
      }
    } else {
      inject(output.length, ...createNoteCells(PADDING), ...createNoteTitle('NOTES:'))

      function renderNotes(notes: Notes, depth = 0) {
        for (let { message, children, diagnostic } of notes) {
          let decorate = diagnosticToColor.get(diagnostic)!

          let lastLine = inject(output.length, ...createNoteCells(PADDING + 2 + depth * 2))

          let text: string = ''

          // Starting with a number like "1."
          if (/^\d*\./.test(message)) {
            let [, number, rest] = message.split(/(\d*\.)\s*(.*)/)
            lastLine.push(createCell(pc.dim(number), Type.Note), createCell(' ', Type.Note))
            text = rest
          }

          // Not starting with a number, just use `- {...note}`
          else {
            lastLine.push(createCell(pc.dim('-'), Type.Note), createCell(' ', Type.Note))
            text = message
          }

          let indent = lastLine.length

          let availableSpace =
            env.PRINT_WIDTH - indent - lineNumberGutterWidth - GUTTER_WIDTH - PADDING
          let wrapped = wordWrap(text, availableSpace)

          for (let [idx, line] of wrapped.entries()) {
            lastLine.push(...createNoteCells(line, decorate))
            if (idx !== wrapped.length - 1) {
              lastLine = inject(output.length, ...createNoteCells(indent))
            }
          }

          renderNotes(children, depth + 1)
        }
      }

      renderNotes(notes)
    }
  }

  // Add a frame around the output
  let outputOfStrings = [
    // Opening block
    [
      ...' '.repeat(lineNumberGutterWidth + 1 + GUTTER_WIDTH),
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
    [...' '.repeat(lineNumberGutterWidth + 1 + GUTTER_WIDTH), CHARS.V].map((v) => pc.dim(v)),

    // Gutter + existing output
    ...output.map((row, i, all) => {
      let _lineNumber = rowToLineNumber.get(row)
      let lineNumber = (typeof _lineNumber === 'number' ? _lineNumber + 1 : '')
        .toString()
        .padStart(lineNumberGutterWidth, ' ')

      let rowType = row.reduce((acc, cell) => acc | cell.type, Type.None) || Type.Diagnostic

      let result = [
        // Gutter
        ...' '.repeat(GUTTER_WIDTH + lineNumberGutterWidth + 1 /* space behind the line number */),

        // Line numbers
        ...(rowType & Type.Code ? [pc.dim(CHARS.V)] : []),

        // Diagnostic | Note
        ...(rowType & (Type.Diagnostic | Type.Note | Type.Whitespace) && !(rowType & Type.Code)
          ? [pc.dim(CHARS.dot)]
          : []),

        // Start of note
        ...(rowType & Type.StartOfNote ? [pc.dim(CHARS.LConnector)] : []),

        // Rest
        ...row.map(
          env.COLOR_CONTEXT_LINES
            ? (data) => data.value
            : (data) => {
                if (data.type & Type.ContextLine) {
                  return pc.dim(clearAnsiEscapes(data.value))
                }

                return data.value
              }
        ),
      ]

      // Insert the line numbers for code & context lines
      if (rowType & Type.Code) {
        result.splice(
          GUTTER_WIDTH,
          lineNumber.length,
          ...(rowType & Type.ContextLine
            ? lineNumber.split('').map((x) => pc.dim(x))
            : lineNumber.split(''))
        )
      }

      // Add the red dot indiciator befor the line numbers that have diagnostics attached to them.
      if (rowType & Type.Code && !(rowType & Type.ContextLine)) {
        result.splice(GUTTER_WIDTH - 2, 1, pc.bold(pc.red(CHARS.bigdot)))
      }

      // Mark empty lines with `·`, unless there are multiple line numbers (more than 2) in between,
      // then we can mark it with a better visual clue that there are multiple lines: `┊`.
      {
        let previousLineNumber = rowToLineNumber.get(all[i - 1])
        let nextLineNumber = rowToLineNumber.get(all[i + 1])

        if (
          rowType === Type.Diagnostic &&
          previousLineNumber !== undefined &&
          nextLineNumber !== undefined &&
          Number(nextLineNumber) - Number(previousLineNumber) > 2
        ) {
          result.splice(GUTTER_WIDTH + lineNumberGutterWidth + 1, 1, pc.dim(CHARS.VSeparator))
        }
      }

      return result
    }),

    // Closing block
    notes.length <= 0
      ? [...' '.repeat(lineNumberGutterWidth + 1 + GUTTER_WIDTH), CHARS.V].map((v) => pc.dim(v))
      : null,
    [...' '.repeat(lineNumberGutterWidth + 1 + GUTTER_WIDTH), CHARS.BLSquare, CHARS.H].map((v) =>
      pc.dim(v)
    ),
  ].filter(Boolean) as string[][]

  // Flush everything
  for (let line of outputOfStrings.splice(0)) {
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

function prepareDiagnostics(diagnostics: Diagnostic[]) {
  let all = diagnostics
    // `row` and `col` are 1-based when they come in. This is because most tools use `row` and
    // `col` to point to a location in your editor and editors usually start with `1` instead of
    // `0`. For now, let's make it a bit simpler and use them as 0-based values.
    .map((d) => ({
      ...d,
      loc: { ...d.loc, row: d.loc.row - 1, col: d.loc.col - 1 },
    }))

    // Sort diagnostics by location, first by row then by column so that it is sorted top to
    // bottom, left to right.
    .sort((a, z) => a.loc.row - z.loc.row || a.loc.col - z.loc.col)

    // Cleanup notes to a consistent nested structure.
    .map((d) => {
      let copy = { ...d }
      // @ts-expect-error Uh yeah so w/e
      copy.notes = parseNotes(d.notes, copy)
      return copy as unknown as InternalDiagnostic
    })

  let grouped = new Map<string, InternalDiagnostic[]>()
  for (let diagnostic of all) {
    let block = diagnostic.block
      ? diagnostic.file + diagnostic.block // Scope per file and block
      : diagnostic.file + '-' + diagnostic.loc.row // Scope by file and line number by default

    if (grouped.has(block)) {
      grouped.get(block)!.push(diagnostic)
    } else {
      grouped.set(block, [diagnostic])
    }
  }

  return Array.from(grouped.values())
}

export function printer(
  sources: Map<string, string>,
  diagnostics: Diagnostic[],
  flush = console.log
) {
  env.DEBUG && console.time('[PLACEBO]: Print')
  let diagnosticsPerBlock = prepareDiagnostics(diagnostics)

  // Report per block, that will be cleaner from a UI perspective
  for (let [idx, diagnostics] of diagnosticsPerBlock.entries()) {
    if (idx === 0) flush('')

    visuallyLinkNotesToDiagnostics(diagnostics)
    reportBlock(sources, diagnostics, flush)
    flush('')
  }
  env.DEBUG && console.timeEnd('[PLACEBO]: Print')
}

function visuallyLinkNotesToDiagnostics(diagnostics: InternalDiagnostic[]) {
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
          diagnostic.notes[i].message = `${myCount}. ${diagnostic.notes[i].message}`
        }
      }
    }
  }

  return diagnostics
}
