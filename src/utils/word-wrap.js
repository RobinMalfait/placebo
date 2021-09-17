let { range } = require('./range')

// Ref: https://xxyxyz.org/line-breaking/
// This is implemented in O(n ^ 2), however I'm assuming that every diagnostic
// message is not too big and therefore this isn't a big problem.
module.exports.wordWrap = function wordWrap(text, width) {
  let words = text.split(' ')
  let count = words.length
  let slack = Array.from({ length: count }, () => Array(count).fill(0))

  for (let i of range(count)) {
    slack[i][i] = width - words[i].length
    for (let j of range(i + 1, count)) {
      slack[i][j] = slack[i][j - 1] - words[j].length - 1
    }
  }

  let minima = [0, ...Array(count).fill(Infinity)]
  let breaks = Array(count).fill(0)

  for (let j of range(count)) {
    let i = j
    while (i >= 0) {
      let cost = slack[i][j] < 0 ? Infinity : minima[i] + slack[i][j] ** 2
      if (minima[j + 1] > cost) {
        minima[j + 1] = cost
        breaks[j] = i
      }

      i--
    }
  }

  let lines = []
  let j = count
  while (j > 0) {
    let i = breaks[j - 1]
    lines.unshift(words.slice(i, j).join(' '))
    j = i
  }

  return lines
}
