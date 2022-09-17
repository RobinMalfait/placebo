
    ┌─[./examples/typescript/code.ts]
    │
  4 │     role: 'Professor',
  5 │   }
    ·
∙ 7 │   console.log(user.name)
    ·                    ─┬──
  9 │   // ---            ╰──── Property 'name' does not exist on type '{ firstName: string; lastName: string; role: string; }'.
    ·
    ├─
    ·   `TS2339` (https://typescript.tv/errors/#TS2339)
    └─

     ┌─[./examples/typescript/code.ts]
     │
   9 │   // ---
     ·
∙ 11 │   function compact(arr) {
     ·                    ─┬─
     ·                     ╰─── Parameter 'arr' implicitly has an 'any' type.
     ·
  12 │     if (orr.length > 10) return arr.trim(0, 10)
  13 │     return arr
  14 │   }
     ·
     ├─
     ·   `TS7006` (https://typescript.tv/errors/#TS7006)
     └─

     ┌─[./examples/typescript/code.ts]
     │
   9 │   // ---
     ·
  11 │   function compact(arr) {
∙ 12 │     if (orr.length > 10) return arr.trim(0, 10)
     ·         ─┬─
     ·          ╰─── Cannot find name 'orr'.
     ·
  13 │     return arr
  14 │   }
     ·
     ├─
     ·   `TS2304` (https://typescript.tv/errors/#TS2304)
     └─

     ┌─[./examples/typescript/code.ts]
     │
  18 │   let a: { m: number[] }
  19 │   let b = { m: [''] }
∙ 20 │   a = b
     ·   ┬ ╭─
     ·   ╰─┤ Type '{ m: string[]; }' is not assignable to type '{ m: number[]; }'.
     ·     │   Types of property 'm' are incompatible.
     ·     │     Type 'string[]' is not assignable to type 'number[]'.
     ·     │       Type 'string' is not assignable to type 'number'.
     ·     ╰─
     ·
     ├─
     ·   `TS2322` (https://typescript.tv/errors/#TS2322)
     └─