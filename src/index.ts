import * as fs from 'node:fs'
import * as path from 'node:path'
import * as process from 'node:process'
import chalk from 'chalk'
import { logger } from '@shermant/logger'
import { extractTranslationKeys, transformArrayToObject } from './core'
import { isDirectoryExists } from './utils'
import {
  getSettingFromCommand,
  getSettingFromEnv,
  getSettingFromInquirer,
  standardizeOptions,
  validateSettings,
} from './setting.ts'

const defaultSettings: Setting.NullableInputOptions = {
  env: path.resolve(process.cwd(), '.env'),
  pattern: null,
  output: null,
  dirs: null,
  exts: null,
}

const { options: settingsFromCommand, hasConfig: hasConfigFromCommand } = getSettingFromCommand()
if (hasConfigFromCommand) {
  logger.info.tag('check setting').appendDivider('-').message(`parsing setting options from [[command line]]`).data(settingsFromCommand).print()
}
else {
  logger.info.tag('check setting').appendDivider('-').message(`no setting options found in [[command line]]`).print()
}

const { options: settingsFromEnv, hasConfig: hasConfigFromEnv } = getSettingFromEnv(defaultSettings.env)
if (hasConfigFromEnv) {
  logger.info.tag('check setting').appendDivider('-').message(`reading setting options from [[.env]] file`).data(settingsFromEnv).print()
}
else {
  logger.info.tag('check setting').appendDivider('-').message(`no setting options found in [[.env]] file`).print()
}

let mergedSettings: Setting.NullableInputOptions = {
  ...defaultSettings,
  ...settingsFromEnv,
  ...settingsFromCommand,
}

logger.info.tag('setting').appendDivider('-')
  .message(`merging mergedSettings from [[command line]] and [[.env file]],
   [[notice: the settings in command line will override the settings in .env file]]`)
  .data(mergedSettings).print()

const { unset: unsetSettings, invalid: invalidSettings } = validateSettings(mergedSettings)
const needToCompleteSettings = Array.from(new Set([...unsetSettings, ...invalidSettings]))
if (needToCompleteSettings.length > 0) {
  logger.error.tag('Checking').appendDivider('-')
    .message(`you need provide the following settings:
      missing settings: ${unsetSettings.length > 0 ? (`[[${unsetSettings.join(', ')}]]`) : 'none'}
      invalid settings: ${invalidSettings.length > 0 ? (`[[${invalidSettings.join(', ')}]]`) : 'none'}
      [[notice: the program will flow into inquirer process to complete them]]`)
    .print()

  const { options: settingsFromInquirer } = await getSettingFromInquirer(needToCompleteSettings, mergedSettings).catch(() => {
    process.exit(1)
  })

  mergedSettings = {
    ...mergedSettings,
    ...settingsFromInquirer,
  }
}

const finalSettings = standardizeOptions(mergedSettings as Setting.InputOptions)

logger.info.tag('setting').message(`final settings`).data(finalSettings).appendDivider('-').print()

try {
  let allKeys: string[] = []
  logger.info.tag('setting').message(`Use RegExp ${chalk.underline.yellow(finalSettings.pattern)} to match`).print()
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
    logger.warn.tag('writing').message(`${chalk.bgRed.white(' Error ')} Writing extracted keys failed:`, error).print()
  }
}
catch (error) {
  logger.warn.tag('extracting').message(`${chalk.bgRed.white(' Error ')} Extracting keys failed:`, error).print()
}
