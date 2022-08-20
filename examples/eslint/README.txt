    ┌─[./examples/eslint/code.js]
    │
∙ 1 │   let abc = '123'
  2 │       ─┬─        ┬
    ·        │         ╰── Missing semicolon. (1)
    ·        ╰──────────── 'abc' is assigned a value but never used. (3)
    ·        ╰──────────── 'abc' is never reassigned. Use 'const' instead. (2)
    ·
  3 │   function   hello() {
    ·
    ├─
    ·   NOTES:
    ·     - semi (1)
    ·     - prefer-const (2)
    ·     - no-unused-vars (3)
    └─

    ┌─[./examples/eslint/code.js]
    │
  1 │   let abc = '123'
  2 │
∙ 3 │   function   hello() {
  4 │           ─┬───┬──   ┬
  5 │            │   │     ╰── Block must not be padded by blank lines. (1)
    ·            │   ╰──────── 'hello' is defined but never used. (2)
    ·            ╰──────────── Multiple spaces found before 'hello'. (3)
    ·
  6 │         return "sup"
    ·
    ├─
    ·   NOTES:
    ·     - padded-blocks (1)
    ·     - no-unused-vars (2)
    ·     - no-multi-spaces (3)
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
    ·     │            │  ╰── Missing semicolon. (1)
    ·     │            ╰───── Strings must use singlequote. (2)
    ·     ╰────────────────── Expected indentation of 2 spaces but found 6. (3)
    ·
  7 │     }
    ·
    ├─
    ·   NOTES:
    ·     - semi (1)
    ·     - quotes (2)
    ·     - indent (3)
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