import type { Diagnostic, Location } from '@robinmalfait/placebo'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'

export async function diagnose(files: string[]) {
  let diagnostics: Diagnostic[] = []

  for (let file of files) {
    let source = await fs.readFile(file, 'utf8')
    let blockId = randomUUID()
    for (let [rowIdx, row] of source.split('\n').entries()) {
      if (row.match(/=\s*(\w*)\s*([-+/*])\s*(\2*)/g)) {
        let match = /(\w*)\s*([-+/*])\s*(\w*)/g.exec(row)
        if (!match) continue
        let [_, lhs, operator, rhs] = match
        let offset = row.indexOf(_)

        let [lhsType, lhsDefinitionLocation] = (() => {
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

          throw new Error(`Could not find definition for ${lhs}`)
        })()

        let [rhsType, rhsDefinitionLocation] = (() => {
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

          throw new Error(`Could not find definition for ${rhs}`)
        })()

        let messagesByOperator = {
          '-': () => `You cannot subtract a '${rhsType}' from a '${lhsType}'`,
          '+': () => `You cannot add a '${lhsType}' and a '${rhsType}'`,
          '/': () => `You cannot divide a '${lhsType}' by a '${rhsType}'`,
          '*': () => `You cannot multiply a '${lhsType}' and a '${rhsType}'`,
        }

        if (lhsType !== 'number' || rhsType !== 'number') {
          diagnostics.push({
            blockId,
            file,
            message: `This is of type '${lhsType}'`,
            location: location(rowIdx, offset + _.indexOf(lhs), lhs.length),
          })
          diagnostics.push({
            blockId,
            file,
            message: messagesByOperator[operator as unknown as keyof typeof messagesByOperator]!(),
            location: location(rowIdx, offset + _.indexOf(operator), operator.length),
          })
          diagnostics.push({
            blockId,
            file,
            message: `This is of type '${rhsType}'`,
            location: location(rowIdx, offset + _.indexOf(rhs), rhs.length),
          })

          if (lhsType !== 'number') {
            diagnostics.push({
              blockId,
              file,
              message: `Consider changing this to a 'number'`,
              location: lhsDefinitionLocation,
            })
          }
          if (rhsType !== 'number') {
            diagnostics.push({
              blockId,
              file,
              message: `Consider changing this to a 'number'`,
              location: rhsDefinitionLocation,
            })
          }
        }
      }
    }
  }

  return diagnostics
}

function location(row: number, col: number, len = 1): Location {
  return [
    [row + 1, col + 1],
    [row + 1, col + 1 + len],
  ]
}
