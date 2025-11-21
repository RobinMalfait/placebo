import type { Diagnostic, Location } from '@robinmalfait/placebo'
import { randomUUID } from 'node:crypto'

export async function diagnose(files: string[]) {
  function diagnose(
    file: string,
    message: string,
    location: Location,
    rest: Partial<Diagnostic> = {},
  ): Diagnostic {
    return { file, message, location, ...rest }
  }

  function group(...diagnostics: Diagnostic[]) {
    let blockId = randomUUID()
    return diagnostics.map((diagnostic) => ({ ...diagnostic, blockId }))
  }

  function connect(...diagnostics: Diagnostic[]) {
    let relatedId = randomUUID()
    return diagnostics.map((diagnostic) => ({ ...diagnostic, relatedId }))
  }

  function location(row: number, col: number, len = 1): Location {
    return [row, col, row, col + len]
  }

  let diagnostics: Diagnostic[] = []
  for (let file of files) {
    diagnostics.push(
      diagnose(file, 'A beautiful new language agnostic diagnostics printer!', location(1, 9, 8)),
      ...group(
        diagnose(file, 'Messages will be rendered', location(6, 33, 8)),
        diagnose(file, 'underneath each other just', location(6, 24, 8)),
        diagnose(file, 'like the messages you see here.', location(6, 15, 8)),
      ),
      ...group(
        diagnose(file, 'You wrote `the` twice!', location(12, 28, 3)),
        diagnose(file, 'You wrote `the` twice!', location(12, 32, 3)),
      ),
      ...connect(
        ...group(
          diagnose(file, 'Yay, found my `context` friends!', location(18, 65, 9)),
          diagnose(file, 'Yay, found my `context` friends!', location(21, 1, 9)),
        ),
      ),
      diagnose(
        file,
        'Like this message. We have a lot to say here so it might not be ideal if everything was just written on the same line. Instead we will use the width of your terminal to decide when to start wrapping.',
        location(25, 37, 9),
      ),
      diagnose(file, 'This diagnostic contains some notes.', location(29, 33, 7), {
        notes: [
          '- This note can contain more information about the specific diagnostic.',
          '- What do you think? More info at https://github.com/RobinMalfait/placebo!',
        ].join('\n'),
      }),
      ...group(
        diagnose(file, 'This is an example of the superscript indicator', location(35, 8, 22), {
          notes: [
            '- This note belongs to the superscript indicator.',
            '- This note also belongs to the superscript indicator.',
            '  - And also has some nested/child notes.',
            '  - Just like these right here!',
          ].join('\n'),
        }),
        diagnose(file, 'This will also have a note', location(35, 31, 4), {
          notes: 'This note belongs to the other diagnostic',
        }),
      ),

      diagnose(file, 'We split into multiple lines', location(40, 110, 35)),
      diagnose(
        file,
        'This one is moved down because it exists way past the available space.',
        location(40, 301, 15),
      ),
    )
  }

  return diagnostics
}
