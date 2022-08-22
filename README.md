## Placebo

A beautiful new language agnostic diagnostics printer!

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
  7 │   These lines will make it easier to locate your code and know what these mesages
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
     ·                                           ╰─────┤ Like this message. We have a lot to
     ·                                                 │ say here so it might not be ideal if
     ·                                                 │ everything was just written on the same
     ·                                                 │ line. Instead we will use the width of your
     ·                                                 │ terminal to decide when to start wrapping.
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
     ·   NOTES:
     ·     - This note can contain more information about the specific diagnostic.
     ·     - What do you think? More info at https://github.com/RobinMalfait/placebo!
     └─
```

```
     ┌─[./README.md]
     │
  34 │   Oh, and we can also add notes to different diagnostics within the same block. We can do this by
∙ 35 │   adding superscript indicators next to each message and before each note. This allows you to visually
     ·          ──────────┬─────────── ─┬──
     ·                    │             ╰──── This will also have a note⁽¹⁾
     ·                    ╰────────────────── This is an example of the superscript indicator⁽²⁾
     ·
  36 │   see which note belongs to which diagnostic.
     ·
     ├─
     ·   NOTES:
     ·     1. This note belongs to the other diagnostic
     ·     2. This note belongs to the superscript indicator.
     ·     2. This note also belongs to the superscript indicator.
     └─
```

<details>

<summary>The actual diagnostics input for this readme can be found here.</summary>

```json
[
  {
    "file": "README.md",
    "message": "A beautiful new language agnostic diagnostics printer!",
    "loc": {
      "row": 1,
      "col": 9,
      "len": 8
    }
  },
  {
    "file": "README.md",
    "message": "Messages will be rendered",
    "loc": {
      "row": 6,
      "col": 33,
      "len": 8
    },
    "block": "70304f08-0d29-4634-a659-06ae8bfb7d8e"
  },
  {
    "file": "README.md",
    "message": "underneath eachother just",
    "loc": {
      "row": 6,
      "col": 24,
      "len": 8
    },
    "block": "70304f08-0d29-4634-a659-06ae8bfb7d8e"
  },
  {
    "file": "README.md",
    "message": "like the messages you see here.",
    "loc": {
      "row": 6,
      "col": 15,
      "len": 8
    },
    "block": "70304f08-0d29-4634-a659-06ae8bfb7d8e"
  },
  {
    "file": "README.md",
    "message": "You wrote `the` twice!",
    "loc": {
      "row": 12,
      "col": 28,
      "len": 3
    },
    "block": "288a9911-a541-40fc-8d91-0769d61bfc7d"
  },
  {
    "file": "README.md",
    "message": "You wrote `the` twice!",
    "loc": {
      "row": 12,
      "col": 32,
      "len": 3
    },
    "block": "288a9911-a541-40fc-8d91-0769d61bfc7d"
  },
  {
    "file": "README.md",
    "message": "Yay, found my `context` friends!",
    "loc": {
      "row": 18,
      "col": 65,
      "len": 9
    },
    "block": "7e5172ec-5602-46f3-b1d8-43f88a58e008",
    "context": "eb2a53ff-5cfe-4199-86ee-e5da4e997597"
  },
  {
    "file": "README.md",
    "message": "Yay, found my `context` friends!",
    "loc": {
      "row": 21,
      "col": 1,
      "len": 9
    },
    "block": "7e5172ec-5602-46f3-b1d8-43f88a58e008",
    "context": "eb2a53ff-5cfe-4199-86ee-e5da4e997597"
  },
  {
    "file": "README.md",
    "message": "Like this message. We have a lot to say here so it might not be ideal if everything was just written on the same line. Instead we will use the width of your terminal to decide when to start wrapping.",
    "loc": {
      "row": 25,
      "col": 37,
      "len": 9
    }
  },
  {
    "file": "README.md",
    "message": "This diagnostic contains some notes.",
    "loc": {
      "row": 29,
      "col": 33,
      "len": 7
    },
    "notes": [
      "This note can contain more information about the specific diagnostic.",
      "What do you think? More info at https://github.com/RobinMalfait/placebo!"
    ]
  },
  {
    "file": "README.md",
    "message": "This is an example of the superscript indicator",
    "loc": {
      "row": 35,
      "col": 8,
      "len": 22
    },
    "block": "8c9faddb-49f4-4a72-8df5-9316b14ff542",
    "notes": [
      "This note belongs to the superscript indicator.",
      "This note also belongs to the superscript indicator."
    ]
  },
  {
    "file": "README.md",
    "message": "This will also have a note",
    "loc": {
      "row": 35,
      "col": 31,
      "len": 4
    },
    "block": "8c9faddb-49f4-4a72-8df5-9316b14ff542",
    "notes": ["This note belongs to the other diagnostic"]
  }
]
```

</details>

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
