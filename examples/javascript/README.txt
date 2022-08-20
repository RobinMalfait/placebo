
    ┌─[./examples/javascript/code.js]
    │
  1 │   let a = 123
∙ 2 │   let b = '321'
  3 │           ──┬──
    ·             ╰──── Consider changing this to a 'number'
    ·
∙ 4 │   let total = a + b
  5 │               ┬ ┬ ┬
    ·               │ │ ╰── This is of type 'string'
    ·               │ ╰──── You cannot add a 'number' and a 'string'
    ·               ╰────── This is of type 'number'
    ·
  6 │   console.log('Total:', total)
    │
    └─
