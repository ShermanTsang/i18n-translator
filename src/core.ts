import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import chalk from 'chalk'
import { Logger } from './log'

async function walk(dir: string, extensions: string[] = [], fileList: string[] = []) {
  const files = await fs.readdir(dir, { withFileTypes: true })
  for (const file of files) {
    const filePath: string = path.resolve(dir, file.name)
    if (file.isDirectory()) {
      Logger.info.tag(' Traversing ').message(`Walk into directory ${chalk.underline.yellow(filePath)}`)
      fileList = await walk(filePath, extensions, fileList)
      Logger.plain.divider('-')
    }
    else if (extensions.includes(path.extname(file.name))) {
      Logger.info.tag(' Traversing ').message(`Add file ${chalk.underline.yellow(file.name)} to process list`).print()
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
    Logger.info.tag('processing').message(`Scan keys from [[${filePath}]]`).print()
    let currentFindKeys: string[] = []
    if (content) {
      currentFindKeys = content.match(pattern) ? content.match(pattern) as string[] : []
      if (currentFindKeys.length > 0) {
        keys.push(...currentFindKeys)
        Logger.success.tag('Locating').message(`Find key: ${
                    currentFindKeys.map(key => chalk.underline.yellow(key)).join(', ')
                }`).print()
      }
      else {
        Logger.info.tag(' Locating ').message(`No matched key`).print()
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

    Logger.plain.divider('-')
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
