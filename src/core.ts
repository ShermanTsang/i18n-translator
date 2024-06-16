import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import chalk from 'chalk'

async function walk(dir: string, extensions: string[] = [], fileList: string[] = []) {
  const files = await fs.readdir(dir, { withFileTypes: true })
  for (const file of files) {
    const filePath: string = path.resolve(dir, file.name)
    if (file.isDirectory()) {
      console.log(`${chalk.bgBlue.white(' Traversing ')} Walk into directory ${chalk.underline.yellow(filePath)}`)
      fileList = await walk(filePath, extensions, fileList)
      console.log(`${chalk.green(String('-').repeat(40))}`)
    }
    else if (extensions.includes(path.extname(file.name))) {
      console.log(`${chalk.bgBlue.white(' Traversing ')} Add file ${chalk.underline.yellow(file.name)} to process list`)
      fileList.push(filePath)
    }
  }
  return fileList
}

export async function extractTranslationKeys(pattern: RegExp, directory: string, extensions: string[]) {
  const keys = []
  const files = await walk(directory, extensions)

  for (const filePath of files) {
    const content = await fs.readFile(filePath, 'utf-8')
    console.log(`${chalk.white.bgBlue(' Processing ')} Scan keys from ${chalk.underline.yellow(filePath)}`)
    let currentFindKeys: string[] = []
    if (content) {
      currentFindKeys = content.match(pattern) ? content.match(pattern) as string[] : []
      if (currentFindKeys.length > 0) {
        keys.push(...currentFindKeys)
        console.log(`${chalk.white.bgGreen(' Locating ')} Find key: ${
                    currentFindKeys.map(key => chalk.underline.yellow(key)).join(', ')
                }`)
      }
      else {
        console.log(`${chalk.white.bgGray(' Locating ')} No matched key`)
      }
    }

    // let readText = pattern.exec(content)
    //
    // while (readText !== null) {
    //   keys.push(readText[1])
    //   currentFindKeys.push(readText[1])
    //   readText = pattern.exec(content)
    // }
    // if (currentFindKeys.length > 0) {
    //   console.log(`${chalk.white.bgGreen(' Extracting ')} Find key: ${
    //             currentFindKeys.map(key => chalk.underline.yellow(key)).join(', ')
    //         }`)
    // }
    console.log(`${chalk.green(String('-').repeat(40))}`)
  }
  return keys
}

export function transformArrayToObject(keys: string[]) {
  return keys.reduce((acc: Record<string, any>, key) => {
    acc[key] = key
    return acc
  }, {})
}

export default { extractTranslationKeys, transformArrayToJson: transformArrayToObject }
