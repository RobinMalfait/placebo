
    ┌─[./examples/typescript/code/index.ts]
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

     ┌─[./examples/eslint/index.ts]
     │
   6 │   const __dirname = fileURLToPath(new URL('.', import.meta.url))
     ·
   8 │   if (import.meta.url.endsWith(process.argv[1])) {
∙  9 │     run(diagnose)(process.argv.length > 2 ? process.argv.slice(2) : globSync(`${__dirname}code/*`))
  10 │   }     ───┬──── ╭─
     ·            ╰─────┤ Argument of type '(files: string[]) => Promise<{ block: string; file: string;
     ·                  │ message: string; location: (number | undefined)[][]; notes: string; }[]>' is not
     ·                  │ assignable to parameter of type '(files: string[]) => Promise<Diagnostic[]>'.
     ·                  │   Type 'Promise<{ block: string; file: string; message: string; location: (number |
     ·                  │ undefined)[][]; notes: string; }[]>' is not assignable to type 'Promise<Diagnostic[]>'.
     ·                  │     Type '{ block: string; file: string; message: string; location: (number |
     ·                  │ undefined)[][]; notes: string; }[]' is not assignable to type 'Diagnostic[]'.
     ·                  │       Type '{ block: string; file: string; message: string; location: (number
     ·                  │ | undefined)[][]; notes: string; }' is not assignable to type 'Diagnostic'.
     ·                  │         Types of property 'location' are incompatible.
     ·                  │           Type '(number | undefined)[][]' is not assignable to type 'Location'.
     ·                  │             Target requires 2 element(s) but source may have fewer.
     ·                  ╰─
     ·
  12 │   export default function (write = console.log) {
∙ 13 │     return run(diagnose)(globSync(`${__dirname}code/*`), write)
  14 │   }            ───┬──── ╭─
     ·                   ╰─────┤ Argument of type '(files: string[]) => Promise<{ block: string; file: string;
     ·                         │ message: string; location: (number | undefined)[][]; notes: string; }[]>' is not
     ·                         │ assignable to parameter of type '(files: string[]) => Promise<Diagnostic[]>'.
     ·                         │   Type 'Promise<{ block: string; file: string; message: string; location: (number |
     ·                         │ undefined)[][]; notes: string; }[]>' is not assignable to type 'Promise<Diagnostic[]>'.
     ·                         │     Type '{ block: string; file: string; message: string; location: (number |
     ·                         │ undefined)[][]; notes: string; }[]' is not assignable to type 'Diagnostic[]'.
     ·                         │       Type '{ block: string; file: string; message: string; location: (number
     ·                         │ | undefined)[][]; notes: string; }' is not assignable to type 'Diagnostic'.
     ·                         │         Types of property 'location' are incompatible.
     ·                         │           Type '(number | undefined)[][]' is not assignable to type 'Location'.
     ·                         │             Target requires 2 element(s) but source may have fewer.
     ·                         ╰─
     ·
     ├─
     ·   `TS2345` (https://typescript.tv/errors/#TS2345)
     └─

     ┌─[./examples/typescript/code/index.ts]
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

     ┌─[./examples/typescript/code/index.ts]
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

     ┌─[./examples/typescript/code/index.ts]
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
