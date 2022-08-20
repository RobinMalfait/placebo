    ┌─[./examples/readme/code.md]
    │
∙ 1 │   What is Placebo?
    ·           ───┬────
    ·              ╰────── A beautiful new language agnostic diagnostics printer!
    │
    └─

    ┌─[./examples/readme/code.md]
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

     ┌─[./examples/readme/code.md]
     │
∙ 12 │   Sometimes you want to show the the same message on the same line. If the same
     ·                              ─┬─ ─┬─
     ·                               ╰───┴─── You wrote `the` twice!
     ·
  13 │   message is used on the same line, then those diagnostics will be grouped
  14 │   together.
     │
     └─

     ┌─[./examples/readme/code.md]
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

     ┌─[./examples/readme/code.md]
     │
∙ 25 │   Last but not least, we have the `notes` feature. You can add notes to your
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