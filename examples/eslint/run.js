/* eslint-disable */
const run = require('../run')(require('./diagnostics'))

if (module.parent === null) {
  run()
} else {
  module.exports = run
}
