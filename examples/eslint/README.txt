
    ┌─[./examples/eslint/code/index.js]
    │
∙ 1 │   let abc = '123'
    ·       ─┬─        ┬
    ·        │         ╰── Missing semicolon.
    ·        ├──────────── 'abc' is assigned a value but never used.
    ·        ╰──────────── 'abc' is never reassigned. Use 'const' instead.
    ·
  3 │   function   hello() {
    ·
    ├─
    ·
    ·   Severity: Error
    ·   Rule: semi
    ·
    ├─
    ·
    ·   Severity: Error
    ·   Rule: prefer-const
    ·
    ├─
    ·
    ·   Severity: Error
    ·   Rule: no-unused-vars
    ·
    └─

    ┌─[./examples/eslint/code/index.js]
    │
  1 │   let abc = '123'
    ·
∙ 3 │   function   hello() {
    ·           ─┬───┬──   ┬
    ·            │   │     ╰── Block must not be padded by blank lines.
    ·            │   ╰──────── 'hello' is defined but never used.
    ·            ╰──────────── Multiple spaces found before 'hello'.
    ·
  6 │         return "sup"
    ·
    ├─
    ·
    ·   Severity: Error
    ·   Rule: padded-blocks
    ·
    ├─
    ·
    ·   Severity: Error
    ·   Rule: no-unused-vars
    ·
    ├─
    ·
    ·   Severity: Error
    ·   Rule: no-multi-spaces
    ·
    └─

    ┌─[./examples/eslint/code/index.js]
    │
  3 │   function   hello() {
    ·
    ·
    ·   ┬
    ·   ╰── More than 1 blank line not allowed.
    ·
  6 │         return "sup"
  7 │     }
    ·
    ├─
    ·   Severity: Error
    ·   Rule: no-multiple-empty-lines
    └─

    ┌─[./examples/eslint/code/index.js]
    │
  3 │   function   hello() {
    ·
    ·
∙ 6 │         return "sup"
    ·   ──┬───       ──┬──┬
    ·     │            │  ╰── Missing semicolon.
    ·     │            ╰───── Strings must use singlequote.
    ·     ╰────────────────── Expected indentation of 2 spaces but found 6.
    ·
  7 │     }
    ·
    ├─
    ·
    ·   Severity: Error
    ·   Rule: semi
    ·
    ├─
    ·
    ·   Severity: Error
    ·   Rule: quotes
    ·
    ├─
    ·
    ·   Severity: Error
    ·   Rule: indent
    ·
    └─

    ┌─[./examples/eslint/code/index.js]
    │
  6 │       return "sup"
∙ 7 │   }
    · ┬─
    · ╰─── Expected indentation of 0 spaces but found 2.
    ·
    ├─
    ·   Severity: Error
    ·   Rule: indent
    └─
