import * as fs from 'node:fs'
import * as path from 'node:path'
import * as process from 'node:process'
import chalk from 'chalk'
import { logger } from '@shermant/logger'
import * as chokidar from 'chokidar'
import { chunkArray, isDirectoryExists, sleep, transformArrayToObject } from './utils'
import {
  defaultSettings,
  getSettingFromCommand,
  getSettingFromEnv,
  getSettingFromInquirer,
  standardizeOptions,
  validateSettings,
} from './setting.ts'
import { Extractor } from './extractor.ts'
import { DeepseekTranslator } from './providers/deepseek.ts'
import { OpenAITranslator } from './providers/openai.ts'

export class Workflow {
  private readonly defaultSettings: Setting.NullableInputOptions
  private mergedSettings: Setting.NullableInputOptions
  private finalSettings: Setting.Options
  private sortedKeys: string[]
  private needToCompleteSettings: Setting.OptionsInputKeysExcept<'env'>[] = []

  constructor() {
    this.defaultSettings = defaultSettings
    this.mergedSettings = {} as Setting.NullableInputOptions
    this.finalSettings = {} as Setting.Options
    this.sortedKeys = []
  }

  welcomeState() {
    logger.info.prependDivider('#').appendDivider('#').message(`
    
    👋 Hi, this is a tool named @shermant/[[i18n-translator]]
    😉 This tool can help you [[extract]] and [[translate]] i18n text.
    
    `, ['green']).print()
  }

  async run() {
    this.welcomeState()
    await sleep(2000)
    await this.initState()
    await sleep(500)
    await this.getSettingsState()
    await sleep(1000)
    await this.validateSettingsState()
    await sleep(1000)
    await this.completeSettingsState()
    await sleep(1000)
    this.finalizeSettingsState()

    if (this.finalSettings.tasks.includes('extract')) {
      await sleep(1000)
      await this.extractKeysState()
      this.saveResultState()
    }

    if (this.finalSettings.tasks.includes('translate')) {
      await sleep(1000)
      await this.translateFilesState()
    }

    if (this.finalSettings.watch) {
      logger.info.tag('launch monitor').time(true).prependDivider('-').message(`file watcher will start within [[5]] seconds`).print()
      await sleep(5000)
      this.setupFileWatcher()
    }
  }

  async initState() {
    logger.info.tag('load default settings').appendDivider('-').message('read default setting').print()
  }

  async getSettingsState() {
    const { options: settingsFromCommand, hasConfig: hasConfigFromCommand } = getSettingFromCommand()
    if (hasConfigFromCommand) {
      logger.info.tag('read settings').appendDivider('-').message(`parsing setting options from [[command line]]
      
${Object.entries(settingsFromCommand).map(([key, value]) => `🔸 [[${key}]]  ${value}`).join('\n')}

`).print()
    }
    else {
      logger.info.tag('read settings').appendDivider('-').message('no setting options found in [[command line]]').print()
    }

    await sleep(1000)

    const { options: settingsFromEnv, hasConfig: hasConfigFromEnv } = getSettingFromEnv(this.defaultSettings.env)
    if (hasConfigFromEnv) {
      logger.info.tag('read settings').appendDivider('-').message(`reading setting options from [[.env]] file\
      
${Object.entries(settingsFromEnv).map(([key, value]) => `🔸 [[${key}]]  ${value}`).join('\n')}

`).print()
    }
    else {
      logger.info.tag('read settings').appendDivider('-').message('no setting options found in [[.env]] file').print()
    }

    this.mergedSettings = {
      ...this.defaultSettings,
      ...settingsFromEnv,
      ...settingsFromCommand,
    }

    await sleep(1000)

    logger.info.tag('merge settings').appendDivider('-')
      .message(`merging settings from [[command line]] and [[.env file]],
       
${Object.entries(this.mergedSettings).map(([key, value]) => `🔸 [[${key}]]  ${value}`).join('\n')}

‼️notice‼️ the settings in [[command line]] will [[override]] the settings in [[.env file]]`)
      .print()
  }

  async validateSettingsState() {
    const { unset: unsetSettings, invalid: invalidSettings } = validateSettings(this.mergedSettings)
    this.needToCompleteSettings = Array.from(new Set([...unsetSettings, ...invalidSettings]))

    if (this.mergedSettings.tasks && this.mergedSettings.tasks.length > 0) {
      if (!this.mergedSettings.tasks.includes('extract')) {
        this.needToCompleteSettings = this.needToCompleteSettings.filter(option => !['pattern', 'exts', 'dirs'].includes(option))
      }

      if (!this.mergedSettings.tasks.includes('translate')) {
        this.needToCompleteSettings = this.needToCompleteSettings.filter(option => !['provider', 'languages'].includes(option))
      }
    }

    if (this.needToCompleteSettings.length > 0) {
      logger.error.tag('validate settings').appendDivider('-')
        .message(`👋 please provide the following settings :      

🔸 missing settings: ${unsetSettings.length > 0 ? (`${unsetSettings.map(text => `[[${text}]]`).join(' ')}`) : 'none'}
🔸 invalid settings: ${invalidSettings.length > 0 ? (`${invalidSettings.map(text => `[[${text}]]`).join(' ')}`) : 'none'}

‼️notice‼️️ program will flow into [[inquirer process]] to complete them`)
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
    logger.info.tag('confirm final settings').message(`the final settings as following
    
${Object.entries(this.finalSettings).map(([key, value]) => `🔸 [[${key}]]  ${value}`).join('\n')}

`).prependDivider('-').appendDivider('-').print()
  }

  async extractKeysState(verboseMode = true) {
    try {
      let allKeys: any[] = []
      logger.info.tag('launch scan').message(`Use RegExp ${chalk.underline.yellow(this.finalSettings.pattern)} to match`).print(verboseMode)
      for (const dirPath of this.finalSettings.dirs) {
        const extractor = new Extractor(this.finalSettings.pattern, dirPath, this.finalSettings.exts)
        extractor.setVerboseMode(verboseMode)
        const keys = await extractor.run()
        allKeys = allKeys.concat(keys)
        await sleep(1000)
      }
      this.sortedKeys = allKeys.sort()
      console.log(`\n`)
      logger.info.tag('report result').message(`🥳 Found [[${this.sortedKeys.length}]] keys in total`).appendDivider().print()
      if (this.sortedKeys.length > 0) {
        logger.success.tag('list keys').message(`👉 Extracted keys list:
${chunkArray(this.sortedKeys, 6).map((chunk: string[]) => `${chunk.map(item => `[[${item}]]`).join(' / ')}`).join('\n')}
      \n`,
        ).appendDivider().print()
      }
    }
    catch (error) {
      logger.error.tag('extract error').message(`${chalk.bgRed.white(' Error ')} Extracting keys failed:`).data(error).print()
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
      logger.success.tag('save result').message(`Extracted keys written to ${chalk.underline.yellow(this.finalSettings.output)}`).appendDivider('-').print()
    }
    catch (error) {
      logger.error.tag('save result error').message(`${chalk.bgRed.white(' Error ')} Writing extracted keys failed:`).appendDivider('-').print()
      process.exit(1)
    }
  }

  setupFileWatcher() {
    const watcher = chokidar.watch(this.finalSettings.dirs, {
      ignored: /(^|[/\\])\../, // ignore dotfiles
      persistent: true,
    })

    console.log('\n')
    logger.info.tag('monitor changes').time(true).prependDivider('-').appendDivider('-').message(`👁️Watching for files changes in ${chalk.underline.yellow(this.finalSettings.dirs.join(', '))} ...`).print()

    watcher.on('change', async (path) => {
      logger.info.tag('detect changes').time(true).message(`file ${chalk.underline.yellow(path)} has been changed`).appendDivider('-').print()
      this.finalSettings.tasks.includes('extract') && await this.extractKeysState(false)
      this.saveResultState()
      this.finalSettings.tasks.includes('translate') && await this.translateFilesState()
    })

    watcher.on('error', (error) => {
      logger.error.tag('monitor error').time(true).message(`Watcher error: ${error}`).print()
    })
  }

  async translateFilesState() {
    if (!this.finalSettings.key) {
      logger.error.tag('check API key').message(`Key is not provided`).print()
    }
    const providerMap = new Map([
      ['deepseek', DeepseekTranslator],
      ['openai', OpenAITranslator],
    ])
    const Provider = providerMap.get(this.finalSettings.provider)
    if (!Provider) {
      logger.error.tag('load translate provider').message(`Provider [[${this.finalSettings.provider}]] not found`).appendDivider('-').print()
      return
    }
    const translator = new (Provider)(this.finalSettings.key, this.finalSettings.output)
    await translator.run(this.finalSettings.languages)
  }
}
