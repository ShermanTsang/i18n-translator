import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import chalk from 'chalk'

async function walk(dir: string, extensions: string[], fileList = []) {
  const files = await fs.readdir(dir, { withFileTypes: true })
  for (const file of files) {
    const filePath = path.resolve(dir, file.name)
    if (file.isDirectory()) {
      console.log(`${chalk.bgBlue.white(' Traversing ')} Walk into directory ${chalk.underline.yellow(filePath)}`)
      fileList = await walk(filePath, extensions, fileList)
      console.log(`${chalk.green(String('-').repeat(40))}`)
    }
    else if (extensions.length === 0 || extensions.includes(path.extname(file.name))) {
      console.log(`${chalk.bgBlue.white(' Traversing ')} Add file ${chalk.underline.yellow(file.name)} to process list`)
      fileList.push(filePath)
    }
  }
  return fileList
}

export async function extractTranslationKeys(pattern: RegExp, directory: string, extensions?: string[]) {
  console.log(`${chalk.white.bgBlue(' Setting ')} Use RegExp ${chalk.underline.yellow(pattern)} to match`)
  console.log(`${chalk.green(String('-').repeat(40))}`)
  const keys = []
  const files = await walk(directory, extensions)

  for (const filePath of files) {
    const content = await fs.readFile(filePath, 'utf-8')
    console.log(`${chalk.white.bgBlue(' Processing ')} Scan keys from ${chalk.underline.yellow(filePath)}`)
    const regex = pattern
    let readText: any
    const currentFindKeys = []
    // eslint-disable-next-line no-cond-assign
    while ((readText = regex.exec(content)) !== null) {
      keys.push(readText[1])
      currentFindKeys.push(readText[1])
    }
    if (currentFindKeys.length > 0) {
      console.log(`${chalk.white.bgGreen(' Extracting ')} Find key: ${
                currentFindKeys.map(key => chalk.underline.yellow(key)).join(', ')
            }`)
    }
    console.log(`${chalk.green(String('-').repeat(40))}`)
  }
  return keys
}

export function transformArrayToObject(keys: string[]) {
  return keys.reduce((acc, key) => {
    acc[key] = key
    return acc
  }, {})
}

export default { extractTranslationKeys, transformArrayToJson: transformArrayToObject }
