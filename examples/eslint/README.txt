    ┌─[./examples/eslint/code.js]
    │
∙ 1 │   let abc = '123'
  2 │       ─┬─        ┬
    ·        │         ╰── Missing semicolon.¹
    ·        ╰──────────── 'abc' is assigned a value but never used.³
    ·        ╰──────────── 'abc' is never reassigned. Use 'const' instead.²
    ·
  3 │   function   hello() {
    ·
    ├─
    ·   NOTES:
    ·     - ¹semi
    ·     - ²prefer-const
    ·     - ³no-unused-vars
    └─

    ┌─[./examples/eslint/code.js]
    │
  1 │   let abc = '123'
  2 │
∙ 3 │   function   hello() {
  4 │           ─┬───┬──   ┬
  5 │            │   │     ╰── Block must not be padded by blank lines.¹
    ·            │   ╰──────── 'hello' is defined but never used.²
    ·            ╰──────────── Multiple spaces found before 'hello'.³
    ·
  6 │         return "sup"
    ·
    ├─
    ·   NOTES:
    ·     - ¹padded-blocks
    ·     - ²no-unused-vars
    ·     - ³no-multi-spaces
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
    ·     │            │  ╰── Missing semicolon.¹
    ·     │            ╰───── Strings must use singlequote.²
    ·     ╰────────────────── Expected indentation of 2 spaces but found 6.³
    ·
  7 │     }
    ·
    ├─
    ·   NOTES:
    ·     - ¹semi
    ·     - ²quotes
    ·     - ³indent
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