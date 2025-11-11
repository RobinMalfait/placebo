let a = 123
let b = '321'

let total = a + b

console.log('Total:', total)

let html = String.raw
let myHTML = html`
  <div>
    <h1>${total}</h1>
  </div>
`
