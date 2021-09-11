## Placebo

A beautiful new language agnostic diagnostics printer!

```
    ┌─[./README.md]
    │
> 1 │   What is Placebo?
    ·           ───┬────
    ·              ╰────── A beautiful new language agnostic diagnostics printer!
    │
    └─
```

```
    ┌─[./README.md]
    │
  5 │   It will also add these context lines, to get more insight about your code.
> 6 │   It can render multiple messages together.
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
> 12 │   Sometimes you want to show the the same message on the same line. If the same
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
> 18 │    It is also possible to group related diagnostics together via a `context`
     ·                                                                    ────┬────
     · ╭──────────────────────────────────────────────────────────────────────╯
     · │
  19 │ │  property. This is a unique identifier per `block`. This will be useful, if you
  20 │ │  have some diagnostics that are located further away from eachother. The same
> 21 │ │  `context` will be your friend here.
     · │  ────┬────
     · ╰──────┴────── Yay, found my `context` friends!
     │
     └─
```

```
     ┌─[./README.md]
     │
> 25 │   Last but not least, we have the `notes` feature. You can add notes to your
     ·                                   ───┬────
     ·                                      ╰────── This diagnostic contains some notes.
     ·
  26 │   diagnostics if you want to provide even more information.
     ·
     ├─
     ·   NOTES:
     ·     - This note can contain more information about the specific diagnostic.
     ·     - What do you think? More info at https://github.com/RobinMalfait/placebo!
     └─
```

<details>

<summary>The actual diagnostics input for this readme can be found here.</summary>


```json
[
  {
    "block": "7A6B0B17-EFBE-4CCB-8E48-9462D8128BD6",
    "file": "./README.md",
    "message": "A beautiful new language agnostic diagnostics printer!",
    "loc": {
      "row": 0,
      "col": 8,
      "len": 8
    },
    "notes": []
  },
  {
    "block": "94B410B6-A139-41FB-A9F5-F74E6229F459",
    "file": "./README.md",
    "message": "Messages will be rendered",
    "loc": {
      "row": 5,
      "col": 32,
      "len": 8
    },
    "notes": []
  },
  {
    "block": "94B410B6-A139-41FB-A9F5-F74E6229F459",
    "file": "./README.md",
    "message": "underneath eachother just",
    "loc": {
      "row": 5,
      "col": 23,
      "len": 8
    },
    "notes": []
  },
  {
    "block": "94B410B6-A139-41FB-A9F5-F74E6229F459",
    "file": "./README.md",
    "message": "like the messages you see here.",
    "loc": {
      "row": 5,
      "col": 14,
      "len": 8
    },
    "notes": []
  },
  {
    "block": "740B3267-B481-4AEE-A72C-96DDAA06F633",
    "file": "./README.md",
    "message": "You wrote `the` twice!",
    "loc": {
      "row": 11,
      "col": 27,
      "len": 3
    },
    "notes": []
  },
  {
    "block": "740B3267-B481-4AEE-A72C-96DDAA06F633",
    "file": "./README.md",
    "message": "You wrote `the` twice!",
    "loc": {
      "row": 11,
      "col": 31,
      "len": 3
    },
    "notes": []
  },
  {
    "block": "4DE8B3B8-C418-4F8D-B6D1-8E09A2BC8507",
    "context": "0A8B6E18-8CB1-49A0-A70C-E6DAF3907FA3",
    "file": "./README.md",
    "message": "Yay, found my `context` friends!",
    "loc": {
      "row": 17,
      "col": 64,
      "len": 9
    },
    "notes": []
  },
  {
    "block": "4DE8B3B8-C418-4F8D-B6D1-8E09A2BC8507",
    "context": "0A8B6E18-8CB1-49A0-A70C-E6DAF3907FA3",
    "file": "./README.md",
    "message": "Yay, found my `context` friends!",
    "loc": {
      "row": 20,
      "col": 0,
      "len": 9
    },
    "notes": []
  },
  {
    "block": "50F4FF45-EF2A-48EC-B14C-DA17C260EFD5",
    "file": "./README.md",
    "message": "This diagnostic contains some notes.",
    "loc": {
      "row": 24,
      "col": 32,
      "len": 8
    },
    "notes": [
      "This note can contain more information about the specific diagnostic.",
      "What do you think? More info at https://github.com/RobinMalfait/placebo!"
    ]
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

```sh
node ./examples/javascript
```

```sh
node ./examples/css
```
