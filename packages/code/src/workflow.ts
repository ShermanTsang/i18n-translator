import {logger, StreamLogger} from '@shermant/logger'
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
} from './configurator'
import {Extractor} from './extractor'
import type {Translator as TranslatorProvider} from './translator/index.ts'
import {Translator} from './translator'
import {DeepSeekChatTranslator, DeepSeekReasonerTranslator, OpenAITranslator} from './translator/providers.ts'
import {chunkArray, isDirectoryExists, sleep, transformArrayToObject} from './utils.ts'
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
        const spinner = new StreamLogger('[ 🙌 init program ]', ['cyan', 'bold'])

        await spinner
            .text(`

      👋 Hi, this is a tool named @shermant/[[i18n-translator]]
      😉 This tool can help you [[extract]] and [[translate]] i18n text. 
      
      `)
            .delay(1200)
            .asyncUpdate()

        spinner.text(`init workflow succeed`).state('succeed').update()
    }

    async getSettingsState() {
        const {options: settingsFromCommand, hasConfig: hasConfigFromCommand} = getSettingFromCommand()

        const spinner = new StreamLogger('[ ⚙️ read settings ]', ['cyan', 'bold'])
        await spinner
            .text('start reading settings')
            .delay(300)
            .asyncUpdate()

        if (hasConfigFromCommand) {
            await spinner
                .text(`parsing setting options from [[command line]]`)
                .detail(`${Object.entries(settingsFromCommand).map(([key, value]) => `🔸 [[${key}]]  ${value}`).join('\n')}`)
                .delay(300)
                .asyncUpdate()
        } else {
            await spinner
                .text(`parsing setting options from [[command line]]`)
                .detail('no setting options found in command line')
                .delay(300)
                .asyncUpdate()
        }

        const {options: settingsFromEnv, hasConfig: hasConfigFromEnv} = getSettingFromEnv(this.defaultSettings.env)
        if (hasConfigFromEnv) {
            spinner
                .text('parsing setting options from [[.env]] file')
                .detail(`${Object.entries(settingsFromEnv).map(([key, value]) => `🔸 [[${key}]]  ${value}`).join('\n')}`)
                .update()
        } else {
            spinner
                .text('parsing setting options from [[.env]] file')
                .detail('no setting options found in .env file')
                .state('fail')
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
            .text(`merging settings from [[command line]] and [[.env file]]`)
            .detail(mergedSettings)
            .delay(300)
            .state('succeed')
            .asyncUpdate()
    }

    async validateSettingsState() {
        const {unset: unsetSettings, invalid: invalidSettings} = validateSettings(this.mergedSettings)
        this.needToCompleteSettings = Array.from(new Set([...unsetSettings, ...invalidSettings]))

        const spinner = new StreamLogger('[ ✍️ validate settings ]', ['cyan', 'bold'])

        await spinner
            .text('start validating settings')
            .delay(300)
            .asyncUpdate()

        if (this.mergedSettings.tasks && this.mergedSettings.tasks.length > 0) {
            if (!this.mergedSettings.tasks.includes('extract')) {
                this.needToCompleteSettings = this.needToCompleteSettings.filter(option => !['pattern', 'exts', 'dirs'].includes(option))
            }

            if (!this.mergedSettings.tasks.includes('translate')) {
                this.needToCompleteSettings = this.needToCompleteSettings.filter(option => !['provider', 'languages'].includes(option))
            }
        }

        if (this.needToCompleteSettings.length > 0) {
            spinner
                .text('👋 please provide the following settings')
                .detail(`🔸 missing settings: ${unsetSettings.length > 0 ? (`${unsetSettings.map(text => `[[${text}]]`).join(' ')}`) : 'none'}\n🔸 invalid settings: ${invalidSettings.length > 0 ? (`${invalidSettings.map(text => `[[${text}]]`).join(' ')}`) : 'none'}`)
                .state('succeed')
                .update()

            await this.completeSettingsState()
        } else {
            await spinner
                .text('all required settings are complete')
                .state('succeed')
                .delay(300)
                .asyncUpdate()
        }
    }

    async completeSettingsState() {
        if (this.needToCompleteSettings.length > 0) {
            try {
                const {options: settingsFromInquirer} = await getSettingFromInquirer(this.needToCompleteSettings, this.mergedSettings)
                this.mergedSettings = {
                    ...this.mergedSettings,
                    ...settingsFromInquirer,
                }
            } catch (error) {
                logger.error.prefix('error').text(`Error completing settings: ${error}`).print()
                process.exit(1)
            }
        }
    }

    async finalizeSettingsState() {
        const spinner = new StreamLogger('[ 📌 finalize settings ]', ['cyan', 'bold'])
        await spinner.text('start finalizing settings').delay(300).asyncUpdate()
        this.finalSettings = standardizeOptions(this.mergedSettings as Setting.InputOptions)
        await spinner
            .text('the final settings as following')
            .detail(`${Object.entries(this.finalSettings).map(([key, value]) => `🔸 [[${key}]]  ${value}`).join('\n')}`)
            .delay(300)
            .state('succeed')
            .asyncUpdate()
    }

    async extractKeysState() {
        const spinner = new StreamLogger('[ 🔎 extract keys ]', ['cyan', 'bold'])
        await spinner.text('start extracting keys').delay(300).detail(`Use RegExp ${chalk.underline.yellow(this.finalSettings.pattern)} to match`).asyncUpdate()

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

            spinner
                .text(`🥳 Found [[${this.sortedKeys.length || 0}]] keys in total`)
                .state('succeed')
                .detail(`${chunkArray(this.sortedKeys, 6).map((chunk: string[]) => `${chunk.map(item => `[[${item}]]`).join(' / ')}`).join('\n')}`)
                .update()
        } catch (error) {
            spinner
                .text(`👋 something went wrong when extracting keys, please check your settings`)
                .state('fail')
                .update()
            process.exit(1)
        }
    }

    async saveResultState() {
        const spinner = new StreamLogger('[ 📝 save result ]', ['cyan', 'bold'])
        await spinner.text('start saving result').delay(300).asyncUpdate()
        const objectContent = transformArrayToObject(this.sortedKeys)
        try {
            if (!isDirectoryExists(path.dirname(this.finalSettings.output))) {
                fs.mkdirSync(path.dirname(this.finalSettings.output), {recursive: true})
            }
            fs.writeFileSync(this.finalSettings.output, JSON.stringify(objectContent, null, 2))
            await spinner
                .text(`Extracted keys are written to ${chalk.underline.yellow(this.finalSettings.output)}`)
                .state('succeed')
                .delay(300)
                .asyncUpdate()
        } catch (error) {
            await spinner
                .text(`${chalk.bgRed.white(' Error ')} Writing extracted keys failed.`)
                .state('fail')
                .asyncUpdate()
            process.exit(1)
        }
    }

    async setupFileWatcher() {
        console.clear()
        const spinner = new StreamLogger('[ 👁️ watching files changes ]', ['cyan', 'bold'])
        const watcher = chokidar.watch(this.finalSettings.dirs, {
            ignored: /(^|[/\\])\../,
            persistent: true,
        })

        spinner
            .text(`watching for files changes in ${chalk.underline.yellow(this.finalSettings.dirs.join(', '))} ...`)
            .update()

        watcher.on('change', async (path) => {
            spinner.text(`file ${chalk.underline.yellow(path)} has been changed`).state('succeed').update()
            this.finalSettings.tasks.includes('extract') && await this.extractKeysState()
            await this.saveResultState()
            this.finalSettings.tasks.includes('translate') && await this.translateFilesState()
        })

        watcher.on('error', async (error) => {
            spinner
                .text(`Watcher error: ${error}`)
                .state('fail')
                .update()
            process.exit(1)
        })
    }

    async translateFilesState() {
        const spinner = new StreamLogger('[ 🪢 translate files ]', ['cyan', 'bold'])

        await spinner
            .text(`the process includes ${Object.keys(Translator.processes).map(process => `[[${String(process).toLowerCase()}]] `).join(' / ')}`)
            .delay(300)
            .asyncUpdate()
        if (!this.finalSettings.key) {
            spinner
                .text('Key is not provided')
                .state('fail')
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
            spinner
                .text(`Provider [[${this.finalSettings.provider}]] not found`)
                .state('fail')
                .update()
            process.exit(1)
            return
        }

        spinner.state('succeed').update()

        const translator = new Provider(this.finalSettings.key, this.finalSettings.output)
        await translator.run(this.finalSettings.languages)
    }

    async watchState() {
        const spinner = new StreamLogger('[ 👁️ file watcher ]', ['cyan', 'bold'])

        await new Promise((resolve) => {
            let counter = 5
            const countdown = setInterval(async () => {
                if (counter === 0) {
                    spinner.state('stop').update()
                    clearInterval(countdown)
                    resolve(null)
                    return
                }
                spinner.text(`

          🤖 file watcher will start within [[${counter}]] seconds
          
        `).update()
                counter--
            }, 1000)
        })

        await this.setupFileWatcher()
    }
}