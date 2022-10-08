
    ┌─[./examples/readme/code/README.md]
    │
∙ 1 │   What is Placebo?
    ·           ───┬────
    ·              ╰────── A beautiful new language agnostic diagnostics printer!
    │
    └─

    ┌─[./examples/readme/code/README.md]
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

     ┌─[./examples/readme/code/README.md]
     │
∙ 12 │   Sometimes you want to show the the same message on the same line. If the same
     ·                              ─┬─ ─┬─
     ·                               ╰───┴─── You wrote `the` twice!
     ·
  13 │   message is used on the same line, then those diagnostics will be grouped
  14 │   together.
     │
     └─

     ┌─[./examples/readme/code/README.md]
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

     ┌─[./examples/readme/code/README.md]
     │
∙ 25 │   We can also write messages that are very long.
     ·                                       ────┬──── ╭─
     ·                                           ╰─────┤ Like this message. We have a lot to say here so it might not be ideal
     ·                                                 │ if everything was just written on the same line. Instead we will
     ·                                                 │ use the width of your terminal to decide when to start wrapping.
     ·                                                 ╰─
     │
     └─

     ┌─[./examples/readme/code/README.md]
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

     ┌─[./examples/readme/code/README.md]
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

     ┌─[./examples/readme/code/README.md]
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
