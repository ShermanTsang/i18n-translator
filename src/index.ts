import * as fs from 'node:fs'
import * as path from 'node:path'
import chalk from 'chalk'
import { logger } from '@shermant/logger'
import { extractTranslationKeys, transformArrayToObject } from './core'
import { isDirectoryExists } from './utils'
import {
  checkSettingsCompletion,
  getSettingFromCommand,
  getSettingFromEnv,
  getSettingFromInquirer,
  standardizeOptions,
} from './setting.ts'

const { options: settingsFromCommand, hasConfig: hasConfigFromCommand } = getSettingFromCommand()
if (hasConfigFromCommand) {
  logger.info.tag('check setting').prependDivider('-').message(`parsing setting options from [[command line]]`).data(settingsFromCommand).print()
}
else {
  logger.info.tag('check setting').prependDivider('-').message(`no setting options found in [[command line]]`).print()
}

const { options: settingsFromEnv, hasConfig: hasConfigFromEnv } = getSettingFromEnv()
if (hasConfigFromEnv) {
  logger.info.tag('check setting').prependDivider('-').message(`reading setting options from [[.env]] file`).data(settingsFromEnv).print()
}
else {
  logger.info.tag('check setting').prependDivider('-').message(`no setting options found in [[.env]] file`).print()
}

let mergedSettings: Setting.NullableInputOptions = {
  ...{
    pattern: null,
    output: null,
    dirs: null,
    env: null,
    exts: null,
  },
  ...settingsFromEnv,
  ...settingsFromCommand,
}

logger.info.tag('setting').prependDivider('-')
  .message(`merging mergedSettings from [[command line]] and [[.env file]],
   [[notice: the settings in command line will override the settings in .env file]]`)
  .data(mergedSettings).print()

const unsetSettings = checkSettingsCompletion(mergedSettings) as Setting.OptionsInputKeysExcept<'env'>[]
if (unsetSettings.length > 0) {
  logger.error.tag('Checking').prependDivider('-')
    .message(`missing settings: [[${unsetSettings.join(', ')}]],
      [[notice: the program will flow into inquirer process to complete settings]]`)
    .print()

  const { options: settingsFromInquirer } = await getSettingFromInquirer(unsetSettings)

  mergedSettings = {
    ...mergedSettings,
    ...settingsFromInquirer,
  }
}

const finalSettings: Setting.Options = standardizeOptions(mergedSettings as Setting.InputOptions)

logger.info.tag('setting').prependDivider('-').message(`final settings`).data(finalSettings).print()
logger.plain.divider('-')

try {
  let allKeys: string[] = []
  logger.info.tag(' Setting ').message(`Use RegExp ${chalk.underline.yellow(finalSettings.pattern)} to match`).print()
  for (const dirPath of finalSettings.dirs) {
    const keys = await extractTranslationKeys(
      finalSettings.pattern,
      dirPath,
      finalSettings.exts,
    )
    allKeys = allKeys.concat(keys)
  }
  const sortedKeys = allKeys.sort()
  logger.info.tag(' Resulting ').message(`Found ${chalk.underline.yellow(sortedKeys.length)} keys in total`).print()

  const objectContent = transformArrayToObject(sortedKeys)

  try {
    if (!isDirectoryExists(path.dirname(finalSettings.output))) {
      fs.mkdirSync(path.dirname(finalSettings.output), { recursive: true })
    }
    fs.writeFileSync(finalSettings.output, JSON.stringify(objectContent, null, 2))
    logger.success.tag('saving').message(`Extracted keys written to ${chalk.underline.yellow(finalSettings.output)}`).print()
  }
  catch (error) {
    console.error(`${chalk.bgRed.white(' Error ')} Writing extracted keys failed:`, error)
  }
}
catch (error) {
  console.error(`${chalk.bgRed.white(' Error ')} Extracting keys failed:`, error)
}
