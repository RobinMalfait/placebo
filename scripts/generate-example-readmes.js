let fs = require('fs/promises')
let path = require('path')
let kleur = require('kleur')

kleur.enabled = false

let root = process.cwd()

async function generate() {
  let base = path.resolve(root, 'examples')
  let ignoreFolders = ['node_modules']
  let examples = (await fs.readdir(base, { withFileTypes: true }))
    .filter((example) => example.isDirectory())
    .filter((example) => !ignoreFolders.includes(example.name))
    .map((folder) => path.resolve(base, folder.name))
    .map(async (example) => {
      let output = []
      await require(example)(output.push.bind(output))
      return [example, output.join('\n')]
    })
    .map(async (p) => {
      let [example, output] = await p
      return fs.writeFile(path.resolve(example, 'README.txt'), output.replace(/^\n+/g, ''))
    })

  await Promise.all(examples)
  console.log('Done!')
}

generate()
