let { randomUUID } = require('crypto')

module.exports = function run(source, { file }) {
  function group(...diagnostics) {
    let id = randomUUID()
    return diagnostics.map((diagnostic) => ({ ...diagnostic, block: id }))
  }
  function groupContext(...diagnostics) {
    let id = randomUUID()
    return diagnostics.map((diagnostic) => ({ ...diagnostic, context: id }))
  }
  function diagnose(message, location, { block, context, notes } = {}) {
    return { file, message, loc: location, block, context, notes }
  }

  function location(row, col, len = 1) {
    return { row: row, col: col, len }
  }

  return [
    diagnose('A beautiful new language agnostic diagnostics printer!', location(1, 9, 8)),
    ...group(
      diagnose('Messages will be rendered', location(6, 33, 8)),
      diagnose('underneath eachother just', location(6, 24, 8)),
      diagnose('like the messages you see here.', location(6, 15, 8))
    ),
    ...group(
      diagnose('You wrote `the` twice!', location(12, 28, 3)),
      diagnose('You wrote `the` twice!', location(12, 32, 3))
    ),
    ...groupContext(
      ...group(
        diagnose('Yay, found my `context` friends!', location(18, 65, 9)),
        diagnose('Yay, found my `context` friends!', location(21, 1, 9))
      )
    ),
    diagnose('This diagnostic contains some notes.', location(25, 33, 8), {
      notes: [
        'This note can contain more information about the specific diagnostic.',
        'What do you think? More info at https://github.com/RobinMalfait/placebo!',
      ],
    }),
  ]
}