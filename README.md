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
    ·                    │        ╰─────────────── underneath eachother just
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
  20 │ │  have some diagnostics that are located further away from eachother. The same
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
     ·   - What do you think? More info at ]8;;https://github.com/RobinMalfait/placebohttps://github.com/RobinMalfait/placebo]8;;!
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

<details>

<summary>The actual diagnostics input for this readme can be found here.</summary>

```json
[
  {
    "file": "README.md",
    "message": "A beautiful new language agnostic diagnostics printer!",
    "location": [
      [1, 9],
      [1, 17]
    ]
  },
  {
    "file": "README.md",
    "message": "Messages will be rendered",
    "location": [
      [6, 33],
      [6, 41]
    ],
    "block": "a83dc879-909c-4993-b7e7-5f4831e976d1"
  },
  {
    "file": "README.md",
    "message": "underneath eachother just",
    "location": [
      [6, 24],
      [6, 32]
    ],
    "block": "a83dc879-909c-4993-b7e7-5f4831e976d1"
  },
  {
    "file": "README.md",
    "message": "like the messages you see here.",
    "location": [
      [6, 15],
      [6, 23]
    ],
    "block": "a83dc879-909c-4993-b7e7-5f4831e976d1"
  },
  {
    "file": "README.md",
    "message": "You wrote `the` twice!",
    "location": [
      [12, 28],
      [12, 31]
    ],
    "block": "fbc2b531-7db7-40c8-ad63-da2bf5b044e2"
  },
  {
    "file": "README.md",
    "message": "You wrote `the` twice!",
    "location": [
      [12, 32],
      [12, 35]
    ],
    "block": "fbc2b531-7db7-40c8-ad63-da2bf5b044e2"
  },
  {
    "file": "README.md",
    "message": "Yay, found my `context` friends!",
    "location": [
      [18, 65],
      [18, 74]
    ],
    "block": "b048e09a-7f89-43a6-8fa9-f87b96bf9f7b",
    "context": "f3c7da1c-b142-4400-be88-bb27c9c16986"
  },
  {
    "file": "README.md",
    "message": "Yay, found my `context` friends!",
    "location": [
      [21, 1],
      [21, 10]
    ],
    "block": "b048e09a-7f89-43a6-8fa9-f87b96bf9f7b",
    "context": "f3c7da1c-b142-4400-be88-bb27c9c16986"
  },
  {
    "file": "README.md",
    "message": "Like this message. We have a lot to say here so it might not be ideal if everything was just written on the same line. Instead we will use the width of your terminal to decide when to start wrapping.",
    "location": [
      [25, 37],
      [25, 46]
    ]
  },
  {
    "file": "README.md",
    "message": "This diagnostic contains some notes.",
    "location": [
      [29, 33],
      [29, 40]
    ],
    "notes": "\n          - This note can contain more information about the specific diagnostic.\n          - What do you think? More info at https://github.com/RobinMalfait/placebo!\n        "
  },
  {
    "file": "README.md",
    "message": "This is an example of the superscript indicator",
    "location": [
      [35, 8],
      [35, 30]
    ],
    "block": "bc68d091-21ac-41b3-b12c-91bae7a674ff",
    "notes": "\n            - This note belongs to the superscript indicator.\n            - This note also belongs to the superscript indicator.\n              - And also has some nested/child notes.\n              - Just like these right here!\n          "
  },
  {
    "file": "README.md",
    "message": "This will also have a note",
    "location": [
      [35, 31],
      [35, 35]
    ],
    "block": "bc68d091-21ac-41b3-b12c-91bae7a674ff",
    "notes": "This note belongs to the other diagnostic"
  }
]
```

</details>

<!-- /GENERATED -->

<img src="./images/example-screenshot.png" />

---

**Note**, this is still in active development. Currently there is no real API
to use it yet, the diagnostics format can still change, and we may or may not
want to introduce configuration options.

### Examples

1. `git clone https://github.com/RobinMalfait/placebo && cd placebo`
2. `npm install`
3. `npm run build`
4. See below...

| Project                                        | Script                       |
| ---------------------------------------------- | ---------------------------- |
| [CSS](./examples/css/README.txt)               | `node ./examples/css`        |
| [ESLint](./examples/eslint/README.txt)         | `node ./examples/eslint`     |
| [JavaScript](./examples/javascript/README.txt) | `node ./examples/javascript` |
| [README](./examples/readme/README.txt)         | `node ./examples/readme`     |
| [Tailwind CSS](./examples/tailwind/README.txt) | `node ./examples/tailwind`   |
