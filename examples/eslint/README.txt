    ┌─[./examples/eslint/code.js]
    │
∙ 1 │   let abc = '123'
  2 │       ─┬─        ┬
    ·        │         ╰── Missing semicolon.
    ·        ╰──────────── 'abc' is assigned a value but never used.
    ·        ╰──────────── 'abc' is never reassigned. Use 'const' instead.
    ·
  3 │   function   hello() {
    ·
    ├─
    ·   NOTES:
    ·     - prefer-const
    ·     - no-unused-vars
    ·     - semi
    └─

    ┌─[./examples/eslint/code.js]
    │
  1 │   let abc = '123'
  2 │
∙ 3 │   function   hello() {
  4 │           ─┬───┬──   ┬
  5 │            │   │     ╰── Block must not be padded by blank lines.
    ·            │   ╰──────── 'hello' is defined but never used.
    ·            ╰──────────── Multiple spaces found before 'hello'.
    ·
  6 │         return "sup"
    ·
    ├─
    ·   NOTES:
    ·     - no-multi-spaces
    ·     - no-unused-vars
    ·     - padded-blocks
    └─

    ┌─[./examples/eslint/code.js]
    │
  3 │   function   hello() {
  4 │
∙ 5 │
    ·   ┬
    ·   ╰── More than 1 blank line not allowed.
    ·
  6 │         return "sup"
  7 │     }
    ·
    ├─
    ·   NOTE: no-multiple-empty-lines
    └─

    ┌─[./examples/eslint/code.js]
    │
  3 │   function   hello() {
  4 │
  5 │
∙ 6 │         return "sup"
    ·   ──┬───       ──┬──┬
    ·     │            │  ╰── Missing semicolon.
    ·     │            ╰───── Strings must use singlequote.
    ·     ╰────────────────── Expected indentation of 2 spaces but found 6.
    ·
  7 │     }
    ·
    ├─
    ·   NOTES:
    ·     - indent
    ·     - quotes
    ·     - semi
    └─

    ┌─[./examples/eslint/code.js]
    │
  6 │       return "sup"
∙ 7 │   }
    · ┬─
    · ╰─── Expected indentation of 0 spaces but found 2.
    ·
    ├─
    ·   NOTE: indent
    └─