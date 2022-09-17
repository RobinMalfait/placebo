import pc from 'picocolors'
import prettier from 'prettier'
import { clearAnsiEscapes, highlightCode } from '~/utils/highlight-code'
import { dedent } from '~/utils/dedent'
import CHARS from '~/printer/char-maps/fancy'

function parseTable(input: string) {
  let result: { widths: number[]; styles: ('left' | 'center' | 'right')[]; data: string[][] } = {
    widths: [],
    styles: [],
    data: [],
  }
  for (let [idx, line] of input.trim().split('\n').entries()) {
    if (idx === 1) {
      result.styles = line
        .split(/\s*\|\s*/g)
        .slice(1, -1)
        .map((cell) => {
          if (cell.startsWith(':') && cell.endsWith(':')) return 'center'
          if (cell.startsWith(':')) return 'left'
          if (cell.endsWith(':')) return 'right'
          return 'left'
        })
      continue // Skip the separator between header and content
    }
    let lastRow = result.data[result.data.push([]) - 1]
    for (let [idx, cell] of line
      .split(/\s*\|\s*/g)
      .slice(1, -1)
      .entries()) {
      result.widths[idx] = Math.max(result.widths[idx] ?? 0, cell.length)
      lastRow.push(cell)
    }
  }

  return result
}

function parseMarkdown(input: string, availableSpace: number) {
  return (
    prettier
      .format(input, {
        printWidth: availableSpace,
        proseWrap: 'always',
        parser: 'markdown',
      })

      // Syntax highlighting
      .replace(
        /(\s*)```(?<lang>.*)\n(?<code>[\s\S]*?)\n(\s*)```/gim,
        (_, indentBefore: string, lang: string, code: string, indentAfter: string) => {
          try {
            if (lang.startsWith('diff')) {
              lang = lang.replace('diff-', '')
              let diffs: string[] = []
              let highlighted = highlightCode(
                code
                  .split('\n')
                  .map((row, idx) => {
                    diffs[idx] = row.slice(0, 2)
                    return row.slice(2)
                  })
                  .join('\n'),
                lang
              )
                .split('\n')
                .map((row, idx) => {
                  let color = diffs[idx].startsWith('+')
                    ? pc.green
                    : diffs[idx].startsWith('-')
                    ? pc.red
                    : (v: string) => v
                  return `${color(diffs[idx])}${row}`
                })
                .join('\n')
              return [
                indentBefore + pc.dim('```' + lang + ' (diff)'),
                highlighted,
                indentAfter + pc.dim('```'),
              ].join('\n')
            } else {
              return [
                indentBefore + pc.dim('```' + lang),
                highlightCode(code, lang),
                indentAfter + pc.dim('```'),
              ].join('\n')
            }
          } catch (e) {
            return pc.dim(_)
          }
        }
      )

      // Inline code
      .replace(/`[^`\n]+`/gim, (code) => {
        return pc.blue(code)
      })

      // Heading
      .replace(/^#{1,6} .*/gim, (title) => {
        return pc.yellow(title)
      })

      // Horizontal ruler
      .replace(/^\s*?(---)\s/gim, (_, hr) => {
        return _.replace(hr, pc.dim(CHARS.dot.repeat(process.stdout.columns - 10 - 3)))
      })

      // Ordered lists
      .replace(/^\s*?((?:\d+\.)+)/gim, (_, lineNumber) => {
        return _.replace(lineNumber, pc.magenta(lineNumber))
      })

      // Unordered lists
      .replace(/^\s*?(-)\s/gim, (_, list) => {
        return _.replace(list, pc.dim(list))
      })

      // Blockquote
      .replace(/^\>(.*$)/gim, (_, quote) => {
        return pc.dim(pc.blue('\u258D') + quote)
      })

      // Tables
      .replace(/(\n?(\|.+\|\n)+)/gim, (table) => {
        let { widths, styles, data } = parseTable(table)

        // Format data
        let output = data.map((row, rowIdx) =>
          [
            pc.dim(
              `${rowIdx === 0 ? CHARS.TLSquare : CHARS.LConnector}${CHARS.H}${widths
                .map((width, idx) => CHARS.H.repeat(width))
                .join(
                  `${CHARS.H}${rowIdx === 0 ? CHARS.TConnector : CHARS.SConnector}${CHARS.H}`
                )}${CHARS.H}${rowIdx === 0 ? CHARS.TRSquare : CHARS.RConnector}`
            ),
            `${pc.dim(CHARS.V)} ${widths
              .map((width, columnIdx) => {
                let value = row[columnIdx] ?? ''
                let valueWidth = clearAnsiEscapes(value).length

                let cell = {
                  left: () => `${value}${' '.repeat(width - valueWidth)}`,
                  center: () => {
                    let before = Math.floor((width - valueWidth) / 2)
                    let after = Math.ceil((width - valueWidth) / 2)
                    return `${' '.repeat(before)}${value}${' '.repeat(after)}`
                  },
                  right: () => `${' '.repeat(width - valueWidth)}${value}`,
                }[styles[columnIdx]]()

                return rowIdx === 0 ? pc.bold(pc.blue(cell)) : cell
              })
              .join(` ${pc.dim(CHARS.V)} `)} ${pc.dim(CHARS.V)}`,
            ...(rowIdx === data.length - 1
              ? [
                  pc.dim(
                    `${CHARS.BLSquare}${CHARS.H}${widths
                      .map((width) => CHARS.H.repeat(width))
                      .join(`${CHARS.H}${CHARS.BConnector}${CHARS.H}`)}${CHARS.H}${CHARS.BRSquare}`
                  ),
                ]
              : []),
          ].join('\n')
        )

        return `\n${output.join('\n')}\n`
      })

      // Italic
      .replace(/_(.*)_/gim, (_, code) => {
        return pc.italic(code)
      })

      // Strikethrough
      .replace(/~~(.*)~~/gim, (_, code) => {
        return pc.strikethrough(code)
      })

      // Bold
      .replace(/\*\*(.*)\*\*/gim, (_, code) => {
        return pc.bold(code)
      })
      .trim()
  )
}

export function parseNotes(notes: string = ''): (availableSpace: number) => string[] {
  return (availableSpace: number) => {
    let output = parseMarkdown(dedent(notes), availableSpace)

    if (output === '') return []
    return output.split('\n')
  }
}
