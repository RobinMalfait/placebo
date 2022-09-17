
    ┌─[./examples/eslint/code.js]
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
    ·   ┌──────────┬──────┐
    ·   │ Severity │ Rule │
    ·   ├──────────┼──────┤
    ·   │ Error    │ semi │
    ·   └──────────┴──────┘
    ·
    ├─
    ·
    ·   ┌──────────┬──────────────┐
    ·   │ Severity │ Rule         │
    ·   ├──────────┼──────────────┤
    ·   │ Error    │ prefer-const │
    ·   └──────────┴──────────────┘
    ·
    ├─
    ·
    ·   ┌──────────┬────────────────┐
    ·   │ Severity │ Rule           │
    ·   ├──────────┼────────────────┤
    ·   │ Error    │ no-unused-vars │
    ·   └──────────┴────────────────┘
    ·
    └─

    ┌─[./examples/eslint/code.js]
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
    ·   ┌──────────┬───────────────┐
    ·   │ Severity │ Rule          │
    ·   ├──────────┼───────────────┤
    ·   │ Error    │ padded-blocks │
    ·   └──────────┴───────────────┘
    ·
    ├─
    ·
    ·   ┌──────────┬────────────────┐
    ·   │ Severity │ Rule           │
    ·   ├──────────┼────────────────┤
    ·   │ Error    │ no-unused-vars │
    ·   └──────────┴────────────────┘
    ·
    ├─
    ·
    ·   ┌──────────┬─────────────────┐
    ·   │ Severity │ Rule            │
    ·   ├──────────┼─────────────────┤
    ·   │ Error    │ no-multi-spaces │
    ·   └──────────┴─────────────────┘
    ·
    └─

    ┌─[./examples/eslint/code.js]
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
    ·   ┌──────────┬─────────────────────────┐
    ·   │ Severity │ Rule                    │
    ·   ├──────────┼─────────────────────────┤
    ·   │ Error    │ no-multiple-empty-lines │
    ·   └──────────┴─────────────────────────┘
    └─

    ┌─[./examples/eslint/code.js]
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
    ·   ┌──────────┬──────┐
    ·   │ Severity │ Rule │
    ·   ├──────────┼──────┤
    ·   │ Error    │ semi │
    ·   └──────────┴──────┘
    ·
    ├─
    ·
    ·   ┌──────────┬────────┐
    ·   │ Severity │ Rule   │
    ·   ├──────────┼────────┤
    ·   │ Error    │ quotes │
    ·   └──────────┴────────┘
    ·
    ├─
    ·
    ·   ┌──────────┬────────┐
    ·   │ Severity │ Rule   │
    ·   ├──────────┼────────┤
    ·   │ Error    │ indent │
    ·   └──────────┴────────┘
    ·
    └─

    ┌─[./examples/eslint/code.js]
    │
  6 │       return "sup"
∙ 7 │   }
    · ┬─
    · ╰─── Expected indentation of 0 spaces but found 2.
    ·
    ├─
    ·   ┌──────────┬────────┐
    ·   │ Severity │ Rule   │
    ·   ├──────────┼────────┤
    ·   │ Error    │ indent │
    ·   └──────────┴────────┘
    └─