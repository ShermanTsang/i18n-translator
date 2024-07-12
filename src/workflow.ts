import * as fs from 'node:fs'
import * as path from 'node:path'
import * as process from 'node:process'
import chalk from 'chalk'
import { logger } from '@shermant/logger'
import * as chokidar from 'chokidar'
import { isDirectoryExists, transformArrayToObject } from './utils'
import {
  getSettingFromCommand,
  getSettingFromEnv,
  getSettingFromInquirer,
  standardizeOptions,
  validateSettings,
} from './setting.ts'
import { Extractor } from './extractor.ts'

export class Workflow {
  private readonly defaultSettings: Setting.NullableInputOptions
  private mergedSettings: Setting.NullableInputOptions
  private finalSettings: Setting.Options
  private sortedKeys: string[]
  private needToCompleteSettings: Setting.OptionsInputKeysExcept<'env'>[] = []

  constructor() {
    this.defaultSettings = {
      env: path.resolve(process.cwd(), '.env'),
      pattern: null,
      output: null,
      dirs: null,
      exts: null,
      watch: false,
    }
    this.mergedSettings = {} as Setting.NullableInputOptions
    this.finalSettings = {} as Setting.Options
    this.sortedKeys = []
  }

  async run() {
    await this.initState()
    await this.getSettingsState()
    await this.validateSettingsState()
    await this.completeSettingsState()
    this.finalizeSettingsState()
    await this.extractKeysState()
    this.saveResultState()
    this.translateFilesState()
  }

  async initState() {
    logger.info.tag('initializing').appendDivider('-').message('set default setting').data(this.defaultSettings).print()
  }

  async getSettingsState() {
    const { options: settingsFromCommand, hasConfig: hasConfigFromCommand } = getSettingFromCommand()
    if (hasConfigFromCommand) {
      logger.info.tag('check setting').appendDivider('-').message('parsing setting options from [[command line]]').data(settingsFromCommand).print()
    }
    else {
      logger.info.tag('check setting').appendDivider('-').message('no setting options found in [[command line]]').print()
    }

    const { options: settingsFromEnv, hasConfig: hasConfigFromEnv } = getSettingFromEnv(this.defaultSettings.env)
    if (hasConfigFromEnv) {
      logger.info.tag('check setting').appendDivider('-').message('reading setting options from [[.env]] file').data(settingsFromEnv).print()
    }
    else {
      logger.info.tag('check setting').appendDivider('-').message('no setting options found in [[.env]] file').print()
    }

    this.mergedSettings = {
      ...this.defaultSettings,
      ...settingsFromEnv,
      ...settingsFromCommand,
    }

    logger.info.tag('setting').appendDivider('-')
      .message(`merging settings from [[command line]] and [[.env file]], 
        \n[[notice: the settings in command line will override the settings in .env file]]`)
      .data(this.mergedSettings).print()
  }

  async validateSettingsState() {
    const { unset: unsetSettings, invalid: invalidSettings } = validateSettings(this.mergedSettings)
    this.needToCompleteSettings = Array.from(new Set([...unsetSettings, ...invalidSettings]))

    if (this.needToCompleteSettings.length > 0) {
      logger.error.tag('Checking').appendDivider('-')
        .message(`👋 please provide the following settings :
          missing settings: ${unsetSettings.length > 0 ? (`[[${unsetSettings.join(', ')}]]`) : 'none'}
          invalid settings: ${invalidSettings.length > 0 ? (`[[${invalidSettings.join(', ')}]]`) : 'none'}
          \n[[notice: the program will flow into inquirer process to complete them]]`)
        .print()
    }
  }

  async completeSettingsState() {
    if (this.needToCompleteSettings.length > 0) {
      try {
        const { options: settingsFromInquirer } = await getSettingFromInquirer(this.needToCompleteSettings, this.mergedSettings)
        this.mergedSettings = {
          ...this.mergedSettings,
          ...settingsFromInquirer,
        }
      }
      catch (error) {
        logger.error.tag('error').message(`Error completing settings: ${error}`).print()
        process.exit(1)
      }
    }
  }

  finalizeSettingsState() {
    this.finalSettings = standardizeOptions(this.mergedSettings as Setting.InputOptions)
    logger.info.tag('setting').message('final settings').data(this.finalSettings).appendDivider('-').print()
  }

  async extractKeysState(verboseMode = true) {
    try {
      let allKeys: any[] = []
      logger.info.tag('setting').message(`Use RegExp ${chalk.underline.yellow(this.finalSettings.pattern)} to match`).print(verboseMode)
      for (const dirPath of this.finalSettings.dirs) {
        const extractor = new Extractor(this.finalSettings.pattern, dirPath, this.finalSettings.exts)
        extractor.setVerboseMode(verboseMode)
        const keys = await extractor.run()
        allKeys = allKeys.concat(keys)
      }
      this.sortedKeys = allKeys.sort()
      logger.info.tag(' Resulting ').message(`🥳Found [[${this.sortedKeys.length}]] keys in total`).print()
      if (this.sortedKeys.length > 0) {
        logger.success.tag('Resulting').message(`👉Extracted keys: 
      [[${this.sortedKeys.join(']]  [[')}]]`,
        ).print()
      }
    }
    catch (error) {
      logger.error.tag('extracting').message(`${chalk.bgRed.white(' Error ')} Extracting keys failed:`).print()
      process.exit(1)
    }
  }

  saveResultState() {
    const objectContent = transformArrayToObject(this.sortedKeys)
    try {
      if (!isDirectoryExists(path.dirname(this.finalSettings.output))) {
        fs.mkdirSync(path.dirname(this.finalSettings.output), { recursive: true })
      }
      fs.writeFileSync(this.finalSettings.output, JSON.stringify(objectContent, null, 2))
      logger.success.tag('saving').message(`Extracted keys written to ${chalk.underline.yellow(this.finalSettings.output)}`).print()

      if (this.finalSettings.watch) {
        this.setupFileWatcher()
      }
    }
    catch (error) {
      logger.error.tag('writing').message(`${chalk.bgRed.white(' Error ')} Writing extracted keys failed:`).print()
    }
  }

  setupFileWatcher(delaySeconds: number = 5) {
    logger.info.tag('watching').time(true).prependDivider('-').message(`file watcher will start after [[${delaySeconds}]] seconds`).print()
    setTimeout(() => {
      const watcher = chokidar.watch(this.finalSettings.dirs, {
        ignored: /(^|[/\\])\../, // ignore dotfiles
        persistent: true,
      })

      console.clear()
      logger.info.tag('watching').time(true).prependDivider('-').appendDivider('-').message(`👁️Watching for files changes in ${chalk.underline.yellow(this.finalSettings.dirs.join(', '))} ...`).print()

      watcher.on('change', async (path) => {
        logger.info.tag('watching').time(true).message(`file ${chalk.underline.yellow(path)} has been changed`).appendDivider('-').print()
        await this.extractKeysState(false)
        this.saveResultState()
      })

      watcher.on('error', (error) => {
        logger.error.tag('watching').time(true).message(`Watcher error: ${error}`).print()
      })
    }, delaySeconds * 1000)
  }

  translateFilesState() {

  }
}
