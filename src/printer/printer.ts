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

enum RowType {
  None = 0,

  // Code
  Code = 1 << 0,
  Whitespace = 1 << 1,
  ContextLine = 1 << 2,

  // Diagnostics
  Diagnostic = 1 << 3,
  DiagnosticVerticalConnector = 1 << 4,

  // Separator
  LineNumberSeparator = 1 << 5,

  // Notes
  Note = 1 << 6,
  StartOfNote = 1 << 7,
}

function createCell(value: string, type: RowType) {
  return { type, value }
}

function* createCells<T>(amount: number, cb: () => T) {
  for (let _ of range(amount)) {
    yield cb()
  }
}

function createDiagnosticCell(value: string, type = RowType.None) {
  return createCell(value, type | RowType.Diagnostic)
}

function createWhitespaceCell(value: string = ' ') {
  return { type: RowType.Whitespace, value }
}

function createNoneCell() {
  return { type: RowType.None, lineNumber: 0 }
}

type Row = Array<{ type: RowType; value: string }>

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
  let lines = source.split('\n')

  function typeCode(input: string[][]): Row[] {
    return input.map((row) =>
      row.map((value) => {
        let type = RowType.Code
        if (value === ' ') type |= RowType.Whitespace

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
    let afterEnd = Math.min(lineNumber + 1 + env.AFTER_CONTEXT_LINES_COUNT, lines.length - 1)
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
        line.findIndex((v) => !(v.type & RowType.Whitespace))
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
  let rowInfo = new Map<Row, { lineNumber?: number; type: RowType }>()
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
  function inject(idx: number, type: RowType, ...row: Row) {
    output.splice(idx, 0, row)
    rowInfo.set(row, { type })
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
  let gutterWidth = Array.from(printableLines.keys())
    .reduce((max, lineNumber) => Math.max(max, lineNumber + 1), -Infinity)
    .toString().length

  // Add printable lines to output
  for (let [lineNumber, line] of printableLines.entries()) {
    let hasDiagnostics = groupedByRow.has(lineNumber)
    let type = hasDiagnostics
      ? line.reduce((type, cell) => type | cell.type, RowType.None)
      : RowType.ContextLine

    let rowIdx = output.push(line) - 1

    rowInfo.set(output[rowIdx], { type, lineNumber })
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
        nextLine[position + 1] = createDiagnosticCell(
          decorate(CHARS.H),
          RowType.DiagnosticVerticalConnector
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

        let nextLine = output[nextLineIdx] ?? inject(nextLineIdx, RowType.Diagnostic)

        if (diagnostic.type === 'combined') {
          for (let { col, len } of diagnostic.locations!) {
            let attachmentIdx = col + Math.floor((len - 1) / 2) + 1 // Center of the highlighted word

            nextLine[attachmentIdx] = createDiagnosticCell(
              decorate(CHARS.V),
              RowType.DiagnosticVerticalConnector
            )
          }
        } else {
          nextLine[connectorIdx] = createDiagnosticCell(
            decorate(CHARS.V),
            RowType.DiagnosticVerticalConnector
          )
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

      function injectIfEnoughRoom(idx: number, start: number, type: RowType) {
        if (!output[idx] || output[idx].slice(start).length > 0) {
          return inject(idx, type)
        }

        let info = rowInfo.get(output[idx])!
        info.type |= type // Add the current type to the existing type

        return output[idx]
      }

      // Inject the message after the horizontal line
      if (!diagnostic.context || isLastDiagnosticInContext(diagnostic)) {
        let startPosition = lastLine.length - gutterWidth + 1 + GUTTER_WIDTH + PADDING + 1
        let lastLineOffset = lastLine.length
        let availableSpace = env.PRINT_WIDTH - startPosition
        if (availableSpace >= diagnostic.message.length) {
          lastLine.push(
            createCell(' ', RowType.Diagnostic | RowType.Whitespace),
            ...diagnostic.message.split('').map((v) => createDiagnosticCell(decorate(v)))
          )
        } else {
          // For the additional character that we are about to put in front of the multi-line
          // message. (1*)
          availableSpace -= 1
          let sentences = wordWrap(diagnostic.message, availableSpace)

          output[output.indexOf(lastLine)][connectorIdx] ??= createDiagnosticCell(decorate(CHARS.V))

          // When the sentences are too long, we split them in multi-line messages which in turn
          // will be "wrapped" in a little box which requires an additional line above and below.
          // This will make sure that we get that _before_ new line to work with.
          if (idx !== diagnostics.length - 1 && sentences.length > 1) {
            inject(output.indexOf(lastLine), RowType.Diagnostic)
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
            if (idx === 0) {
              lastLine.push(
                createCell(' ', RowType.Diagnostic | RowType.Whitespace),
                ...sentence.split('').map((v) => createDiagnosticCell(decorate(v)))
              )
            } else {
              lastLine.push(
                /* (1*) This extra character is why we added `availableSpace -= 1` */
                createDiagnosticCell(decorate(CHARS.V)),
                createCell(' ', RowType.Diagnostic | RowType.Whitespace),
                ...sentence.split('').map((v) => createDiagnosticCell(decorate(v)))
              )
            }

            lastLine = injectIfEnoughRoom(
              output.indexOf(lastLine) + 1,
              lastLineOffset - 1,
              RowType.Diagnostic
            )

            lastLine[lastLineOffset - 1] = createDiagnosticCell('')

            // Copy diagnostic lines from previous lines
            let previousLine = output[output.indexOf(lastLine) - 1].slice(0, connectorIdx)
            for (let [idx, cell] of previousLine.entries()) {
              if (cell && cell.type & RowType.DiagnosticVerticalConnector) {
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
    let { type: currentRowType, lineNumber } = rowInfo.get(output[rowIdx]) ?? createNoneCell()
    let { type: previousRowType } = rowInfo.get(output[rowIdx - 1]) ?? createNoneCell()
    let { type: nextRowType } = rowInfo.get(output[rowIdx + 1]) ?? createNoneCell()

    if (
      // Check structure
      previousRowType & RowType.Diagnostic &&
      currentRowType & RowType.ContextLine &&
      nextRowType & RowType.Diagnostic &&
      // Check validity of the context line
      output[rowIdx].every((v) => v.type & RowType.Whitespace)
    ) {
      // Drop information about this line
      rowInfo.delete(output[rowIdx])
      lineNumberToRow.delete(lineNumber!)

      // Remove line from output
      output.splice(rowIdx, 2) // TODO: Hmm, is this `2` correct? Why?
    }
  }

  // Inject breathing room between code lines and diagnostic lines
  for (let rowIdx = output.length - 1; rowIdx > 0; rowIdx--) {
    let { type: currentRowType } = rowInfo.get(output[rowIdx]) ?? createNoneCell()
    let { type: previousRowType } = rowInfo.get(output[rowIdx - 1]) ?? createNoneCell()

    // Both are diagnostic lines, so no need to inject breathing room between them
    if (previousRowType & RowType.Diagnostic && currentRowType & RowType.Diagnostic) {
      continue
    }

    if (
      previousRowType & RowType.Diagnostic &&
      currentRowType & (RowType.ContextLine | RowType.Code)
    ) {
      // Inject empty line between a code line and a non-code line. This will
      // later get turned into a non-code line.
      inject(rowIdx, RowType.Diagnostic)
    }
  }

  // Inject separator
  for (let rowIdx = output.length - 1; rowIdx > 0; rowIdx--) {
    let { type: currentRowType, lineNumber: currentLineNumber } =
      rowInfo.get(output[rowIdx]) ?? createNoneCell()
    let { type: previousRowType, lineNumber: previousLineNumber } =
      rowInfo.get(output[rowIdx - 1]) ?? createNoneCell()

    if (!(currentRowType & (RowType.Code | RowType.ContextLine))) continue
    if (!(previousRowType & (RowType.Code | RowType.ContextLine))) continue

    if (Number(currentLineNumber) - Number(previousLineNumber) > 1) {
      // Inject empty line between a code line and a non-code line. This will
      // later get turned into a non-code line.
      inject(rowIdx, RowType.LineNumberSeparator)
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
      inject(output.length, RowType.Diagnostic)
    }

    inject(output.length, RowType.StartOfNote, createCell(pc.dim(CHARS.H), RowType.StartOfNote))

    if (notes.length === 1 && notes[0].children.length === 0) {
      for (let note of notes) {
        let lastLine = inject(
          output.length,
          RowType.Diagnostic,
          ...createCells(PADDING, () => createCell(' ', RowType.Note)),
          ...'NOTE:'.split('').map((v) => createCell(pc.bold(pc.cyan(v)), RowType.Note)),
          createCell(' ', RowType.Note)
        )
        let indent = lastLine.length

        let availableSpace = env.PRINT_WIDTH - indent
        let wrapped = wordWrap(note.message, availableSpace)

        for (let [idx, line] of wrapped.entries()) {
          lastLine.push(...line.split('').map((v: string) => createCell(v, RowType.Note)))
          if (idx !== wrapped.length - 1) {
            lastLine = inject(
              output.length,
              RowType.Diagnostic,
              ...createCells(indent, () => createCell(' ', RowType.Note))
            )
          }
        }
      }
    } else {
      inject(
        output.length,
        RowType.Diagnostic,
        ...createCells(PADDING, () => createCell(' ', RowType.Note)),
        ...'NOTES:'.split('').map((v) => createCell(pc.bold(pc.cyan(v)), RowType.Note))
      )

      function renderNotes(notes: Notes, depth = 0) {
        for (let { message, children, diagnostic } of notes) {
          let decorate = diagnosticToColor.get(diagnostic)!

          let lastLine = inject(
            output.length,
            RowType.Diagnostic,
            ...createCells(PADDING + 2 + depth * 2, () => createCell(' ', RowType.Note))
          )

          let text: string = ''

          // Starting with a number like "1."
          if (/^\d*\./.test(message)) {
            let [, number, rest] = message.split(/(\d*\.)\s*(.*)/)
            lastLine.push(createCell(pc.dim(number), RowType.Note), createCell(' ', RowType.Note))
            text = rest
          }

          // Not starting with a number, just use `- {...note}`
          else {
            lastLine.push(createCell(pc.dim('-'), RowType.Note), createCell(' ', RowType.Note))
            text = message
          }

          let indent = lastLine.length

          let availableSpace = env.PRINT_WIDTH - indent - gutterWidth - GUTTER_WIDTH - PADDING
          let wrapped = wordWrap(text, availableSpace)

          for (let [idx, line] of wrapped.entries()) {
            lastLine.push(
              ...line.split('').map((v: string) => createCell(decorate(v), RowType.Note))
            )
            if (idx !== wrapped.length - 1) {
              lastLine = inject(
                output.length,
                RowType.Diagnostic,
                ...createCells(indent, () => createCell(' ', RowType.Note))
              )
            }
          }

          renderNotes(children, depth + 1)
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
      let { type, lineNumber: _lineNumber } = rowInfo.get(row) ?? createNoneCell()
      let emptyIndent = ' '.repeat(gutterWidth + GUTTER_WIDTH)

      let lineNumber = ((_lineNumber ?? 0) + 1).toString().padStart(gutterWidth, ' ')

      return {
        [RowType.None]() {
          return []
        },
        [RowType.Code]() {
          return [
            ...' '.repeat(GUTTER_WIDTH - 2),
            pc.bold(pc.red(CHARS.bigdot)),
            ' ',
            ...lineNumber,
            ' ',
            pc.dim(CHARS.V),
            ...row.map((data) => data.value),
          ]
        },
        [RowType.Code | RowType.Whitespace]() {
          return [
            ...' '.repeat(GUTTER_WIDTH - 2),
            pc.bold(pc.red(CHARS.bigdot)),
            ' ',
            ...lineNumber,
            ' ',
            pc.dim(CHARS.V),
            ...row.map((data) => data.value),
          ]
        },
        [RowType.ContextLine]() {
          return [
            ...' '.repeat(GUTTER_WIDTH),
            ...lineNumber.split('').map((v) => pc.dim(v)),
            ' ',
            pc.dim(CHARS.V),
            ...row.map(
              env.COLOR_CONTEXT_LINES
                ? (data) => data.value
                : (data) => {
                    if (data.type & RowType.Code) {
                      return pc.dim(clearAnsiEscapes(data.value))
                    }

                    return data.value
                  }
            ),
          ]
        },
        [RowType.Diagnostic]() {
          return [...emptyIndent, ' ', pc.dim(CHARS.dot), ...row.map((data) => data.value)]
        },
        [RowType.LineNumberSeparator]() {
          return [...emptyIndent, ' ', pc.dim(CHARS.VSeparator), ...row.map((data) => data.value)]
        },
        [RowType.StartOfNote]() {
          return [...emptyIndent, ' ', pc.dim(CHARS.LConnector), ...row.map((data) => data.value)]
        },
        [RowType.ContextLine | RowType.Diagnostic]() {
          return [
            ...' '.repeat(GUTTER_WIDTH),
            ...lineNumber.split('').map((v) => pc.dim(v)),
            ' ',
            pc.dim(CHARS.V),
            ...row.map(
              env.COLOR_CONTEXT_LINES
                ? (data) => data.value
                : (data) => {
                    if (data.type & RowType.Code) {
                      return pc.dim(clearAnsiEscapes(data.value))
                    }

                    return data.value
                  }
            ),
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
    let block = diagnostic.block ?? diagnostic.file + '-' + diagnostic.loc.row

    if (grouped.has(block)) {
      grouped.get(block)!.push(diagnostic)
    } else {
      grouped.set(block, [diagnostic])
    }
  }

  return grouped
}

export function printer(
  sources: Map<string, string>,
  diagnostics: Diagnostic[],
  flush = console.log
) {
  let diagnosticsPerBlock = prepareDiagnostics(diagnostics)

  // Report per block, that will be cleaner from a UI perspective
  flush('')
  for (let diagnostics of diagnosticsPerBlock.values()) {
    visuallyLinkNotesToDiagnostics(diagnostics)
    reportBlock(sources, diagnostics, flush)
    flush('')
  }
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
