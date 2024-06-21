import * as fs from 'node:fs'
import * as path from 'node:path'
import chalk from 'chalk'
import { logger } from '@shermant/logger'
import { extractTranslationKeys, transformArrayToObject } from './core'
import { isDirectoryExists } from './utils'
import { inquireSetting } from './setting.ts';

(async () => {
  const { pattern, directories, specifiedFileExt, outputPath } = await inquireSetting()

  if (directories?.length > 0) {
    try {
      let allKeys: string[] = []
      logger.info.tag(' Setting ').message(`Use RegExp ${chalk.underline.yellow(pattern)} to match`).print()
      for (const directoryPath of directories) {
        const keys = await extractTranslationKeys(
          pattern,
          directoryPath,
          specifiedFileExt,
        )
        allKeys = allKeys.concat(keys)
      }
      const sortedKeys = allKeys.sort()
      logger.info.tag(' Resulting ').message(`Found ${chalk.underline.yellow(sortedKeys.length)} keys in total`).print()

      const objectContent = transformArrayToObject(sortedKeys)

      try {
        if (!isDirectoryExists(path.dirname(outputPath))) {
          fs.mkdirSync(path.dirname(outputPath), { recursive: true })
        }
        fs.writeFileSync(outputPath, JSON.stringify(objectContent, null, 2))
        logger.success.tag('saving').message(`Extracted keys written to ${chalk.underline.yellow(outputPath)}`).print()
      }
      catch (error) {
        console.error(`${chalk.bgRed.white(' Error ')} Writing extracted keys failed:`, error)
      }
    }
    catch (error) {
      console.error(`${chalk.bgRed.white(' Error ')} Extracting keys failed:`, error)
    }
  }
})()
