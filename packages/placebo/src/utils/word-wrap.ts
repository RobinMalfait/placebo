import { range } from '../utils/range'

export function wordWrap(
  text: string,
  width: number,
  type: 'simple' | 'pretty' = 'pretty',
): string[] {
  switch (type) {
    case 'simple':
      return wordWrapSimple(text, width)
    case 'pretty':
      return wordWrapPretty(text, width)
    default:
      throw new Error(`Unknown word wrap type: ${type}`)
  }
}

function wordWrapSimple(text: string, width: number): string[] {
  let lines: string[] = []
  let words = text.split(/(\s+)/g)
  let currentLine = ''

  for (let word of words) {
    if (currentLine.length + word.length + 1 <= width) {
      currentLine += word
    } else {
      if (currentLine) {
        lines.push(currentLine.trim())
      }

      currentLine = word
    }
  }

  if (currentLine) {
    lines.push(currentLine.trim())
  }

  return lines
}

// Ref: https://xxyxyz.org/line-breaking/
// This is implemented in O(n ^ 2), however I'm assuming that every diagnostic
// message is not too big and therefore this isn't a big problem.
function wordWrapPretty(text: string, width: number): string[] {
  let words = text.split(' ')
  width = Math.max(width, ...words.map((w) => w.length))

  let count = words.length
  let slack = Array.from({ length: count }, () => Array(count).fill(0))

  for (let i of range(count)) {
    slack[i][i] = width - words[i].length
    for (let j of range(i + 1, count)) {
      slack[i][j] = slack[i][j - 1] - words[j].length - 1
    }
  }

  let minima = [0, ...Array(count).fill(Number.POSITIVE_INFINITY)]
  let breaks = Array(count).fill(0)

  for (let j of range(count)) {
    let i = j
    while (i >= 0) {
      let cost = slack[i][j] < 0 ? Number.POSITIVE_INFINITY : minima[i] + slack[i][j] ** 2
      if (minima[j + 1] > cost) {
        minima[j + 1] = cost
        breaks[j] = i
      }

      i--
    }
  }

  let lines: string[] = []
  let j = count
  while (j > 0) {
    let i = breaks[j - 1]
    lines.unshift(words.slice(i, j).join(' '))
    j = i
  }

  return lines
}
