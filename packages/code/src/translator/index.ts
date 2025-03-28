import type {BaseLanguageModel} from '@langchain/core/language_models/base'
import {ChatPromptTemplate} from '@langchain/core/prompts'
import {logger} from '@shermant/logger'
import chalk from 'chalk'
import cliProgress from 'cli-progress'
import JSON5 from 'json5'
import fs, {type PathLike} from 'node:fs'
import path from 'node:path'
import process, {cwd} from 'node:process'
import {sleep} from '../utils.ts'

export abstract class Translator {
    static readonly providers = [
        'deepseek-chat',
        'deepseek-reasoner',
        'openai'
    ]

    static readonly languages = {
        'en': 'English',
        'fr': 'French',
        'de': 'German',
        'es': 'Spanish',
        'zh': 'Chinese (Simplified)',
        'zh-TW': 'Chinese (Traditional)',
        'ja': 'Japanese',
        'ko': 'Korean',
        'ru': 'Russian',
        'pt': 'Portuguese',
        'it': 'Italian',
        'ar': 'Arabic',
        'sv': 'Swedish',
        'nl': 'Dutch',
        'pl': 'Polish',
        'cs': 'Czech',
        'tr': 'Turkish',
        'ro': 'Romanian',
        'hu': 'Hungarian',
        'el': 'Greek',
        'vi': 'Vietnamese',
        'th': 'Thai',
        'id': 'Indonesian',
        'ms': 'Malay',
        'da': 'Danish',
        'fi': 'Finnish',
        'no': 'Norwegian',
        'sk': 'Slovak',
        'hr': 'Croatian',
        'sl': 'Slovenian',
        'et': 'Estonian',
        'lv': 'Latvian',
        'lt': 'Lithuanian',
        'hi': 'Hindi',
        'bn': 'Bengali',
        'he': 'Hebrew',
        'ur': 'Urdu',
        'fa': 'Persian',
        'te': 'Telugu',
        'ta': 'Tamil',
        'ml': 'Malayalam',
        'kn': 'Kannada',
        'as': 'Assamese',
        'mr': 'Marathi',
    }

    static readonly prompts = ChatPromptTemplate.fromMessages([
        ['system', `You are a translator to help user translate the json file from source language to target language.
      \n User will provide target language and json file content. 
      \n You need to detect the source language of the json file and translate it to the target language.`],
        ['user', 'Target language is: {language}'],
        ['user', 'Json file content is:\n{content}'],
    ])
    static readonly processes = {
        AWAIT: 0,
        REQUEST: 1,
        EXTRACT_JSON: 2,
        SAVE_FILE: 3,
        DONE: 4,
        ERROR: 4,
    }
    protected static readonly languageMap = new Map(Object.entries(Translator.languages))
    protected model!: BaseLanguageModel
    protected translatedContent = {} as Record<Translator.Language, Translator.JsonContent>
    private _config: Translator.Config = {
        apiKey: '',
        languages: [],
        inputFilePath: '',
        outputDir: '',
        originalFileContent: null,
    }
    private _response = {} as Record<Translator.Language, any>
    private progressBars = {} as Record<Translator.Language, cliProgress.SingleBar>

    constructor(apiKey: string, inputFilePath: string) {
        this.apiKey = apiKey
        this.inputFilePath = inputFilePath
    }

    private _state?: Translator.State

    protected get state() {
        if (!this._state) {
            this.state = 'REQUEST'
        }
        return this._state as Translator.State
    }

    protected set state(state: Translator.State) {
        this._state = state
    }

    protected get apiKey() {
        return this._config.apiKey
    }

    protected set apiKey(apiKey: string) {
        this._config.apiKey = apiKey
    }

    protected get inputFilePath() {
        return this._config.inputFilePath
    }

    protected set inputFilePath(inputFilePath: string) {
        try {
            this._config.inputFilePath = path.resolve(cwd(), inputFilePath)
            this.originalFileContent = Translator.readJsonFile(inputFilePath)
        } catch (error) {
            logger.error.prefix('Translating').text('invalid inputFilePath').data(error).print()
            process.exit(1)
        }
    }

    protected get outputDir() {
        if (!this._config.outputDir && this.inputFilePath) {
            this.outputDir = path.dirname(this.inputFilePath)
        }
        return this._config.outputDir
    }

    protected set outputDir(outputDir: string) {
        this._config.outputDir = outputDir
    }

    protected get originalFileContent() {
        return this._config.originalFileContent as string
    }

    protected set originalFileContent(originalFileContent) {
        this._config.originalFileContent = originalFileContent
    }

    protected get languages() {
        return this._config.languages as Translator.Language[]
    }

    protected set languages(languages: Translator.Language[]) {
        this._config.languages = languages
    }

    static readJsonFile(filePath: PathLike): string {
        return fs.readFileSync(filePath, 'utf8')
    }

    static writeJsonFile(filePath: PathLike, content: Translator.JsonContent): void {
        const data = JSON.stringify(content, null, 2)
        fs.writeFileSync(filePath, data, 'utf8')
    }

    async run(languages: Translator.Language[]) {
        this.languages = languages

        const multiBar = new cliProgress.MultiBar({
            clearOnComplete: false,
            hideCursor: true,
            format: `| ${chalk.cyan('{bar}')} | {lang} | {step}`,
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
        }, cliProgress.Presets.shades_grey)

        this.languages.forEach((lang) => {
            this.progressBars[lang] = multiBar.create(
                Math.max(Math.max(...Object.values(Translator.processes))),
                Translator.processes.AWAIT,
                {lang, step: 'AWAIT'},
            )
        })

        while (this.state !== 'DONE') {
            switch (this.state) {
                case 'REQUEST': {
                    await this.request()
                    break
                }
                case 'EXTRACT_JSON': {
                    this.extractJson()
                    break
                }
                case 'SAVE_FILE': {
                    this.saveTranslatedFile()
                    break
                }
                case 'ERROR': {
                    break
                }
                default:
                    break
            }
        }
    }

    async translateContent(language: keyof typeof Translator.languages, content: string): Promise<string> {
        const chain = Translator.prompts.pipe(this.model)
        const response = await chain.invoke({
            language: Translator.languages[language],
            content,
        })
        return response.content
    }

    protected abstract initializeModel(): void

    protected async request(): Promise<any> {
        for (const lang of this.languages) {
            try {
                this._response[lang] = await this.translateContent(lang, this.originalFileContent)
                this.progressBars[lang].update(Translator.processes.REQUEST, {lang, step: 'REQUEST'})
                await sleep(200)
            } catch (error) {
                logger.error.prefix('Translating').text(`Translate language [[${lang}]] request failed`).data(JSON.stringify(error)).print()
                this.state = 'ERROR'
                throw new Error(`Translate language request failed`)
            }
        }
        this.state = 'EXTRACT_JSON'
    }

    protected extractJson(rawText: Record<Translator.Language, any> = this._response) {
        this.languages.forEach(async (lang) => {
            this.progressBars[lang].update(Translator.processes.EXTRACT_JSON, {lang, step: 'EXTRACT_JSON'})
            await sleep(200)
            let content

            let match = rawText[lang].match(/\{[\s\S]*\}/)
            if (match) {
                content = match[0]
                try {
                    content = JSON5.parse(content)
                } catch (error) {
                    content = null
                }
            } else {
                match = rawText[lang].match(/```json\n([\s\S]*?)\n```/)
                if (match) {
                    content = match[1]

                    try {
                        content = JSON5.parse(content)
                    } catch (error) {
                        content = null
                    }
                } else {
                    content = null
                }
            }

            this.translatedContent[lang] = content
        })

        this.state = 'SAVE_FILE'
    }

    protected saveTranslatedFile() {
        this.languages.forEach(async (lang) => {
            this.progressBars[lang].update(Translator.processes.SAVE_FILE, {lang, step: 'SAVE_FILE'})
            await sleep(200)
            const filePath = path.join(this.outputDir, `lang.${lang}.json`)
            Translator.writeJsonFile(filePath, this.translatedContent[lang])

            await sleep(200)
            this.progressBars[lang].update(Translator.processes.DONE, {lang, step: 'DONE'})
            this.progressBars[lang].stop()
        })
        this.state = 'DONE'
    }
}
