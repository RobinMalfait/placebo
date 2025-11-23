import { type Diagnostic } from '@robinmalfait/placebo'
import { randomUUID } from 'node:crypto'
import * as fs from 'node:fs/promises'
import postcss, { Root } from 'postcss'

const list = new Intl.ListFormat(undefined, {
  style: 'long',
  type: 'conjunction',
})
const alphabetically = new Intl.Collator().compare

const issues: [
  properties: [property: string | RegExp, value: string | RegExp | undefined],
  conflicitingProperties: string[],
  message: (main: string, issues: string) => string,
][] = [
  [
    ['display', 'inline'],
    ['width', 'height', 'margin', 'margin-top', 'margin-bottom', 'float'],
    (main: string, issues: string) => `${issues} can't be used with "${main}"`,
  ],
  [
    ['display', 'block'],
    ['vertical-align'],
    (main: string, issues: string) => `${issues} can't be used with "${main}"`,
  ],
  [
    ['display', 'inline-block'],
    ['float'],
    (main: string, issues: string) => `${issues} can't be used with "${main}"`,
  ],
  [
    ['display', /table-/],
    ['margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'float'],
    (main: string, issues: string) => `${issues} can't be used with "${main}"`,
  ],
]

export async function diagnose(files: string[]) {
  let diagnostics: Diagnostic[] = []

  for (let file of files) {
    await postcss([
      (root: Root) => {
        root.walkRules((rule) => {
          let blockId = randomUUID()

          rule.walkDecls((decl) => {
            let relatedId = randomUUID()

            for (let [[property, value], conflictingProperties, message] of issues) {
              if (property instanceof RegExp) {
                if (!property.test(decl.prop)) continue
              } else if (decl.prop !== property) continue

              if (value instanceof RegExp) {
                if (!value.test(decl.value)) continue
              } else if (value && decl.value !== value) continue

              let issues = new Set<string>()

              diagnostics.push({
                file,
                blockId,
                relatedId,
                location: {
                  start: { offset: decl.source!.start!.offset! },
                  end: { offset: decl.source!.start!.offset! + decl.prop.length },
                },
                message: '…',
              })

              let main = value === undefined ? decl.prop : `${decl.prop}: ${decl.value};`

              rule.walkDecls((otherDecl) => {
                for (let conflict of conflictingProperties) {
                  let [property, value] = Array.isArray(conflict) ? conflict : [conflict]
                  if (otherDecl.prop !== property) continue
                  if (value && otherDecl.value !== value) continue

                  let issue =
                    value === undefined ? otherDecl.prop : `${otherDecl.prop}: ${otherDecl.value};`

                  issues.add(issue)

                  diagnostics.push({
                    file,
                    blockId,
                    relatedId,
                    get message() {
                      return message(
                        main,
                        list.format(
                          Array.from(issues)
                            .sort(alphabetically)
                            .map((v) => `"${v}"`),
                        ),
                      )
                    },
                    location: {
                      start: { offset: otherDecl.source!.start!.offset! },
                      end: { offset: otherDecl.source!.start!.offset! + otherDecl.prop.length },
                    },
                  })
                }
              })
            }
          })
        })

        // Declaration with value 0px, 0rem, ... should just be `0`
        root.walkDecls((decl) => {
          if (decl.value === '0') return
          if (Number.parseInt(decl.value, 10) !== 0) return

          diagnostics.push({
            file,
            message: "Values of 0 shouldn't have units specified.",
            location: {
              start: {
                offset: decl.source!.start!.offset + decl.prop.length + decl.raws.between!.length,
              },
              end: { offset: decl.source!.end!.offset },
            },
          })
        })
      },
    ])
      .process(await fs.readFile(file, 'utf8'), { from: file })
      .catch((err) => {
        diagnostics.push({
          file,
          message: err.reason,
          location: {
            start: { line: err.line, column: err.column },
            end: { line: err.line, column: err.column },
          },
        })
      })
  }

  return diagnostics
}
