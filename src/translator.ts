import fs, { type PathLike } from 'node:fs'
import path from 'node:path'
import process, { cwd } from 'node:process'
import axios from 'axios'
import { logger } from '@shermant/logger'
import JSON5 from 'json5'
import cliProgress from 'cli-progress'
import chalk from 'chalk'
import { sleep } from './utils.ts'

export class Translator {
  static readonly providers = ['deepseek', 'openai']

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

  protected static readonly processes = {
    AWAIT: 0,
    REQUEST: 1,
    HANDLE_RESPONSE: 2,
    EXTRACT_JSON: 3,
    SAVE_FILE: 4,
    DONE: 5,
    ERROR: 5,
  }

  protected static readonly languageMap = new Map(Object.entries(Translator.languages))

  protected translatedContent = {} as Record<Translator.Language, Translator.JsonContent>
  private _config: Translator.Config = {
    apiKey: '',
    apiEndpoint: '',
    requestMethod: 'post',
    requestDataFunc: null,
    responseHandler: null,
    languages: [],
    inputFilePath: '',
    outputDir: '',
    originalFileContent: null,
  }

  private _response = {} as Record<Translator.Language, any>

  private progressBars = {} as Record<Translator.Language, cliProgress.SingleBar>

  constructor(apiEndpoint: string, apiKey: string, inputFilePath: string) {
    this.apiKey = apiKey
    this.apiEndpoint = apiEndpoint
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

  protected get requestMethod() {
    return this._config.requestMethod || 'post'
  }

  protected set requestMethod(method: string) {
    this._config.requestMethod = method
  }

  protected get requestDataFunc() {
    return this._config.requestDataFunc as Translator.RequestDataFunc
  }

  protected set requestDataFunc(func: Translator.RequestDataFunc) {
    this._config.requestDataFunc = func
  }

  protected get apiKey() {
    return this._config.apiKey
  }

  protected set apiKey(apiKey: string) {
    this._config.apiKey = apiKey
  }

  protected get apiEndpoint() {
    return this._config.apiEndpoint
  }

  protected set apiEndpoint(apiEndpoint: string) {
    this._config.apiEndpoint = apiEndpoint
  }

  protected get inputFilePath() {
    return this._config.inputFilePath
  }

  protected set inputFilePath(inputFilePath: string) {
    try {
      this._config.inputFilePath = path.resolve(cwd(), inputFilePath)
      this.originalFileContent = Translator.readJsonFile(inputFilePath)
    }
    catch (error) {
      logger.error.tag('Translating').message('invalid inputFilePath').data(error).print()
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

  protected get responseHandler() {
    return this._config.responseHandler as Translator.ResponseHandler
  }

  protected set responseHandler(responseHandler: (response: any) => any) {
    this._config.responseHandler = responseHandler
  }

  protected get requestData() {
    const data = {} as Record<Translator.Language, string>
    this.languages.forEach((lang) => {
      const rawData = this.requestDataFunc(lang, this.originalFileContent)

      if (rawData && typeof rawData === 'object') {
        try {
          data[lang] = JSON.stringify(rawData) as unknown as string
        }
        catch (error) {
          this.progressBars[lang].update(Translator.processes.ERROR, { lang, step: 'ERROR' })
          this.progressBars[lang].stop()
          // logger.error.tag('generate request data').message('Invalid request data').data(error).print()
          process.exit(1)
        }
      }
    })
    return data
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

    logger.info.tag('start translation').message(`🪢 the process includes ${Object.keys(Translator.processes).map(process => `[[${String(process).toLowerCase()}]] `)}`).print()

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
        { lang, step: 'AWAIT' },
      )
    })

    while (this.state !== 'DONE') {
      switch (this.state) {
        case 'REQUEST': {
          await this.request()
          break
        }
        case 'HANDLE_RESPONSE': {
          this.handleResponse()
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

  protected async request(): Promise<any> {
    for (const lang of this.languages) {
      try {
        const requestingConfig = {
          method: this._config.requestMethod || 'post',
          maxBodyLength: Infinity,
          url: this._config.apiEndpoint,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${this._config.apiKey}`,
          },
          data: this.requestData[lang],
        }
        this._response[lang] = await axios(requestingConfig)
        this.progressBars[lang].update(Translator.processes.REQUEST, { lang, step: 'REQUEST' })
        await sleep(200)
      }
      catch (error) {
        logger.error.tag('Translating').message(`Translate language [[${lang}]] request failed`).data(JSON.stringify(error)).print()
        this.state = 'ERROR'
        throw new Error(`Translate language request failed`)
      }
    }
    this.state = 'HANDLE_RESPONSE'
  }

  protected handleResponse(response: any = this._response) {
    this.languages.forEach(async (lang) => {
      if (this.responseHandler) {
        this.progressBars[lang].update(Translator.processes.HANDLE_RESPONSE, { lang, step: 'HANDLE_RESPONSE' })
        await sleep(200)
        this._response[lang] = this.responseHandler(response[lang])
      }
    })
    this.state = 'EXTRACT_JSON'
  }

  protected extractJson(rawText: Record<Translator.Language, any> = this._response) {
    this.languages.forEach(async (lang) => {
      this.progressBars[lang].update(Translator.processes.EXTRACT_JSON, { lang, step: 'EXTRACT_JSON' })
      await sleep(200)
      let content

      let match = rawText[lang].match(/\{[\s\S]*\}/)
      if (match) {
        content = match[0]
        try {
          content = JSON5.parse(content)
        }
        catch (error) {
          content = null
        }
      }
      else {
        match = rawText[lang].match(/```json\n([\s\S]*?)\n```/)
        if (match) {
          content = match[1]

          try {
            content = JSON5.parse(content)
          }
          catch (error) {
            content = null
          }
        }
        else {
          content = null
        }
      }

      this.translatedContent[lang] = content
    })

    this.state = 'SAVE_FILE'
  }

  protected saveTranslatedFile() {
    this.languages.forEach(async (lang) => {
      this.progressBars[lang].update(Translator.processes.SAVE_FILE, { lang, step: 'SAVE_FILE' })
      await sleep(200)
      const filePath = path.join(this.outputDir, `lang.${lang}.json`)
      Translator.writeJsonFile(filePath, this.translatedContent[lang])

      await sleep(200)
      this.progressBars[lang].update(Translator.processes.DONE, { lang, step: 'DONE' })
      this.progressBars[lang].stop()
    })
    this.state = 'DONE'
  }
}
