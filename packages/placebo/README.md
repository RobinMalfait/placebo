## Placebo

A beautiful new language agnostic diagnostics printer!

<!-- GENERATED -->

```

    ┌─[./README.md]
    │
∙ 1 │   What is Placebo?
    ·           ───┬────
    ·              ╰────── A beautiful new language agnostic diagnostics printer!
    │
    └─
```

```
    ┌─[./README.md]
    │
  5 │   It will also add these context lines, to get more insight about your code.
∙ 6 │   It can render multiple messages together.
    ·                 ───┬──── ───┬──── ───┬────
    ·                    │        │        ╰────── Messages will be rendered
    ·                    │        ╰─────────────── underneath each other just
    ·                    ╰──────────────────────── like the messages you see here.
    ·
  7 │   These lines will make it easier to locate your code and know what these messages
  8 │   are about from the error messages in your terminal alone!
    │
    └─
```

```
     ┌─[./README.md]
     │
∙ 12 │   Sometimes you want to show the the same message on the same line. If the same
     ·                              ─┬─ ─┬─
     ·                               ╰───┴─── You wrote `the` twice!
     ·
  13 │   message is used on the same line, then those diagnostics will be grouped
  14 │   together.
     │
     └─
```

```
     ┌─[./README.md]
     │
∙ 18 │    It is also possible to group related diagnostics together via a `context`
     ·                                                                    ────┬────
     · ╭──────────────────────────────────────────────────────────────────────╯
     · │
  19 │ │  property. This is a unique identifier per `block`. This will be useful, if you
  20 │ │  have some diagnostics that are located further away from each other. The same
∙ 21 │ │  `context` will be your friend here.
     · │  ────┬────
     · ╰──────┴────── Yay, found my `context` friends!
     │
     └─
```

```
     ┌─[./README.md]
     │
∙ 25 │   We can also write messages that are very long.
     ·                                       ────┬──── ╭─
     ·                                           ╰─────┤ Like this message. We have a lot to say here so it might not be ideal
     ·                                                 │ if everything was just written on the same line. Instead we will
     ·                                                 │ use the width of your terminal to decide when to start wrapping.
     ·                                                 ╰─
     │
     └─
```

```
     ┌─[./README.md]
     │
∙ 29 │   Last but not least, we have the `notes` feature. You can add notes to your
     ·                                   ───┬───
     ·                                      ╰───── This diagnostic contains some notes.
     ·
  30 │   diagnostics if you want to provide even more information.
     ·
     ├─
     ·   - This note can contain more information about the specific diagnostic.
     ·   - What do you think? More info at https://github.com/RobinMalfait/placebo!
     └─
```

```
     ┌─[./README.md]
     │
  34 │   Oh, and we can also add notes to different diagnostics within the same block. We can do this by
∙ 35 │   adding superscript indicators next to each message and before each note. This allows you to visually
     ·          ──────────┬─────────── ─┬──
     ·                    │             ╰──── This will also have a note
     ·                    ╰────────────────── This is an example of the superscript indicator
     ·
  36 │   see which note belongs to which diagnostic.
     ·
     ├─
     ·   This note belongs to the other diagnostic
     ├─
     ·
     ·   - This note belongs to the superscript indicator.
     ·   - This note also belongs to the superscript indicator.
     ·     - And also has some nested/child notes.
     ·     - Just like these right here!
     ·
     └─
```

```
     ┌─[./README.md]
     │
∙ 40 │   There is also a very neat feature for when the actual code itself is super long and doesn't fit on one line. In that case
     ·                                                                                                                ─────┬────── ╭─
     ·                                                                                                                     ╰───────┤ We split
     ·                                                                                                                             │ into
     ·                                                                                                                             │ multiple
     ·                                                                                                                             │ lines
     ·                                                                                                                             ╰─
     ·
     │   ↳ we also want to "wrap" the code onto multiple lines and split the diagnostics. This is done because a diagnostic could be
     ·     ──────────┬───────────
     ·               ╰───────────── We split into multiple lines
     ·
     │   ↳ for a single location, but if we split that location in multiple pieces it won't make sense to only highlight one piece of
     │   ↳ the puzzle.                                             ───────┬─────── ╭─
     ·                                                                    ╰────────┤ This one is moved down because it
     ·                                                                             │ exists way past the available space.
     ·                                                                             ╰─
     ·
  41 │   If the line is too long but doesn't contain diagnostics then we can see those as contextual lines for more info. These line will not b…
     │
     └─

```

<details>

<summary>The actual diagnostics input for this readme can be found here.</summary>

```json
[
  {
    "file": "README.md",
    "message": "A beautiful new language agnostic diagnostics printer!",
    "location": {
      "start": {
        "line": 1,
        "column": 9,
        "offset": 8
      },
      "end": {
        "line": 1,
        "column": 16,
        "offset": 16
      }
    }
  },
  {
    "file": "README.md",
    "message": "Messages will be rendered",
    "location": {
      "start": {
        "line": 6,
        "column": 33,
        "offset": 127
      },
      "end": {
        "line": 6,
        "column": 40,
        "offset": 135
      }
    },
    "blockId": "6c15329a-19d6-40ba-a6f4-714339710780"
  },
  {
    "file": "README.md",
    "message": "underneath each other just",
    "location": {
      "start": {
        "line": 6,
        "column": 24,
        "offset": 118
      },
      "end": {
        "line": 6,
        "column": 31,
        "offset": 126
      }
    },
    "blockId": "6c15329a-19d6-40ba-a6f4-714339710780"
  },
  {
    "file": "README.md",
    "message": "like the messages you see here.",
    "location": {
      "start": {
        "line": 6,
        "column": 15,
        "offset": 109
      },
      "end": {
        "line": 6,
        "column": 22,
        "offset": 117
      }
    },
    "blockId": "6c15329a-19d6-40ba-a6f4-714339710780"
  },
  {
    "file": "README.md",
    "message": "You wrote `the` twice!",
    "location": {
      "start": {
        "line": 12,
        "column": 28,
        "offset": 306
      },
      "end": {
        "line": 12,
        "column": 30,
        "offset": 309
      }
    },
    "blockId": "a224042d-4f8d-4698-b007-cfdabf0452f7"
  },
  {
    "file": "README.md",
    "message": "You wrote `the` twice!",
    "location": {
      "start": {
        "line": 12,
        "column": 32,
        "offset": 310
      },
      "end": {
        "line": 12,
        "column": 34,
        "offset": 313
      }
    },
    "blockId": "a224042d-4f8d-4698-b007-cfdabf0452f7"
  },
  {
    "file": "README.md",
    "message": "Yay, found my `context` friends!",
    "location": {
      "start": {
        "line": 18,
        "column": 65,
        "offset": 507
      },
      "end": {
        "line": 18,
        "column": 73,
        "offset": 516
      }
    },
    "blockId": "0668975a-2a21-474a-a524-386a1924654b",
    "relatedId": "0906f34d-c12b-422a-a9d3-cbc895e2b0b0"
  },
  {
    "file": "README.md",
    "message": "Yay, found my `context` friends!",
    "location": {
      "start": {
        "line": 21,
        "column": 1,
        "offset": 674
      },
      "end": {
        "line": 21,
        "column": 9,
        "offset": 683
      }
    },
    "blockId": "0668975a-2a21-474a-a524-386a1924654b",
    "relatedId": "0906f34d-c12b-422a-a9d3-cbc895e2b0b0"
  },
  {
    "file": "README.md",
    "message": "Like this message. We have a lot to say here so it might not be ideal if everything was just written on the same line. Instead we will use the width of your terminal to decide when to start wrapping.",
    "location": {
      "start": {
        "line": 25,
        "column": 37,
        "offset": 749
      },
      "end": {
        "line": 25,
        "column": 45,
        "offset": 758
      }
    }
  },
  {
    "file": "README.md",
    "message": "This diagnostic contains some notes.",
    "location": {
      "start": {
        "line": 29,
        "column": 33,
        "offset": 795
      },
      "end": {
        "line": 29,
        "column": 39,
        "offset": 802
      }
    },
    "notes": "- This note can contain more information about the specific diagnostic.\n- What do you think? More info at https://github.com/RobinMalfait/placebo!"
  },
  {
    "file": "README.md",
    "message": "This is an example of the superscript indicator",
    "location": {
      "start": {
        "line": 35,
        "column": 8,
        "offset": 1002
      },
      "end": {
        "line": 35,
        "column": 29,
        "offset": 1024
      }
    },
    "notes": "- This note belongs to the superscript indicator.\n- This note also belongs to the superscript indicator.\n  - And also has some nested/child notes.\n  - Just like these right here!",
    "blockId": "e57f0050-ad53-4794-a4c6-23527d1b4a28"
  },
  {
    "file": "README.md",
    "message": "This will also have a note",
    "location": {
      "start": {
        "line": 35,
        "column": 31,
        "offset": 1025
      },
      "end": {
        "line": 35,
        "column": 34,
        "offset": 1029
      }
    },
    "notes": "This note belongs to the other diagnostic",
    "blockId": "e57f0050-ad53-4794-a4c6-23527d1b4a28"
  },
  {
    "file": "README.md",
    "message": "We split into multiple lines",
    "location": {
      "start": {
        "line": 40,
        "column": 110,
        "offset": 1252
      },
      "end": {
        "line": 40,
        "column": 144,
        "offset": 1287
      }
    }
  },
  {
    "file": "README.md",
    "message": "This one is moved down because it exists way past the available space.",
    "location": {
      "start": {
        "line": 40,
        "column": 301,
        "offset": 1443
      },
      "end": {
        "line": 40,
        "column": 315,
        "offset": 1458
      }
    }
  }
]
```

</details>

<!-- /GENERATED -->

<img src="./images/example-screenshot.png" />

---

## Getting started

Install the library:

```sh
npm install @robinmalfait/placebo
```

Usage:

```ts
import fs from 'node:fs'
import { print, type Diagnostic, type Location } from '@robinmalfait/placebo'

// Any `Iterable<Diagnostic>` will work here
let diagnostics: Diagnostic[] = [
  {
    /**
     * The file path of the source code related to this diagnostic
     */
    file: 'example.ts',

    /**
     * Optional: The actual source code related to the diagnostic.
     *
     * If this is not known at the time of creating the diagnostic (or you don't
     * want to perform IO operations at that time), you can provide a function
     * to retrieve the source code later when printing the diagnostics.
     */
    source: '',

    /**
     * The diagnostic message to display.
     */
    message: 'This is an example diagnostic message',

    /**
     * The location of the diagnostic in the source code.
     */
    location: [
      [3, 5], // start: [line, column]
      [3, 15], // end: [line, column
    ] satisfies Location,

    /**
     * Optional: additional information about the diagnostic. Will be rendered in
     * a separate notes section.
     */
    notes: 'Some additional information about this diagnostic.',

    /**
     * Optional: Every diagnostic with the same block id will be rendered in the
     * same diagnostic block.
     */
    blockId: string,

    /**
     * Optional: Every diagnostic with the same related id will be visually connected if possible.
     */
    relatedId: string,
  },

  // More diagnostics...
]

print(diagnostics, {
  write: console.error, // Defaults to `console.error`
  source: (file) => fs.readFileSync(file, 'utf-8'), // Only necessary if the `diagnostic` doesn't contain the source code already

  /**
   * Optional rendering options that influence how diagnostics are rendered.
   */
  rendering: {
    /**
     * The amount of lines of the source code to show before a diagnostic line.
     *
     * Defaults to:       `3`
     * Overrideable via:  `process.env.PLACEBO_CONTEXT_LINES_BEFORE`
     */
    beforeContextLines: 3,

    /**
     * The amount of lines of the source code to show after a diagnostic line.
     *
     * Defaults to:       `3`
     * Overrideable via:  `process.env.PLACEBO_CONTEXT_LINES_AFTER`
     */
    afterContextLines: 3,

    /**
     * Available print width for rendering the diagnostics.
     *
     * Defaults to:       `process.stdout.columns ?? 80`
     * Overrideable via:  `process.env.PLACEBO_PRINT_WIDTH`
     */
    printWidth: process.stdout.columns ?? 80,
  },
})
```

### Examples

1. `git clone https://github.com/RobinMalfait/placebo && cd placebo`
2. `pnpm install`
3. `pnpm run build`
4. See below...

| Project                                        | Script                      |
| ---------------------------------------------- | --------------------------- |
| [CSS](./examples/css/README.txt)               | `bun ./examples/css`        |
| [ESLint](./examples/eslint/README.txt)         | `bun ./examples/eslint`     |
| [JavaScript](./examples/javascript/README.txt) | `bun ./examples/javascript` |
| [README](./examples/readme/README.txt)         | `bun ./examples/readme`     |
| [Tailwind CSS](./examples/tailwind/README.txt) | `bun ./examples/tailwind`   |
