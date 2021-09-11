let fs = require('fs')
let path = require('path')
let { randomUUID } = require('crypto')
let { printer } = require('../../src')

let file = path.resolve(__dirname, './code.js')

let source = fs.readFileSync(file, 'utf8')
let sources = new Map([[file, source]])

let diagnostics = (() => {
  let diagnostics = []

  let block = randomUUID()
  for (let [rowIdx, row] of source.split('\n').entries()) {
    if (row.match(/(\w*)\s*([-+/*])\s*(\2*)/g)) {
      let [_, lhs, operator, rhs] = /(\w*)\s*([-+/*])\s*(\w*)/g.exec(row)
      let offset = row.indexOf(_)

      let [lhsType, lhsDefintionLocation] = (() => {
        let lhsLineIdx = source.split('\n').findIndex((line) => line.includes(`let ${lhs} `))
        let lhsLine = source.split('\n')[lhsLineIdx]
        let [_, lhsName, lhsValue] = /let (\w*) = (['"`]?\w*['"`]?)/.exec(lhsLine)
        if (Number(lhsValue.trim()).toString() === lhsValue.trim()) {
          return ['number', location(lhsLineIdx, lhsLine.indexOf(lhsValue), lhsValue.length)]
        }

        return ['string', location(lhsLineIdx, lhsLine.indexOf(lhsValue), lhsValue.length)]
      })()

      let [rhsType, rhsDefintionLocation] = (() => {
        let rhsLineIdx = source.split('\n').findIndex((line) => line.includes(`let ${rhs} `))
        let rhsLine = source.split('\n')[rhsLineIdx]
        let [_, rhsName, rhsValue] = /let (\w*) = (['"`]?\w*['"`]?)/.exec(rhsLine)
        if (Number(rhsValue.trim()).toString() === rhsValue.trim()) {
          return ['number', location(rhsLineIdx, rhsLine.indexOf(rhsValue), rhsValue.length)]
        }

        return ['string', location(rhsLineIdx, rhsLine.indexOf(rhsValue), rhsValue.length)]
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

  return diagnostics
})()

function location(row, col, len = 1) {
  return { row: row + 1, col: col + 1, len }
}

printer(sources, diagnostics, console.log)
