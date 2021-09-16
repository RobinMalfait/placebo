module.exports.env = {
  // The amount of lines before and after the current line to give more context
  // to the user.
  BEFORE_CONTEXT_LINES_COUNT: resolveEnv('PLACEBO_CONTEXT_LINES_BEFORE', Number, 3),
  AFTER_CONTEXT_LINES_COUNT: resolveEnv('PLACEBO_CONTEXT_LINES_AFTER', Number, 3),

  // Whether or not you want syntax highlighting for the context lines
  COLOR_CONTEXT_LINES: resolveEnv('PLACEBO_COLOR_CONTEXT_LINES', Boolean, false),

  // Print width to make everything fit as good as possible
  PRINT_WIDTH: resolveEnv('PLACEBO_PRINT_WIDTH', Number, process.stdout.columns),
}

function resolveEnv(name, type, defaultValue) {
  let value = process.env[name]
  if (value === undefined) {
    return defaultValue
  }

  if (type === Number) {
    let valueAsNumber = Number(value)
    return isNaN(valueAsNumber) ? defaultValue : valueAsNumber
  }

  if (type === Boolean) {
    if (value === '1' || value === 'true') return true
    if (value === '0' || value === 'false') return false

    return Boolean(value)
  }

  return value ?? defaultValue
}
