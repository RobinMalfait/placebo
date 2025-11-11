
    ┌─[./examples/eslint/code/index.js]
    │
∙ 1 │   let abc = '123'
    ·       ─┬─
    ·        ╰─── 'abc' is assigned a value but never used.
    ·
  3 │   function   hello() {
    ·
    ├─
    ·   Severity: Error
    ·   Rule: @typescript-eslint/no-unused-vars
    └─

    ┌─[./examples/eslint/code/index.js]
    │
  1 │   let abc = '123'
    ·
∙ 3 │   function   hello() {
    ·              ──┬──
    ·                ╰──── 'hello' is defined but never used.
    ·
  6 │         return "sup"
    ·
    ├─
    ·   Severity: Error
    ·   Rule: @typescript-eslint/no-unused-vars
    └─
