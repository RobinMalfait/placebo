    ┌─[./README.md]
    │
∙ 1 │   What is Placebo?
    ·           ───┬────
    ·              ╰────── A beautiful new language agnostic diagnostics printer!
    │
    └─

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

     ┌─[./README.md]
     │
∙ 29 │   Last but not least, we have the `notes` feature. You can add notes to your
     ·                                   ───┬────
     ·                                      ╰────── This diagnostic contains some notes.
     ·
  30 │   diagnostics if you want to provide even more information.
     ·
     ├─
     ·   NOTES:
     ·     - This note can contain more information about the specific diagnostic.
     ·     - What do you think? More info at https://github.com/RobinMalfait/placebo!
     └─

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