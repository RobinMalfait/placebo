let fs = require('fs/promises')
let { randomUUID } = require('crypto')

let postcss = require('postcss')

let list = new Intl.ListFormat(undefined, { style: 'long', type: 'conjunction' })
let alphabetically = new Intl.Collator().compare

let issues = [
  [
    ['display', 'inline'],
    ['width', 'height', 'margin', 'margin-top', 'margin-bottom', 'float'],
    (main, issues) => `${issues} can't be used with "${main}"`,
  ],
  [
    ['display', 'block'],
    ['vertical-align'],
    (main, issues) => `${issues} can't be used with "${main}"`,
  ],
  [
    ['display', 'inline-block'],
    ['float'],
    (main, issues) => `${issues} can't be used with "${main}"`,
  ],
  [
    ['display', /table-/],
    ['margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'float'],
    (main, issues) => `${issues} can't be used with "${main}"`,
  ],
]

module.exports = async function run(files) {
  files = [].concat(files)
  let diagnostics = []

  for (let file of files) {
    await postcss([
      (root) => {
        root.walkRules((rule) => {
          let block = randomUUID()

          rule.walkDecls((decl) => {
            let context = randomUUID()

            for (let [[property, value], conflictingProperties, message] of issues) {
              if (property instanceof RegExp) {
                if (!property.test(decl.prop)) continue
              } else if (decl.prop !== property) continue

              if (value instanceof RegExp) {
                if (!value.test(decl.value)) continue
              } else if (value && decl.value !== value) continue

              let issues = new Set()

              diagnostics.push({
                file,
                block,
                context,
                loc: location(
                  decl.source.start.line,
                  decl.source.start.column,
                  value === undefined
                    ? decl.prop.length
                    : decl.source.end.column - decl.source.start.column + 1
                ),
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
                    block,
                    context,
                    get message() {
                      return message(
                        main,
                        list.format(
                          Array.from(issues)
                            .sort(alphabetically)
                            .map((v) => `"${v}"`)
                        )
                      )
                    },
                    loc: location(
                      otherDecl.source.start.line,
                      otherDecl.source.start.column,
                      value === undefined
                        ? otherDecl.prop.length
                        : otherDecl.source.end.column - otherDecl.source.start.column + 1
                    ),
                  })
                }
              })
            }
          })
        })

        // Declaration with value 0px, 0rem, ... should just be `0`
        root.walkDecls((decl) => {
          if (decl.value === '0') return
          if (parseInt(decl.value, 10) !== 0) return

          diagnostics.push({
            file,
            message: "Values of 0 shouldn't have units specified.",
            loc: location(
              decl.source.start.line,
              decl.source.end.column - decl.value.length,
              decl.value.length
            ),
          })
        })
      },
    ])
      .process(await fs.readFile(file, 'utf8'), { from: file })
      // .process(source, { from: file })
      .catch((err) => {
        diagnostics.push({
          file,
          message: err.reason,
          loc: location(err.line, err.column),
        })
      })
  }

  return diagnostics
}

function location(row, col, len = 1) {
  return { row: row, col: col, len }
}
