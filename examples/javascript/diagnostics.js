let fs = require('fs/promises')
let { randomUUID } = require('crypto')

module.exports = async function run(files) {
  files = [].concat(files)
  let diagnostics = []

  for (let file of files) {
    let source = await fs.readFile(file, 'utf8')
    let block = randomUUID()
    for (let [rowIdx, row] of source.split('\n').entries()) {
      if (row.match(/=\s*(\w*)\s*([-+/*])\s*(\2*)/g)) {
        let [_, lhs, operator, rhs] = /(\w*)\s*([-+/*])\s*(\w*)/g.exec(row)
        let offset = row.indexOf(_)

        let [lhsType, lhsDefintionLocation] = (() => {
          let lhsLineIdx = source.split('\n').findIndex((line) => line.includes(`let ${lhs} `))
          let lhsLine = source.split('\n')[lhsLineIdx]
          let match = /let (\w*) = (['"`]?\w*['"`]?)/.exec(lhsLine)
          if (match) {
            let [, , lhsValue] = match
            if (Number(lhsValue.trim()).toString() === lhsValue.trim()) {
              return ['number', location(lhsLineIdx, lhsLine.indexOf(lhsValue), lhsValue.length)]
            }

            return ['string', location(lhsLineIdx, lhsLine.indexOf(lhsValue), lhsValue.length)]
          }

          return []
        })()

        let [rhsType, rhsDefintionLocation] = (() => {
          let rhsLineIdx = source.split('\n').findIndex((line) => line.includes(`let ${rhs} `))
          let rhsLine = source.split('\n')[rhsLineIdx]
          let match = /let (\w*) = (['"`]?\w*['"`]?)/.exec(rhsLine)
          if (match) {
            let [, , rhsValue] = match
            if (Number(rhsValue.trim()).toString() === rhsValue.trim()) {
              return ['number', location(rhsLineIdx, rhsLine.indexOf(rhsValue), rhsValue.length)]
            }

            return ['string', location(rhsLineIdx, rhsLine.indexOf(rhsValue), rhsValue.length)]
          }
          return []
        })()

        let messagesByOperator = {
          '-': () => `You cannot subtract a '${rhsType}' from a '${lhsType}'`,
          '+': () => `You cannot add a '${lhsType}' and a '${rhsType}'`,
          '/': () => `You cannot divide a '${lhsType}' by a '${rhsType}'`,
          '*': () => `You cannot multiply a '${lhsType}' and a '${rhsType}'`,
        }

        if (lhsType !== 'number' || rhsType !== 'number') {
          diagnostics.push({
            block,
            file,
            message: `This is of type '${lhsType}'`,
            loc: location(rowIdx, offset + _.indexOf(lhs), lhs.length),
          })
          diagnostics.push({
            block,
            file,
            message: messagesByOperator[operator](),
            loc: location(rowIdx, offset + _.indexOf(operator), operator.length),
          })
          diagnostics.push({
            block,
            file,
            message: `This is of type '${rhsType}'`,
            loc: location(rowIdx, offset + _.indexOf(rhs), rhs.length),
          })

          if (lhsType !== 'number') {
            diagnostics.push({
              block,
              file,
              message: `Consider changing this to a 'number'`,
              loc: lhsDefintionLocation,
            })
          }
          if (rhsType !== 'number') {
            diagnostics.push({
              block,
              file,
              message: `Consider changing this to a 'number'`,
              loc: rhsDefintionLocation,
            })
          }
        }
      }
    }
  }

  return diagnostics
}

function location(row, col, len = 1) {
  return { row: row + 1, col: col + 1, len }
}
