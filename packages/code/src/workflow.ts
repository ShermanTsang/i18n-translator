import { logger } from '@shermant/logger'
import chalk from 'chalk'
import * as chokidar from 'chokidar'
import * as process from 'node:process'
import {
  defaultSettings,
  getSettingFromCommand,
  getSettingFromEnv,
  getSettingFromInquirer,
  standardizeOptions,
  validateSettings,
} from './configurator/index.ts'
import { Extractor } from './extractor/index.ts'
import { Spinner } from './spinner.ts'
import type { Translator as TranslatorProvider } from './translator/index.ts'
import { Translator } from './translator/index.ts'
import { DeepSeekReasonerTranslator, DeepSeekChatTranslator, OpenAITranslator } from './translator/providers.ts'
import { chunkArray, isDirectoryExists, sleep, transformArrayToObject } from './utils.ts'
import path from 'node:path'
import fs from 'node:fs'

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

  async run() {
    await this.initState()
    await this.getSettingsState()
    await this.validateSettingsState()
    await this.finalizeSettingsState()

    if (this.finalSettings.tasks.includes('extract')) {
      await this.extractKeysState()
      await this.saveResultState()
    }

    if (this.finalSettings.tasks.includes('translate')) {
      await this.translateFilesState()
    }

    if (this.finalSettings.watch) {
      await this.watchState()
    }
  }

  async initState() {
    const spinner = new Spinner('init program', '🙌')

    await spinner
      .setText(`

      👋 Hi, this is a tool named @shermant/[[i18n-translator]]
      😉 This tool can help you [[extract]] and [[translate]] i18n text. 
      
      `)
      .setDelay(1200)
      .update()

    await spinner
      .setText(`init workflow succeed`)
      .setState('succeed')
      .update()
  }

  async getSettingsState() {
    const { options: settingsFromCommand, hasConfig: hasConfigFromCommand } = getSettingFromCommand()

    const spinner = new Spinner('read settings', '⚙️')
    await spinner
      .setText('start reading settings')
      .setDelay(300)
      .setColor('yellow')
      .update()

    if (hasConfigFromCommand) {
      await spinner
        .setText(`parsing setting options from [[command line]]`)
        .setDetail(`${Object.entries(settingsFromCommand).map(([key, value]) => `🔸 [[${key}]]  ${value}`).join('\n')}`)
        .setDelay(300)
        .setColor('yellow')
        .update()
    }
    else {
      await spinner
        .setText(`parsing setting options from [[command line]]`)
        .setDetail('no setting options found in command line')
        .setDelay(300)
        .setColor('red')
        .update()
    }

    const { options: settingsFromEnv, hasConfig: hasConfigFromEnv } = getSettingFromEnv(this.defaultSettings.env)
    if (hasConfigFromEnv) {
      await spinner
        .setColor('yellow')
        .setText('parsing setting options from [[.env]] file')
        .setDetail(`${Object.entries(settingsFromEnv).map(([key, value]) => `🔸 [[${key}]]  ${value}`).join('\n')}`)
        .update()
    }
    else {
      await spinner
        .setColor('red')
        .setText('parsing setting options from [[.env]] file')
        .setDetail('no setting options found in .env file')
        .setState('fail')
        .update()
    }

    this.mergedSettings = {
      ...this.defaultSettings,
      ...settingsFromEnv,
      ...settingsFromCommand,
    }

    const mergedSettings = `[[notice]]: the settings in [[command line]] will [[override]] the settings in [[.env file]]
${Object.entries(this.mergedSettings).map(([key, value]) => `🔸 [[${key}]]  ${value}`).join('\n')}`

    await spinner
      .setText(`merging settings from [[command line]] and [[.env file]]`)
      .setDetail(mergedSettings)
      .setDelay(300)
      .setColor('yellow')
      .setState('succeed')
      .update()
  }

  async validateSettingsState() {
    const { unset: unsetSettings, invalid: invalidSettings } = validateSettings(this.mergedSettings)
    this.needToCompleteSettings = Array.from(new Set([...unsetSettings, ...invalidSettings]))

    const spinner = new Spinner('validate settings', '✍️')

    await spinner
      .setText('start validating settings')
      .setDelay(300)
      .setColor('yellow')
      .update()

    if (this.mergedSettings.tasks && this.mergedSettings.tasks.length > 0) {
      if (!this.mergedSettings.tasks.includes('extract')) {
        this.needToCompleteSettings = this.needToCompleteSettings.filter(option => !['pattern', 'exts', 'dirs'].includes(option))
      }

      if (!this.mergedSettings.tasks.includes('translate')) {
        this.needToCompleteSettings = this.needToCompleteSettings.filter(option => !['provider', 'languages'].includes(option))
      }
    }

    if (this.needToCompleteSettings.length > 0) {
      await spinner
        .setText('👋 please provide the following settings')
        .setDetail(`🔸 missing settings: ${unsetSettings.length > 0 ? (`${unsetSettings.map(text => `[[${text}]]`).join(' ')}`) : 'none'}\n🔸 invalid settings: ${invalidSettings.length > 0 ? (`${invalidSettings.map(text => `[[${text}]]`).join(' ')}`) : 'none'}`)
        .setState('succeed')
        .update()

      await this.completeSettingsState()
    }
    else {
      await spinner
        .setText('all required settings are complete')
        .setState('succeed')
        .setDelay(300)
        .update()
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

  async finalizeSettingsState() {
    const spinner = new Spinner('finalize settings', '📌')
    await spinner.setText('start finalizing settings').setDelay(300).setColor('yellow').update()
    this.finalSettings = standardizeOptions(this.mergedSettings as Setting.InputOptions)
    await spinner.setText('the final settings as following').setDetail(`${Object.entries(this.finalSettings).map(([key, value]) => `🔸 [[${key}]]  ${value}`).join('\n')}`).setDelay(300).setState('succeed').update()
  }

  async extractKeysState() {
    const spinner = new Spinner('extract keys', '🔎')
    await spinner.setText('start extracting keys').setDelay(300).setDetail(`Use RegExp ${chalk.underline.yellow(this.finalSettings.pattern)} to match`).update()

    try {
      let allKeys: any[] = []
      for (const dirPath of this.finalSettings.dirs) {
        const extractor = new Extractor(
          this.finalSettings.pattern,
          dirPath,
          this.finalSettings.exts,
          spinner,
        )
        const keys = await extractor.run()
        allKeys = allKeys.concat(keys)
        await sleep(1000)
      }
      this.sortedKeys = allKeys.sort()

      await spinner
        .setText(`🥳 Found [[${this.sortedKeys.length || 0}]] keys in total`)
        .setState('succeed')
        .setDetail(`${chunkArray(this.sortedKeys, 6).map((chunk: string[]) => `${chunk.map(item => `[[${item}]]`).join(' / ')}`).join('\n')}`)
        .update()
    }
    catch (error) {
      await spinner
        .setText(`👋 something went wrong when extracting keys, please check your settings`)
        .setState('fail')
        .update()
      process.exit(1)
    }
  }

  async saveResultState() {
    const spinner = new Spinner('save result', '📝')
    await spinner.setText('start saving result').setDelay(300).update()
    const objectContent = transformArrayToObject(this.sortedKeys)
    try {
      if (!isDirectoryExists(path.dirname(this.finalSettings.output))) {
        fs.mkdirSync(path.dirname(this.finalSettings.output), { recursive: true })
      }
      fs.writeFileSync(this.finalSettings.output, JSON.stringify(objectContent, null, 2))
      await spinner
        .setText(`Extracted keys are written to ${chalk.underline.yellow(this.finalSettings.output)}`)
        .setState('succeed')
        .setDelay(300)
        .update()
    }
    catch (error) {
      await spinner
        .setText(`${chalk.bgRed.white(' Error ')} Writing extracted keys failed.`)
        .setState('fail')
        .update()
      process.exit(1)
    }
  }

  async setupFileWatcher() {
    console.clear()
    const spinner = new Spinner('watching files changes', '👁️')
    const watcher = chokidar.watch(this.finalSettings.dirs, {
      ignored: /(^|[/\\])\../,
      persistent: true,
    })

    await spinner
      .setText(`watching for files changes in ${chalk.underline.yellow(this.finalSettings.dirs.join(', '))} ...`)
      .setColor('yellow')
      .update()

    watcher.on('change', async (path) => {
      await spinner.setText(`file ${chalk.underline.yellow(path)} has been changed`).setState('succeed').setColor('yellow').update()
      this.finalSettings.tasks.includes('extract') && await this.extractKeysState()
      await this.saveResultState()
      this.finalSettings.tasks.includes('translate') && await this.translateFilesState()
    })

    watcher.on('error', async (error) => {
      await spinner
        .setText(`Watcher error: ${error}`)
        .setState('fail')
        .update()
      process.exit(1)
    })
  }

  async translateFilesState() {
    const spinner = new Spinner('translate files', '🪢')

    await spinner
      .setText(`the process includes ${Object.keys(Translator.processes).map(process => `[[${String(process).toLowerCase()}]] `).join(' / ')}`)
      .setDelay(300)
      .update()
    if (!this.finalSettings.key) {
      await spinner
        .setText('Key is not provided')
        .setState('fail')
        .update()
      process.exit(1)
    }
    const providerMap = new Map<string, new (apiKey: string, inputFilePath: string) => TranslatorProvider>([
      ['openai', OpenAITranslator],
      ['deepseek-reasoner', DeepSeekReasonerTranslator],
      ['deepseek-chat', DeepSeekChatTranslator],
    ])
    const Provider = providerMap.get(this.finalSettings.provider)
    if (!Provider) {
      await spinner
        .setText(`Provider [[${this.finalSettings.provider}]] not found`)
        .setState('fail')
        .update()
      process.exit(1)
      return
    }

    await spinner.setState('succeed').update()

    const translator = new Provider(this.finalSettings.key, this.finalSettings.output)
    await translator.run(this.finalSettings.languages)
  }

  async watchState() {
    const spinner = new Spinner('file watcher', '👁️')

    await new Promise((resolve) => {
      let counter = 5
      const countdown = setInterval(async () => {
        if (counter === 0) {
          await spinner.setState('stop').update()
          clearInterval(countdown)
          resolve(null)
          return
        }
        await spinner.setText(`

          🤖 file watcher will start within [[${counter}]] seconds
          
        `).update()
        counter--
      }, 1000)
    })

    this.setupFileWatcher()
  }
}