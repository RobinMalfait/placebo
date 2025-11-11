import fs from 'node:fs/promises'
import path from 'node:path'
import prettier from 'prettier'

const root = process.cwd()

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
      let output: string[] = []
      let diagnostics = await (
        await import(example)
      ).default((message: string) => output.push(message))
      return [example, output.join('\n'), diagnostics]
    })
    .map(async (p) => {
      let result = await p
      if (result === null) {
        return ['', '', []]
      }

      let [example, output, diagnostics] = result
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
        let result: string[] = []
        result.push('<!-- GENERATED -->')
        result.push('')
        result.push('```')
        result.push(
          output.replaceAll('examples/readme/code/', '').replace(/\n\n/g, '\n```\n\n```\n'),
        )
        result.push('```')
        result.push('')
        result.push('<details>')
        result.push('')
        result.push(
          '<summary>The actual diagnostics input for this readme can be found here.</summary>',
        )
        result.push('')
        result.push('```json')
        result.push(
          JSON.stringify(diagnostics, null, 2).replaceAll(
            path.resolve(__dirname, '..', 'examples', 'readme', 'code', 'README.md'),
            'README.md',
          ),
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
        await prettier.format(contents, {
          parser: 'markdown',
          ...require(path.resolve(root, 'package.json')).prettier,
        }),
      )
    }
  }

  console.log('Done!')
}

generate()
