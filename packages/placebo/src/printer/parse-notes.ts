import CHARS from '../printer/char-maps/fancy'
import { styles as ansiStyles } from '../utils/ansi'
import { rasterizeCode } from '../utils/highlight-code'

function parseMarkdown(input: string, availableSpace: number) {
  return (
    // Inline code
    input
      .replace(/`[^`\n]+`/gim, (code) => {
        return ansiStyles.blue(code)
      })

      // Heading
      .replace(/^#{1,6} .*/gim, (title) => {
        return ansiStyles.yellow(title)
      })

      // Links
      .replace(/(.)?\[(.*?)\]\((.*?)\)/g, (_, before, label, url) => {
        if (before === '!') return _ // Ignore images
        return ansiStyles.link(url, label)
      })

      // Horizontal ruler
      .replace(/^\s*?(---)\s/gim, (_, hr) => {
        return _.replace(hr, ansiStyles.dim(CHARS.dot.repeat(availableSpace)))
      })

      // Ordered lists
      .replace(/^\s*?((?:\d+\.)+)/gim, (_, lineNumber) => {
        return _.replace(lineNumber, ansiStyles.magenta(lineNumber))
      })

      // Unordered lists
      .replace(/^\s*?(-)\s/gim, (_, list) => {
        return _.replace(list, ansiStyles.dim(list))
      })

      // Blockquote
      .replace(/^\>(.*$)/gim, (_, quote) => {
        return ansiStyles.dim(ansiStyles.blue('\u258D') + quote)
      })

      // Italic
      .replace(/(.)?_(.*)_/gim, (_, before, code) => {
        if (before === '\\') return _.replace(/\\_/g, '_')
        return `${before}${ansiStyles.italic(code)}`
      })

      // Strikethrough
      .replace(/~~(.*)~~/gim, (_, code) => {
        return ansiStyles.strikethrough(code)
      })

      // Bold
      .replace(/\*\*(.*)\*\*/gim, (_, code) => {
        return ansiStyles.bold(code)
      })

      // Cleanup leading/trailing whitespace
      .trim()
  )
}

export function parseNotes(notes = ''): (availableSpace: number) => string[] {
  return (availableSpace: number) => {
    let output = parseMarkdown(notes, availableSpace)
    if (output === '') return []

    // The rasterization will normalize all the ansi escapes and apply them on
    // each character so that it never leaks styles.
    return rasterizeCode(output).map((x) => x.join(''))
  }
}
