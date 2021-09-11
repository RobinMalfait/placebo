module.exports.env = {
  // The amount of lines before and after the current line to give more context
  // to the user.
  BEFORE_CONTEXT_LINES_COUNT: resolveEnv('PLACEBO_CONTEXT_LINES_BEFORE', Number, 3),
  AFTER_CONTEXT_LINES_COUNT: resolveEnv('PLACEBO_CONTEXT_LINES_AFTER', Number, 3),
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

  return value ?? defaultValue
}
