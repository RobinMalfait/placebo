let fs = require('fs/promises')
let path = require('path')
let prettier = require('prettier')

let root = process.cwd()

async function generate() {
  let base = path.resolve(root, 'examples')
  let ignoreFolders = ['node_modules', /tmp/]
  let examples = (await fs.readdir(base, { withFileTypes: true }))
    .filter((example) => example.isDirectory())
    .filter((example) => {
      for (let folder of ignoreFolders) {
        if (folder instanceof RegExp && folder.test(example.name)) {
          return false
        }

        if (typeof folder === 'string' && folder === example.name) {
          return false
        }
      }

      return true
    })
    .map((folder) => path.resolve(base, folder.name))
    .map(async (example) => {
      let output = []
      let diagnostics = await require(example)(output.push.bind(output))
      return [example, output.join('\n'), diagnostics]
    })
    .map(async (p) => {
      let [example, output, diagnostics] = await p
      fs.writeFile(path.resolve(example, 'README.txt'), output)
      return [example, output, diagnostics]
    })

  let results = await Promise.all(examples)

  for (let [location, output, diagnostics] of results) {
    if (location.includes('examples/readme')) {
      let mainReadme = path.resolve(root, 'README.md')
      let contents = await fs.readFile(mainReadme, 'utf8')
      let generatedRegex = /<!-- GENERATED -->([\s\S]*)<!-- \/GENERATED -->/

      contents = contents.replace(generatedRegex, () => {
        let result = []
        result.push('<!-- GENERATED -->')
        result.push('')
        result.push('```')
        result.push(
          output.replaceAll('examples/readme/code/', '').replace(/\n\n/g, '\n```\n\n```\n')
        )
        result.push('```')
        result.push('')
        result.push('<details>')
        result.push('')
        result.push(
          '<summary>The actual diagnostics input for this readme can be found here.</summary>'
        )
        result.push('')
        result.push('```json')
        result.push(
          JSON.stringify(diagnostics, null, 2).replaceAll(
            path.resolve(__dirname, '..', 'examples', 'readme', 'code', 'README.md'),
            'README.md'
          )
        )
        result.push('```')
        result.push('')
        result.push('</details>')
        result.push('')
        result.push('<!-- /GENERATED -->')

        return result.join('\n')
      })

      await fs.writeFile(
        mainReadme,
        prettier.format(contents, {
          parser: 'markdown',
          ...require(path.resolve(root, 'package.json')).prettier,
        })
      )
    }
  }

  console.log('Done!')
}

generate()
