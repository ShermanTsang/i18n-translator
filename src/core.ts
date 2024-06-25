import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import chalk from 'chalk'
import { logger } from '@shermant/logger'

async function walk(dir: string, extensions: string[] = [], fileList: string[]) {
  const files = await fs.readdir(dir, { withFileTypes: true })
  for (const file of files) {
    const filePath: string = path.resolve(dir, file.name)
    if (file.isDirectory()) {
      logger.info.tag(' Traversing ').message(`Walk into directory ${chalk.underline.yellow(filePath)}`).appendDivider('-').print()
      fileList = await walk(filePath, extensions, fileList)
    }
    else if (extensions.includes(path.extname(file.name))) {
      logger.info.tag(' Traversing ').message(`Add file ${chalk.underline.yellow(file.name)} to process list`).print()
      fileList.push(filePath)
    }
  }
  return fileList
}

export async function extractTranslationKeys(pattern: RegExp, directory: string, extensions: string[]) {
  const keys = []
  const files = await walk(directory, extensions, [])

  for (const filePath of files) {
    const content = await fs.readFile(filePath, 'utf-8')
    logger.info.tag('processing').message(`Scan keys from [[${filePath}]]`).print()
    const currentFindKeys: string[] = []
    if (content) {
      const matches = content.matchAll(pattern)
      for (const match of matches) {
        keys.push(match[1])// the first capture group
        currentFindKeys.push(match[1])
      }
      // let readText = pattern.exec(content)
      // while (readText !== null) {
      //   keys.push(readText[1])
      //   currentFindKeys.push(readText[1])
      //   readText = pattern.exec(content)
      // }
      if (currentFindKeys.length > 0) {
        logger.success.tag('Locating').message(`Find key: ${
                    currentFindKeys.map(key => chalk.underline.yellow(key)).join(', ')
                }`).print()
      }
      else {
        logger.info.tag('Locating').message(`No matched key`).print()
      }
    }
    else {
      logger.warn.tag('Checking').message(`The file is empty`).print()
    }

    logger.plain.divider('-')
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
