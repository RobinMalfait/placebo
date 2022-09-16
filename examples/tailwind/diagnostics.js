let fs = require('fs/promises')
let { randomUUID } = require('crypto')

let { parser: parse } = require('posthtml-parser')

let classCollisions = [
  [
    [
      'block',
      'inline-block',
      'inline',
      'flex',
      'inline-flex',
      'table',
      'inline-table',
      'table-caption',
      'table-cell',
      'table-column',
      'table-column-group',
      'table-footer-group',
      'table-header-group',
      'table-row-group',
      'table-row',
      'flow-root',
      'grid',
      'inline-grid',
      'contents',
      'list-item',
      'hidden',
    ],
    'display',
  ],
  [['sr-only', 'not-sr-only']],
  [['pointer-events-none', 'pointer-events-auto'], 'pointer-events'],
  [['visible', 'invisible'], 'visibility'],
  [['static', 'fixed', 'absolute', 'relative', 'sticky'], 'position'],
  [['isolate', 'isolation-auto'], 'isolation'],
  [['float-right', 'float-left', 'float-none'], 'float'],
  [['clear-left', 'clear-right', 'clear-both', 'clear-none'], 'clear'],
  [['box-border', 'box-content'], 'box-sizing'],
  [['table-auto', 'table-fixed'], 'table-layout'],
  [['border-collapse', 'border-separate'], 'border-collapse'],
  [['transform', 'transform-cpu', 'transform-gpu'], 'transform'],
  [['select-none', 'select-text', 'select-all', 'select-auto'], 'user-select'],
  [['resize-none', 'resize-y', 'resize-x', 'resize'], 'resize'],
  [['list-inside', 'list-outside'], 'list-style-position'],
  [
    ['grid-flow-row', 'grid-flow-col', 'grid-flow-row-dense', 'grid-flow-col-dense'],
    'grid-auto-flow',
  ],
  [['flex-row', 'flex-row-reverse', 'flex-col', 'flex-col-reverse'], 'flex-direction'],
  [['flex-wrap', 'flex-wrap-reverse', 'flex-nowrap'], 'flex-direction'],
  [
    [
      'place-content-center',
      'place-content-start',
      'place-content-end',
      'place-content-between',
      'place-content-around',
      'place-content-evenly',
      'place-content-stretch',
    ],
    'place-content',
  ],
  [
    ['place-items-start', 'place-items-end', 'place-items-center', 'place-items-stretch'],
    'place-items',
  ],
  [
    [
      'content-center',
      'content-start',
      'content-end',
      'content-between',
      'content-around',
      'content-evenly',
    ],
    'align-content',
  ],
  [['items-start', 'items-end', 'items-center', 'items-baseline', 'items-stretch'], 'align-items'],
  [
    [
      'justify-start',
      'justify-end',
      'justify-center',
      'justify-between',
      'justify-around',
      'justify-evenly',
    ],
    'justify-content',
  ],
  [
    ['justify-items-start', 'justify-items-end', 'justify-items-center', 'justify-items-stretch'],
    'justify-items',
  ],
  [
    ['divide-solid', 'divide-dashed', 'divide-dotted', 'divide-double', 'divide-none'],
    'border-style',
  ],
  [
    [
      'place-self-auto',
      'place-self-start',
      'place-self-end',
      'place-self-center',
      'place-self-stretch',
    ],
    'place-self',
  ],
  [
    ['self-auto', 'self-start', 'self-end', 'self-center', 'self-stretch', 'self-baseline'],
    'align-self',
  ],
  [
    [
      'justify-self-auto',
      'justify-self-start',
      'justify-self-end',
      'justify-self-center',
      'justify-self-stretch',
    ],
    'justify-self',
  ],
  [
    ['overflow-auto', 'overflow-hidden', 'overflow-visible', 'overflow-scroll', 'truncate'],
    'overflow',
  ],
  [
    ['overflow-x-auto', 'overflow-x-hidden', 'overflow-x-visible', 'overflow-x-scroll'],
    'overflow-x',
  ],
  [
    ['overflow-y-auto', 'overflow-y-hidden', 'overflow-y-visible', 'overflow-y-scroll'],
    'overflow-y',
  ],
  [['overscroll-auto', 'overscroll-contain', 'overscroll-none'], 'overscroll-behaviour'],
  [['overscroll-x-auto', 'overscroll-x-contain', 'overscroll-x-none'], 'overscroll-behaviour-x'],
  [['overscroll-y-auto', 'overscroll-y-contain', 'overscroll-y-none'], 'overscroll-behaviour-y'],
  [['truncate', 'overflow-ellipsis', 'overflow-clip'], 'text-overflow'],
  [
    [
      'whitespace-normal',
      'whitespace-nowrap',
      'whitespace-pre',
      'whitespace-pre-line',
      'whitespace-pre-wrap',
    ],
    'white-space',
  ],
  [['break-normal', 'break-words'], 'overflow-wrap'],
  [['break-normal', 'break-all'], 'word-break'],
  [
    ['border-solid', 'border-dashed', 'border-dotted', 'border-double', 'border-none'],
    'border-style',
  ],
  [['decoration-slice', 'decoration-clone'], 'box-decoration-break'],
  [['bg-fixed', 'bg-local', 'bg-scroll'], 'background-attachment'],
  [['bg-clip-border', 'bg-clip-padding', 'bg-clip-content', 'bg-clip-text'], 'background-clip'],
  [
    [
      'bg-repeat',
      'bg-no-repeat',
      'bg-repeat-x',
      'bg-repeat-y',
      'bg-repeat-round',
      'bg-repeat-space',
    ],
    'background-repeat',
  ],
  [['bg-origin-border', 'bg-origin-padding', 'bg-origin-content'], 'background-origin'],
  [
    ['object-contain', 'object-cover', 'object-fill', 'object-none', 'object-scale-down'],
    'object-fit',
  ],
  [['text-left', 'text-center', 'text-right', 'text-justify'], 'text-align'],
  [
    [
      'align-baseline',
      'align-top',
      'align-middle',
      'align-bottom',
      'align-text-top',
      'align-text-bottom',
    ],
    'vertical-align',
  ],
  [['uppercase', 'lowercase', 'capitalize', 'normal-case'], 'text-transform'],
  [['italic', 'no-italic'], 'font-style'],
  [['underline', 'line-through', 'no-underline'], 'text-decoration'],
  [['antialiased', 'subpixel-antialiased'], 'font-smoothing'],
]

module.exports = async function run(files) {
  files = [].concat(files)

  let diagnostics = []

  for (let file of files) {
    function diagnose(message, location, { block, context, notes } = {}) {
      return { file, message, loc: location, block, context, notes }
    }

    let source = await fs.readFile(file, 'utf8')

    let tree = parse(source, { sourceLocations: true })
    let lines = source.split('\n')

    walk(tree, (node) => {
      let line = lines[node.location.start.line - 1]

      // Check class collisions
      for (let classList of extractClassNames(node.attrs?.class ?? '')) {
        let seen = new Set()

        for (let [idx, fullClass] of classList.entries()) {
          if (seen.has(fullClass)) continue
          let [variants, klass] = splitClass(fullClass)

          for (let [collisions, property] of classCollisions) {
            let block = randomUUID()
            if (!collisions.includes(klass)) continue

            let scopedDiagnostics = []

            for (let other of collisions) {
              let fullOther = [variants, other].filter(Boolean).join(':')
              if (!classList.slice(idx).includes(fullOther)) continue

              seen.add(fullOther)

              scopedDiagnostics.push(
                diagnose(
                  property
                    ? `Colliding classes, they operate on the same "${property}" property.`
                    : 'Colliding classes.',
                  location(node.location.start.line, line.indexOf(fullOther) + 1, fullOther.length),
                  { block }
                )
              )
            }

            if (scopedDiagnostics.length > 1) diagnostics.push(...scopedDiagnostics)
          }
        }
      }

      // Check for duplicate classes
      for (let list of extractClassNames(node.attrs?.class ?? '')) {
        if (list.length === new Set(list).size) continue

        for (let klass of new Set(list)) {
          let klasses = list.filter((k) => k === klass)
          if (klasses.length <= 1) continue

          let scopedDiagnostics = []
          let block = randomUUID()

          let isFirst = true

          let lastStartIdex = -1
          for (let _ of klasses) {
            let idx = line.indexOf(klass, lastStartIdex + 1)
            lastStartIdex = idx
            scopedDiagnostics.push(
              diagnose(
                `Duplicate class "${klass}"`,
                location(node.location.start.line, idx + 1, klass.length),
                {
                  block,
                  notes: isFirst
                    ? [
                        'You can solve this by removing one of the duplicate classes:',
                        [
                          [
                            '```diff-html',
                            '- ' + line.trim(),
                            '+ ' + line.replace(` ${klass}`, '').trim(),
                            '```',
                          ].join('\n'),
                        ],
                      ]
                    : [],
                }
              )
            )
            isFirst = false
          }

          if (scopedDiagnostics.length > 0) diagnostics.push(...scopedDiagnostics.splice(0))
        }
      }
    })
  }

  return diagnostics
}

function location(row, col, len = 1) {
  return { row: row, col: col, len }
}

function walk(node, cb) {
  if (Array.isArray(node)) {
    for (let n of node) {
      walk(n, cb)
    }
  } else if (node) {
    if (typeof node === 'object' && node !== null) cb(node)
  }

  if (node.content) {
    for (let child of node.content) {
      walk(child, cb)
    }
  }
}

function splitClass(klass) {
  let idx = klass.lastIndexOf(':')
  if (idx === -1) return ['', klass]
  let variants = klass.slice(0, idx)
  let rest = klass.slice(idx + 1)
  return [variants, rest]
}

function* extractClassNames(input) {
  let sections = input.split(/({{.*?}})/g)
  let subgroups = []
  let shared = []
  for (let section of sections) {
    if (section.startsWith('{{') && section.endsWith('}}')) {
      for (let [_, group] of section.matchAll(/'(.*?)'/g)) {
        let g = []
        for (let k of group.split(' ')) if (k) g.push(k)

        subgroups.push(g)
      }
    } else {
      for (let k of section.split(' ')) {
        if (k) shared.push(k)
      }
    }
  }

  if (subgroups.length > 0) {
    for (let group of subgroups) yield [...group, ...shared]
  } else {
    yield shared
  }
}
