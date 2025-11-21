import { env, parseNumberEnv } from '../env'
import CHARS from '../printer/char-maps/fancy'
import { Type, type Diagnostic, type InternalDiagnostic, type Location } from '../types'
import { styles } from '../utils/ansi'
import { DefaultMap } from '../utils/default-map'
import { clearAnsiEscapes, rasterizeCode } from '../utils/highlight-code'
import { createLineTable } from '../utils/line-table'
import { range } from '../utils/range'
import { wordWrap } from '../utils/word-wrap'
import { parseNotes } from './parse-notes'

const COLORS = [styles.yellow, styles.red, styles.blue, styles.magenta, styles.cyan, styles.green]

// The default indentation to add some padding in the box.
const PADDING = 3

export interface PrinterOptions {
  /**
   * Where we should write the output to. Will be called with each diagnostic
   * block.
   *
   * Defaults to: `console.error`
   */
  write?: (block: string) => void

  /**
   * Resolve source code for a given file.
   *
   * Will only be used if `diagnostic.source` is not provided.
   */
  source?: (file: string) => string

  /**
   * Which formatter to use for printing diagnostics.
   *
   * Defaults to: `'cli'`
   */
  formatter?: 'cli' | 'html'

  /**
   * Rendering options that influence how diagnostics are rendered.
   */
  rendering?: {
    /**
     * The amount of lines of the source code to show before a diagnostic line.
     *
     * Defaults to:       `3`
     * Overrideable via:  `process.env.PLACEBO_CONTEXT_LINES_BEFORE`
     */
    beforeContextLines?: number

    /**
     * The amount of lines of the source code to show after a diagnostic line.
     *
     * Defaults to:       `3`
     * Overrideable via:  `process.env.PLACEBO_CONTEXT_LINES_AFTER`
     */
    afterContextLines?: number

    /**
     * Available print width for rendering the diagnostics.
     *
     * Defaults to:       `process.stdout.columns ?? 80`
     * Overrideable via:  `process.env.PLACEBO_PRINT_WIDTH`
     */
    printWidth?: number

    /**
     * A way to format the file path when printing diagnostics.
     *
     * In Node-like environments, this will render paths relative to the
     * `process.cwd()` by default.
     */
    formatFilePath?: (file: string) => string
  }
}

export function print(diagnostics: Iterable<Diagnostic>, options: PrinterOptions = {}) {
  env.DEBUG && console.time('[PLACEBO]: Print')

  let printer = new Printer(options.write ?? console.error, options.source, {
    get beforeContextLines() {
      return parseNumberEnv(
        'PLACEBO_CONTEXT_LINES_BEFORE',
        options.rendering?.beforeContextLines ?? 3,
      )
    },
    get afterContextLines() {
      return parseNumberEnv(
        'PLACEBO_CONTEXT_LINES_AFTER',
        options.rendering?.afterContextLines ?? 3,
      )
    },
    get printWidth() {
      return parseNumberEnv(
        'PLACEBO_PRINT_WIDTH',
        options.rendering?.printWidth ?? process.stdout.columns ?? 80,
      )
    },
    formatFilePath(file) {
      let fn =
        options.rendering?.formatFilePath ??
        ((file) => {
          // Create relative paths when running in Node-like environments
          if (typeof process !== 'undefined') {
            let path = require('path')
            let relative = path.relative(process.cwd(), path.resolve(file))
            return relative.startsWith('.') || relative.startsWith('/') ? relative : `./${relative}`
          }

          // Fallback: return the original file path
          return file
        })
      return fn(file)
    },
  })
  printer.print(diagnostics)

  // Cleanup resources after printing
  printer.dispose()

  env.DEBUG && console.timeEnd('[PLACEBO]: Print')
}

class Printer {
  constructor(
    private write: (msg: string) => void = console.error,
    private resolveSource: (file: string) => string = () => '',
    private rendering: Required<NonNullable<PrinterOptions['rendering']>>,
  ) {}

  pathToSource = new DefaultMap((file: string) => this.resolveSource(file))
  lineTables = new DefaultMap((source: string) => createLineTable(source))
  sourceToGrid = new DefaultMap((source: string) => {
    let rasterizedCode = rasterizeCode(source)
    let typedCode = typeCode(rasterizedCode)
    return typedCode
  })

  dispose() {
    this.pathToSource.clear()
    this.lineTables.clear()
    this.sourceToGrid.clear()
  }

  print(diagnostics: Iterable<Diagnostic>) {
    let blocks = this.prepareDiagnostics(diagnostics)

    for (let block of blocks) {
      this.write(this.reportBlock(block))
    }
  }

  private prepareDiagnostics(diagnostics: Iterable<Diagnostic>): InternalDiagnostic[][] {
    let seen = new Set<string>()

    let lineTables = this.lineTables
    let pathToSource = this.pathToSource
    let sourceToGrid = this.sourceToGrid

    let internalDiagnostics = Array.from(diagnostics)
      .filter(dedupe)
      .flatMap(splitMultiLine)
      .map(intoInternalDiagnostic)

    // Dedupe diagnostics. We can assume that incoming diagnostics are already
    // deduped, but if they aren't we will see potentially weird results.
    // Let's dedupe them anyway.
    function dedupe(diagnostic: Diagnostic) {
      let key = [diagnostic.file, diagnostic.location.join(','), diagnostic.message].join(';;')

      if (seen.has(key)) {
        return false
      }

      seen.add(key)
      return true
    }

    // Map multi-line diagnostics to multiple single-line diagnostics. Temporary
    // solution until we have proper multi-line diagnostic rendering.
    function splitMultiLine(diagnostic: Diagnostic): Diagnostic[] {
      let [startLine, startCol, endLine, endCol] = diagnostic.location
      if (startLine === endLine) {
        return [diagnostic]
      }

      let source = diagnostic.source ?? pathToSource.get(diagnostic.file)

      let locations: Location[] = []
      for (let line = startLine; line <= endLine; line++) {
        let offset = lineTables.get(source).findOffset({ line, column: startCol })

        if (line === startLine) {
          let endOfLineOffset = source.indexOf('\n', offset)
          let endCol = lineTables.get(source).find(endOfLineOffset).column - 1
          locations.push([line, startCol, line, endCol])
        } else if (line === endLine) {
          let startCol = source.search(/\S/) + 1
          locations.push([line, startCol, line, endCol])
        } else {
          let startCol = source.slice(offset).search(/\S/) + 1
          let endOfLineOffset = source.indexOf('\n', offset)
          let endCol = lineTables.get(source).find(endOfLineOffset).column - 1
          locations.push([line, startCol, line, endCol])
        }
      }

      return locations.map((location) => {
        return {
          ...diagnostic,

          // Link diagnostics together based on original location (if the
          // relatedId wasn't set already)
          relatedId: diagnostic.relatedId ?? `${startLine}:${startCol}-${endLine}:${endCol}`,

          location,
        }
      })
    }

    // Map the public diagnostic to the internal diagnostic. For now this is the
    // easiest thing to get things working without changing all the internals.
    function intoInternalDiagnostic(diagnostic: Diagnostic): InternalDiagnostic {
      let source = diagnostic.source ?? pathToSource.get(diagnostic.file)
      let code = sourceToGrid.get(source)

      let [startLine, startCol, _, endCol] = diagnostic.location

      let internalDiagnostic: InternalDiagnostic = {
        file: diagnostic.file,
        code,
        message: diagnostic.message,
        loc: {
          row: startLine,
          col: startCol,
          len: endCol - startCol,
        },
        notes: parseNotes(diagnostic.notes),
        blockId: diagnostic.blockId ?? null,
        relatedId: diagnostic.relatedId ?? null,
      }

      // `row` and `col` are 1-based when they come in. This is because most
      // tools use `row` and `col` to point to a location in your editor and
      // editors usually start with `1` instead of `0`. For now, let's make it a
      // bit simpler and use them as 0-based values.
      internalDiagnostic.loc.row -= 1
      internalDiagnostic.loc.col -= 1

      return internalDiagnostic
    }

    let all = internalDiagnostics
      // Sort diagnostics by location, first by row then by column so that it is
      // sorted top to bottom, left to right.
      .sort((a, z) => a.loc.row - z.loc.row || a.loc.col - z.loc.col)

    let grouped = new DefaultMap<string, InternalDiagnostic[]>(() => [])
    for (let diagnostic of all) {
      let block = diagnostic.blockId
        ? diagnostic.file + diagnostic.blockId // Scope per file and block
        : `${diagnostic.file}-${diagnostic.loc.row}` // Scope by file and line number by default

      grouped.get(block).push(diagnostic)
    }

    return Array.from(grouped.values())
  }

  private reportBlock(diagnostics: InternalDiagnostic[]): string {
    let availableSpace = this.rendering.printWidth

    // Reserve space for the frame and gutter around the code
    let diagnosticIndicatorLength = 1
    availableSpace -= diagnosticIndicatorLength

    let lineNumberPaddingLeft = 1
    availableSpace -= lineNumberPaddingLeft

    let maxLineNumber = diagnostics[diagnostics.length - 1]?.loc?.row ?? 0
    maxLineNumber += this.rendering.afterContextLines
    maxLineNumber = Math.min(maxLineNumber, diagnostics[diagnostics.length - 1]?.code.length)

    let lineNumberLength = maxLineNumber.toString().length
    availableSpace -= lineNumberLength

    let lineNumberPaddingRight = 1
    availableSpace -= lineNumberPaddingRight

    let frameWallLength = 1
    availableSpace -= frameWallLength

    let paddingLeft = PADDING
    availableSpace -= paddingLeft

    let paddingRight = PADDING
    availableSpace -= paddingRight

    // Group by same line
    let groupedByRow = new DefaultMap<number, InternalDiagnostic[]>(() => [])
    for (let diagnostic of diagnostics) {
      groupedByRow.get(diagnostic.loc.row).push(diagnostic)
    }

    // TODO: This should probably be an array when we are rendering issues across
    // different files in the same block. In addition, diagnostic lines _can_
    // cross those file boundaries so that is going to be interesting...
    let file = diagnostics[0]?.file
    let code = diagnostics[0]?.code

    // Find all printable lines. Lines with issues + context lines. We'll use an object for now which
    // will make it easier for overlapping context lines.
    let printableLines = new Map<number, Item>()
    for (let lineNumber of groupedByRow.keys()) {
      // Before context lines
      let beforeStart = Math.max(lineNumber - this.rendering.beforeContextLines, 0)
      for (let [idx, line] of code.slice(beforeStart, lineNumber).entries()) {
        printableLines.set(
          beforeStart + idx,
          line.map((x) => ({ ...x })),
        )
      }

      // Line with diagnostics
      printableLines.set(lineNumber, code[lineNumber]?.map((x) => ({ ...x })) ?? [])

      // After context lines
      let afterEnd = Math.min(lineNumber + 1 + this.rendering.afterContextLines, code.length - 1)
      for (let [idx, line] of code.slice(lineNumber + 1, afterEnd).entries()) {
        printableLines.set(
          lineNumber + 1 + idx,
          line.map((x) => ({ ...x })),
        )
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
    let smallestIndentWidth = Number.POSITIVE_INFINITY
    for (let line of printableLines.values()) {
      if (line.length === 0) continue // Empty line
      smallestIndentWidth = Math.min(
        smallestIndentWidth,
        Math.max(
          0,
          line.findIndex((v) => !(v.type & Type.Whitespace)),
        ),
      )
    }

    for (let [lineNumber, line] of printableLines.entries()) {
      // Re-indent the line
      line = line.slice(smallestIndentWidth)

      // Add padding to the line
      if (line.length <= 0) {
        printableLines.set(lineNumber, line)
      } else {
        printableLines.set(lineNumber, [...createCells(PADDING, createWhitespaceCell), ...line])
      }
    }

    // Adjust column offsets
    for (let diagnostics of groupedByRow.values()) {
      for (let diagnostic of diagnostics) {
        // Adjust column offset for re-indenting
        diagnostic.loc.col -= smallestIndentWidth + 1

        // Adjust column offset for padding
        diagnostic.loc.col += PADDING
      }
    }

    // Keep track of things
    let output: Item[] = []
    let rowToLineNumber = new Map<Item, number>()
    let lineNumberToRow = new Map<number, Item>()
    let diagnosticToColor = new Map<InternalDiagnostic, (input: string) => string>()

    let diagnosticsByContext = new DefaultMap<string | null, InternalDiagnostic[]>(() => [])

    // Group by context
    for (let diagnostic of diagnostics) {
      if (!diagnostic.relatedId) continue
      diagnosticsByContext.get(diagnostic.relatedId).push(diagnostic)
    }

    // Find the correct color per diagnostic
    for (let [idx, diagnostic] of diagnostics.entries()) {
      if (diagnosticsByContext.has(diagnostic.relatedId)) {
        let [firstDiagnostic] = diagnosticsByContext.get(diagnostic.relatedId) ?? []

        if (diagnosticToColor.has(firstDiagnostic!)) {
          diagnosticToColor.set(diagnostic, diagnosticToColor.get(firstDiagnostic!) ?? ((x) => x))
        } else {
          diagnosticToColor.set(diagnostic, COLORS[idx % COLORS.length]!)
        }
      } else {
        diagnosticToColor.set(diagnostic, COLORS[idx % COLORS.length]!)
      }
    }

    // Let's cleanup contexts if there is only a single one
    for (let [context, diagnostics] of diagnosticsByContext) {
      if (diagnostics.length > 1) continue

      for (let diagnostic of diagnostics) {
        diagnostic.relatedId = null
        diagnosticsByContext.delete(context)
      }
    }

    //
    let contextIdentifiers = Array.from(diagnosticsByContext.keys())

    // Reserve whitespace for vertical context lines
    for (let [lineNumber, line] of printableLines.entries()) {
      printableLines.set(lineNumber, [
        ...createCells(diagnosticsByContext.size, createWhitespaceCell),
        ...line,
      ])
    }

    // Adjust column offsets for vertical context lines
    for (let diagnostics of groupedByRow.values()) {
      for (let diagnostic of diagnostics) {
        diagnostic.loc.col += diagnosticsByContext.size
      }
    }

    // Inject a certain a row at a certain position, and return it
    function inject(idx: number, ...row: Item) {
      output.splice(idx, 0, row)
      return output[idx]
    }

    function isLastDiagnosticInContext(diagnostic: InternalDiagnostic) {
      let diagnosticsInContext = diagnosticsByContext.get(diagnostic.relatedId) ?? []
      return diagnosticsInContext[diagnosticsInContext.length - 1] === diagnostic
    }

    function isFirstDiagnosticInContext(diagnostic: InternalDiagnostic) {
      let diagnosticsInContext = diagnosticsByContext.get(diagnostic.relatedId) ?? []
      return diagnosticsInContext[0] === diagnostic
    }

    let forcedIndentByLineNumber = new Map<number, number>()

    // Add printable lines to output
    for (let [lineNumber, line] of printableLines) {
      let hasDiagnostics = groupedByRow.has(lineNumber)
      if (!hasDiagnostics) {
        for (let cell of line) {
          cell.type |= Type.ContextLine
        }
      }

      if (line.length >= availableSpace) {
        // A contextual code line that is too long
        if (!hasDiagnostics) {
          // Cut-off contextual lines that are too long at the end
          line = line.slice(0, availableSpace - 1)
          line.push({ type: Type.Code, value: styles.dim(CHARS.ellipsis) })

          let rowIdx = output.push(line) - 1

          rowToLineNumber.set(output[rowIdx]!, lineNumber)
          lineNumberToRow.set(lineNumber, output[rowIdx]!)
        }

        // A code line that is too long
        else {
          let whitespaceIndent = line.findIndex((v) => !(v.type & Type.Whitespace))
          let [before, current, after] = [-1, 0, 1].map((offset) =>
            Math.max(
              code[lineNumber + offset]?.findIndex((v) => !(v.type & Type.Whitespace)) ?? 0,
              0,
            ),
          )
          let indent = Math.min(
            8, // 8+ indents is just crazy...
            Math.abs(before! - current!) ||
              Math.abs(current! - after!) ||
              0 /* A default indent of 0 characters if we can't figure it out based on previous and next lines */,
          )
          let forcedIndent = whitespaceIndent + indent
          forcedIndentByLineNumber.set(lineNumber, forcedIndent)
          let widthPerLine =
            availableSpace -
            whitespaceIndent -
            indent -
            2 /* (1) For the \u21B3 and ' ' characters */ -
            8 /* An arbitrary value to leave some room for the actual diagnostic */

          let lines: Item[] = []
          let offset = 0
          while (line.length - offset > 0) {
            let nextLine = line.slice(offset, offset + widthPerLine)
            if (nextLine.length === widthPerLine) {
              let lastWhiteSpaceIdx = nextLine
                .slice()
                .reverse()
                .findIndex((x) => x.type & Type.Whitespace)
              if (lastWhiteSpaceIdx > 0) {
                nextLine = nextLine.slice(0, -lastWhiteSpaceIdx)
              }
            }

            if (lines.length === 0) {
              lines.push(nextLine)
            } else {
              lines.push([
                ...createCells(forcedIndent, () => ({
                  type: Type.Code | Type.Whitespace,
                  value: ' ',
                })),
                // START (1)
                { type: Type.Code | Type.Wrapped, value: styles.black('\u21B3') },
                createWhitespaceCell(),
                // END (1)
                ...nextLine,
              ])
            }

            offset += nextLine.length
            if (nextLine.length === 0) break
          }

          let diagnostics = groupedByRow.get(lineNumber)
          let moved = new Map<InternalDiagnostic, number>()

          // Adjust diagnostics location info to link to the correct line after word-wrapping.
          for (let diagnostic of diagnostics) {
            for (let [lineIdx, line] of lines.entries()) {
              if (diagnostic.loc.col > line.length) {
                diagnostic.loc.col -= line.length
                diagnostic.loc.col += forcedIndent
                diagnostic.loc.col += 2 /* (1) For the \u21B3 and ' ' characters */
              }

              // Found the target location
              else if (!moved.has(diagnostic)) {
                let subLineNumber = (lineNumber * 10 + lineIdx) / 10
                moved.set(diagnostic, subLineNumber)
                break // It fits now!
              }
            }
          }

          // Actually move diagnostics to the new line location
          for (let [diagnostic, newLineNumber] of moved) {
            // Remove diagnostic from existing diagnostics
            let idx = diagnostics.indexOf(diagnostic)
            if (idx !== -1) {
              diagnostics.splice(idx, 1)
              if (diagnostics.length === 0) {
                groupedByRow.delete(lineNumber)
              }
            }

            // Move diagnostic to new location
            let newGroup = groupedByRow.get(newLineNumber)
            newGroup.push(diagnostic)
            groupedByRow.set(newLineNumber, newGroup)
          }

          for (let [lineIdx, line] of lines.entries()) {
            output.push(line)

            if (lineIdx === 0) {
              rowToLineNumber.set(line, lineNumber)
              lineNumberToRow.set(lineNumber, line)
            } else {
              let localLineNumber = (lineNumber * 10 + lineIdx) / 10

              rowToLineNumber.set(line, localLineNumber)
              lineNumberToRow.set(localLineNumber, line)
            }
          }
        }
      } else {
        output.push(line)

        rowToLineNumber.set(line, lineNumber)
        lineNumberToRow.set(lineNumber, line)
      }
    }

    for (let [lineNumber, row] of lineNumberToRow) {
      let diagnostics = groupedByRow.getRaw(lineNumber)
      if (!diagnostics) continue

      for (let diagnostic of diagnostics) {
        if (diagnostic.loc.col + diagnostic.loc.len >= row.length) {
          // TODO: Figure out if the diagnostic is pointing to a location that doesn't exist (e.g.: a
          // missing semicolon after the line). By definition it would point to a `col` that exceeds
          // the `row.length` therefore it is "split up" incorrectly.
          if (diagnostic.loc.len === 1) continue // Hacky solution, or good?
          let next = { ...diagnostic, loc: { ...diagnostic.loc } }
          let decorate = diagnosticToColor.get(diagnostic) ?? ((x) => x)
          diagnosticToColor.set(next, decorate)

          let skipWhitespaceAmount =
            row
              .slice()
              .reverse()
              .findIndex((x) => !(x.type & Type.Whitespace)) + 1

          let newLen = row.length - diagnostic.loc.col - skipWhitespaceAmount
          if (newLen <= 0) {
            diagnostic.loc.col =
              (forcedIndentByLineNumber.get(lineNumber | 0) ?? 0) +
              2 /* (1) For the \u21B3 and ' ' characters */
            diagnostic.loc.row += 1
            diagnostic.loc.col -= 1

            let nextLineNumber = (lineNumber * 10 + 1) / 10

            let idx = diagnostics.indexOf(diagnostic)
            if (idx !== -1) {
              diagnostics.splice(idx, 1)
              if (diagnostics.length === 0) {
                groupedByRow.delete(lineNumber)
              }
            }

            // Move diagnostic to new location
            let newGroup = groupedByRow.get(nextLineNumber) ?? []
            newGroup.push(diagnostic)
            groupedByRow.set(nextLineNumber, newGroup)
          } else {
            diagnostic.loc.len = newLen
            next.loc.len -= newLen + skipWhitespaceAmount
            next.loc.col =
              (forcedIndentByLineNumber.get(lineNumber | 0) ?? 0) +
              2 /* (1) For the \u21B3 and ' ' characters */
            next.loc.row += 1

            // TODO: Why is this needed?
            next.loc.len += 1
            next.loc.col -= 1

            let nextLineNumber = (lineNumber * 10 + 1) / 10

            let nextDiagnostics = groupedByRow.get(nextLineNumber) ?? []
            nextDiagnostics.push(next)
            groupedByRow.set(nextLineNumber, nextDiagnostics)
          }
        }
      }
    }

    // Add connector lines
    for (let [lineNumber, diagnosticz] of Array.from(groupedByRow.entries()).reverse()) {
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

      let lastDiagnostic = diagnostics[diagnostics.length - 1]!
      let lastPosition = (() => {
        if (lastDiagnostic.type === 'combined') {
          let { col, len } = lastDiagnostic.locations?.[lastDiagnostic.locations.length - 1] ?? {
            col: 0,
            len: 0,
          }
          return col + len + 1 /* Spacing */
        }

        return lastDiagnostic.loc.col + lastDiagnostic.loc.len + 1 /* Spacing */
      })()

      for (let [idx, diagnostic] of diagnostics.entries()) {
        let decorate = diagnosticToColor.get(diagnostic) ?? ((x) => x)
        let rowIdx = output.indexOf(lineNumberToRow.get(lineNumber) ?? [])

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
        if (diagnostic.relatedId && nextLine!.slice(0, diagnostic.loc.col).length > 0) {
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
          nextLine![position + 1] = createDiagnosticCell(decorate(CHARS.H), Type.Diagnostic)
        }

        // Connector
        nextLine![connectorIdx] = createDiagnosticCell(decorate(CHARS.TConnector))

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
            for (let { col, len } of diagnostic.locations ?? []) {
              let attachmentIdx = col + Math.floor((len - 1) / 2) + 1 // Center of the highlighted word

              nextLine![attachmentIdx] = createDiagnosticCell(
                decorate(CHARS.V),
                Type.DiagnosticVerticalConnector,
              )
            }
          } else {
            nextLine![connectorIdx] = createDiagnosticCell(
              decorate(CHARS.V),
              Type.DiagnosticVerticalConnector,
            )
          }
        }

        let lastLineIdx = diagnostic.relatedId
          ? rowIdx + 2
          : rowIdx + (diagnostics.length - idx) + 1

        let lastLine = output[lastLineIdx] ?? inject(lastLineIdx)

        if (diagnostic.relatedId && lastLine!.slice(0, connectorIdx).length > 0) {
          lastLine = inject(lastLineIdx)
        }

        // Rounded corner
        if (!diagnostic.relatedId) {
          lastLine![connectorIdx] = createDiagnosticCell(
            decorate(lastLine![connectorIdx] === undefined ? CHARS.BLRound : CHARS.LConnector),
          )
        } else {
          if (isLastDiagnosticInContext(diagnostic)) {
            lastLine![connectorIdx] = createDiagnosticCell(decorate(CHARS.BConnector))
          } else {
            lastLine![connectorIdx] = createDiagnosticCell(decorate(CHARS.BRRound))
          }
        }

        // Horizontal line next to rounded corner
        if (!diagnostic.relatedId || isLastDiagnosticInContext(diagnostic)) {
          for (let x of range(lastPosition - connectorIdx + 1)) {
            lastLine![connectorIdx + 1 + x] = createDiagnosticCell(decorate(CHARS.H))
          }
        }

        if (diagnostic.relatedId) {
          let offset =
            1 +
            contextIdentifiers.indexOf(diagnostic.relatedId) *
              2 /* To have some breathing room between each line */

          for (let x of range(offset, connectorIdx)) {
            lastLine![x] = createDiagnosticCell(decorate(CHARS.H))
          }

          if (isFirstDiagnosticInContext(diagnostic)) {
            lastLine![offset] = createDiagnosticCell(decorate(CHARS.TLRound))
          } else if (isLastDiagnosticInContext(diagnostic)) {
            lastLine![offset] = createDiagnosticCell(decorate(CHARS.BLRound))
          } else {
            lastLine![offset] = createDiagnosticCell(decorate(CHARS.LConnector))
          }
        }

        if (diagnostic.type === 'combined') {
          for (let { col, len } of diagnostic.locations?.slice(1) ?? []) {
            let attachmentIdx = col + Math.floor((len - 1) / 2) + 1

            // Underline
            for (let position of range(col, col + len)) {
              nextLine![position + 1] = createDiagnosticCell(decorate(CHARS.H))
            }

            // Connector
            nextLine![attachmentIdx] = createDiagnosticCell(decorate(CHARS.TConnector))

            // Connect to the friend line below
            output[rowIdx + 1 + (diagnostics.length - idx)]![attachmentIdx] = createDiagnosticCell(
              decorate(CHARS.BConnector),
            )
          }
        }

        function injectIfEnoughRoom(idx: number, start: number) {
          if (!output[idx] || output[idx].length >= start) {
            return inject(idx)
          }

          return output[idx]
        }

        // Inject the message after the horizontal line
        if (!diagnostic.relatedId || isLastDiagnosticInContext(diagnostic)) {
          let lastLineOffset = lastLine!.length
          let availableWorkingSpace = availableSpace - lastLine!.length

          let mustBeMultiLine = diagnostic.message.includes('\n')
          if (!mustBeMultiLine && availableWorkingSpace >= diagnostic.message.length) {
            lastLine!.push(
              createCell(' ', Type.Diagnostic | Type.Whitespace),
              ...diagnostic.message.split('').map((v) => createDiagnosticCell(decorate(v))),
            )
          } else {
            // For the additional character that we are about to put in front of the multi-line
            // message. (1*)
            availableWorkingSpace -= 1
            let sentences = diagnostic.message
              .split('\n')
              .flatMap((line) => wordWrap(line, availableWorkingSpace))

            output[output.indexOf(lastLine!)]![connectorIdx] ??= createDiagnosticCell(
              decorate(CHARS.V),
            )

            // When the sentences are too long, we split them in multi-line messages which in turn
            // will be "wrapped" in a little box which requires an additional line above and below.
            // This will make sure that we get that _before_ new line to work with.
            if (idx !== diagnostics.length - 1 && sentences.length > 1) {
              inject(output.indexOf(lastLine!))
            }

            {
              let offset = 1
              let base = output.indexOf(lastLine!)
              while (output[base - offset]?.[connectorIdx] === undefined) {
                output[base - offset]![connectorIdx] ??= createDiagnosticCell(decorate(CHARS.V))
                offset++
              }
            }

            // The "before" box art
            output[output.indexOf(lastLine!) - 1]![lastLineOffset - 1] = createDiagnosticCell(
              decorate(CHARS.TLRound),
            )
            output[output.indexOf(lastLine!) - 1]![lastLineOffset] = createDiagnosticCell(
              decorate(CHARS.H),
            )

            // Override the default `-` with a `|` to make the box look like a box.
            lastLine![lastLine!.length - 1] = createDiagnosticCell(decorate(CHARS.RConnector))

            for (let [idx, sentence] of sentences.entries()) {
              if (idx !== 0) {
                lastLine!.push(
                  /* (1*) This extra character is why we added `availableWorkingSpace -= 1` */
                  createDiagnosticCell(decorate(CHARS.V)),
                )
              }

              lastLine!.push(
                createCell(' ', Type.Diagnostic | Type.Whitespace),
                ...sentence.split('').map((v) => createDiagnosticCell(decorate(v))),
              )

              lastLine = injectIfEnoughRoom(output.indexOf(lastLine!) + 1, lastLineOffset - 1)

              lastLine![lastLineOffset - 1] = createDiagnosticCell('')

              // Copy diagnostic lines from previous lines
              let previousLine = output[output.indexOf(lastLine!) - 1]!.slice(0, connectorIdx)
              for (let [idx, cell] of previousLine.entries()) {
                if (cell && cell.type & Type.DiagnosticVerticalConnector) {
                  output[output.indexOf(lastLine!)]![idx] ??= { ...cell }
                }
              }
            }

            // Fill in the blanks for all diagnostics that are not the first nor the last one, just
            // the in between ones.
            if (
              idx !== 0 &&
              diagnostics.filter(
                (d) => d.loc.row === diagnostic.loc.row && d.loc.col === diagnostic.loc.col,
              ).length > 1
            ) {
              let offset = 0
              let base = output.indexOf(lastLine!)
              while (output[base - offset]?.[connectorIdx] === undefined) {
                output[base - offset]![connectorIdx] ??= createDiagnosticCell(decorate(CHARS.V))
                offset++
              }
            }

            // The "after" box art
            lastLine!.push(
              createDiagnosticCell(decorate(CHARS.BLRound)),
              createDiagnosticCell(decorate(CHARS.H)),
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

      let previousRowType = combinedType(previousRow) || Type.Diagnostic
      let currentRowType = combinedType(currentRow) || Type.Diagnostic
      let nextRowType = combinedType(nextRow) || Type.Diagnostic

      if (
        // Check structure
        previousRowType & Type.Diagnostic &&
        currentRowType & Type.ContextLine &&
        nextRowType & Type.Diagnostic &&
        // Check validity of the context line
        currentRow.every((c) => c.type & Type.Whitespace)
      ) {
        // Drop information about this line
        let number = rowToLineNumber.get(currentRow)
        if (number !== undefined) lineNumberToRow.delete(number)
        rowToLineNumber.delete(output[rowIdx]!)

        // Remove line from output
        output.splice(rowIdx, 1)
      }
    }

    // Inject breathing room between code lines and diagnostic lines
    for (let rowIdx = output.length - 1; rowIdx > 0; rowIdx--) {
      let previousRow = output[rowIdx - 1] ?? []
      let currentRow = output[rowIdx] ?? []

      // Both are diagnostic lines, so no need to inject breathing room between them
      if (hasType(previousRow, Type.Diagnostic) && hasType(currentRow, Type.Diagnostic)) {
        continue
      }

      if (
        hasType(previousRow, Type.Diagnostic) &&
        hasType(currentRow, Type.ContextLine | Type.Code)
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

      if (!hasType(currentRow, Type.Code | Type.ContextLine)) continue
      if (!hasType(previousRow, Type.Code | Type.ContextLine)) continue

      let currentLineNumber = rowToLineNumber.get(currentRow) ?? 0
      let previousLineNumber = rowToLineNumber.get(previousRow) ?? 0

      if (((currentLineNumber - previousLineNumber) | 0) > 1) {
        // Inject empty line between a code line and a non-code line. This will
        // later get turned into a non-code line.
        inject(rowIdx)
      }
    }

    // Render vertical lines for diagnostics with the same context
    let seen = new Set<string | number>()
    for (let diagnostic of diagnostics) {
      if (!diagnostic.relatedId) continue
      if (seen.has(diagnostic.relatedId)) continue
      seen.add(diagnostic.relatedId)

      let decorate = diagnosticToColor.get(diagnostic) ?? ((x) => x)
      let offset =
        1 /* Offset for the gutter line */ +
        contextIdentifiers.indexOf(diagnostic.relatedId) *
          2 /* To have some breathing room between each line */

      let diagnosticsInContext = diagnosticsByContext.get(diagnostic.relatedId)?.slice()
      let startRowIdx = (diagnosticsInContext ?? []).reduce(
        (smallestRowIdx, diagnostic) => Math.min(smallestRowIdx, diagnostic.loc.row),
        Number.POSITIVE_INFINITY,
      )
      startRowIdx = output.indexOf(lineNumberToRow.get(startRowIdx) ?? []) + 3
      let endRowIdx = (diagnosticsInContext ?? []).reduce(
        (largestRowIdx, diagnostic) => Math.max(largestRowIdx, diagnostic.loc.row),
        Number.NEGATIVE_INFINITY,
      )
      endRowIdx = output.indexOf(lineNumberToRow.get(endRowIdx) ?? []) + 1

      // Diagnostics in this group in between the start & end positions
      let inBetweenPositions = new Set<number>()
      for (let diagnostic of (diagnosticsInContext ?? []).slice(1, -1)) {
        let row = lineNumberToRow.get(diagnostic.loc.row) ?? []
        let rowIdx = output.indexOf(row)

        inBetweenPositions.add(
          rowIdx +
            2 /* Because we have 2 lines below the actual diagnostic. 1 underline, 1 rounded corner */,
        )
      }

      for (let position = startRowIdx; position <= endRowIdx; position++) {
        if (inBetweenPositions.has(position)) {
          output[position]![offset] = createDiagnosticCell(decorate(CHARS.LConnector))
        } else {
          output[position]![offset] = createDiagnosticCell(decorate(CHARS.V))
        }
      }
    }

    // NOTES
    let noteGroups = (
      Array.from(groupedByRow.values()).flat(Number.POSITIVE_INFINITY) as InternalDiagnostic[]
    )
      // We print them from top row to bottom row, however we also print the diagnostic from left to
      // right which means that the left most (first) will be rendered at the bottom, that's why we
      // need to flip the `col` coordinates as well so that we end up with 1-9 instead of 9-1.
      .sort((a, z) => a.loc.row - z.loc.row || z.loc.col - a.loc.col)
      .map((diagnostic) => diagnostic.notes(availableSpace))
      .filter((notes) => notes.length > 0)

    // TODO: Clean this up, make it more efficient
    {
      let seen = new Set<string>()
      noteGroups = noteGroups.filter((notes) => {
        let key = notes.join('')
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    }

    if (noteGroups.length > 0) {
      for (let _ of range(1)) {
        inject(output.length)
      }

      for (let notes of noteGroups) {
        inject(output.length, createCell('', Type.StartOfNote))

        if (noteGroups.length > 1 && notes.length > 1) {
          inject(output.length)
        }

        for (let note of notes) {
          let lastLine = inject(output.length, ...createNoteCells(PADDING))
          lastLine!.push(createCell(note, Type.Note))
        }

        if (noteGroups.length > 1 && notes.length > 1) {
          inject(output.length)
        }
      }
    }

    function responsiveFileName(path: string) {
      let reserved = 1 /* TLSquare */ + 1 /* H */ + 1 /* [ */ + 1 /* ] */
      let width = availableSpace - reserved

      // If it already fits, then we are good to go
      if (path.length <= width) return path

      // Try to simplify folders starting from the beginning
      while (path.length > width) {
        let before = path
        path = path.replace(/([^/])[^/]+[\/]/, '$1/')
        if (before === path) break // No more changes happened
      }

      // Still not good enough, let's try to remove the start of the filename itself
      let offset = 0
      if (path.length > width) {
        offset++
        let lastSlashIdx = path.lastIndexOf('/') + 1
        let remaining = path.length - width

        path = path.replace(path.slice(lastSlashIdx, lastSlashIdx + remaining), CHARS.ellipsis)
      }

      let lastSlashIdx = path.lastIndexOf('/') + 1

      path = styles.dim(path.slice(0, lastSlashIdx + offset)) + path.slice(lastSlashIdx + offset)

      return path
    }

    // Add a frame around the output
    let outputOfStrings = [
      // Opening block
      [
        ...' '.repeat(
          diagnosticIndicatorLength +
            lineNumberPaddingLeft +
            lineNumberLength +
            lineNumberPaddingRight,
        ),
        styles.dim(CHARS.TLSquare),
        styles.dim(CHARS.H),
        styles.dim('['),
        styles.bold(responsiveFileName(this.rendering.formatFilePath(file))),
        styles.dim(']'),
      ],
      [
        ...' '.repeat(
          diagnosticIndicatorLength +
            lineNumberPaddingLeft +
            lineNumberLength +
            lineNumberPaddingRight,
        ),
        CHARS.V,
      ].map((v) => styles.dim(v)),

      // Gutter + existing output
      ...output.map((row, i, all) => {
        let rowType = combinedType(row) || Type.Diagnostic

        let _lineNumber = rowToLineNumber.get(row)
        let lineNumber = (
          rowType & Type.Wrapped ? '' : typeof _lineNumber === 'number' ? _lineNumber + 1 : ''
        )
          .toString()
          .padStart(lineNumberLength, ' ')

        let result: string[] = []

        // Diagnostic indicator
        if (rowType & Type.Code && !(rowType & (Type.ContextLine | Type.Wrapped))) {
          result.push(styles.red(CHARS.bigdot))
        } else {
          result.push(' '.repeat(diagnosticIndicatorLength))
        }

        // Line number padding left
        result.push(' '.repeat(lineNumberPaddingLeft))

        // Insert the line numbers for code & context lines
        if (rowType & Type.Code) {
          if (rowType & Type.ContextLine) {
            result.push(styles.dim(lineNumber))
          } else {
            result.push(lineNumber)
          }
        } else {
          result.push(' '.repeat(lineNumberLength))
        }

        // Line number padding right
        result.push(' '.repeat(lineNumberPaddingRight))

        // Frame wall
        {
          // Mark empty lines with `·`, unless there are multiple line numbers (more than 2) in between,
          // then we can mark it with a better visual clue that there are multiple lines: `┊`.
          let previousLineNumber = rowToLineNumber.get(all[i - 1]!)
          let nextLineNumber = rowToLineNumber.get(all[i + 1]!)

          if (
            rowType === Type.Diagnostic &&
            Number(nextLineNumber) - Number(previousLineNumber) > 2
          ) {
            result.push(styles.dim(CHARS.VSeparator))
          }

          // Code
          else if (rowType & Type.Code) {
            result.push(styles.dim(CHARS.V))
          }

          // Diagnostic | Note
          else if (rowType & (Type.Diagnostic | Type.Note | Type.Whitespace)) {
            result.push(styles.dim(CHARS.dot))
          }

          // Start of note
          else if (rowType & Type.StartOfNote) {
            result.push(styles.dim(CHARS.LConnector) + styles.dim(CHARS.H))
          }

          // Empty wall (probably shouldn't happen)
          else {
            result.push(' '.repeat(frameWallLength))
          }
        }

        // The actual contents
        result = result.concat(
          row.map((data) => {
            if (data.type & Type.ContextLine) {
              return styles.dim(clearAnsiEscapes(data.value))
            }

            return data.value
          }),
        )

        return result
      }),

      // Closing block
      noteGroups.length <= 0
        ? [
            ...' '.repeat(
              diagnosticIndicatorLength +
                lineNumberPaddingLeft +
                lineNumberLength +
                lineNumberPaddingRight,
            ),
            CHARS.V,
          ].map((v) => styles.dim(v))
        : null,
      [
        ...' '.repeat(
          diagnosticIndicatorLength +
            lineNumberPaddingLeft +
            lineNumberLength +
            lineNumberPaddingRight,
        ),
        CHARS.BLSquare,
        CHARS.H,
      ].map((v) => styles.dim(v)),
    ].filter(Boolean) as string[][]

    // Write the block
    {
      let output: string[] = []
      for (let line of outputOfStrings.splice(0)) {
        let msg = ''
        // Some of the output arrays are holey/sparse, using a normal `.map()`,
        // those empty spots won't be mapped, with a normal for loop however,
        // they will be `undefined`.
        for (let cell of line) {
          msg += cell ?? ' '
        }
        output.push(msg)
      }
      return output.join('\n')
    }
  }
}

function combinedType(row: { type: Type }[]) {
  let type = Type.None
  for (let cell of row) {
    if (!cell) continue // Holes
    type |= cell.type
  }
  return type
}

function hasType(row: { type: Type }[], type: Type) {
  for (let cell of row) {
    if (!cell) continue // Holes
    if (cell.type & type) return true
  }
  return false
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

function createWhitespaceCell(value = ' ') {
  return { type: Type.Whitespace, value }
}

function createNoteCells(input: string | number, decorate = (s: string) => s) {
  if (typeof input === 'number') {
    return createCells(input, () => createCell(' ', Type.Note))
  }

  return input.split('').map((v) => createCell(decorate(v), Type.Note))
}

type Item = { type: Type; value: string }[]

function typeCode(input: string[][]): Item[] {
  return input.map((row) =>
    row.map((value) => {
      let type = Type.Code
      if (clearAnsiEscapes(value) === ' ') type |= Type.Whitespace

      return { type, value }
    }),
  )
}
