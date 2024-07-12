import fs, { type PathLike } from 'node:fs'
import path from 'node:path'
import { cwd } from 'node:process'
import axios from 'axios'
import { logger } from '@shermant/logger'
import JSON5 from 'json5'

export class Translator {
  protected static languageMap = new Map(Object.entries({
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
  }))

  protected translatedContent: Translator.JsonContent = {}
  private _config: Translator.Config = {
    apiKey: '',
    apiEndpoint: '',
    requestMethod: 'post',
    requestDataFunc: null,
    responseHandler: null,
    lang: null,
    inputFilePath: '',
    outputFilePath: '',
    originalFileContent: null,
  }

  private _response: any = null

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
    logger.info.tag('Translating').message(`start process [[${String(state).replace('_', ' ')}]]`).time().print()
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
      throw new Error('Invalid input file path')
    }
  }

  protected get outputFilePath() {
    if (!this._config.outputFilePath && this.inputFilePath) {
      this.outputFilePath = this.inputFilePath.replace('.json', `-${this.lang}.json`)
    }
    return this._config.outputFilePath
  }

  protected set outputFilePath(outputFilePath: string) {
    this._config.outputFilePath = outputFilePath
  }

  protected get originalFileContent() {
    return this._config.originalFileContent as string
  }

  protected set originalFileContent(originalFileContent) {
    this._config.originalFileContent = originalFileContent
  }

  protected get lang() {
    return this._config.lang as Translator.Language
  }

  protected set lang(lang: Translator.Language) {
    this._config.lang = lang
  }

  protected get responseHandler() {
    return this._config.responseHandler as Translator.ResponseHandler
  }

  protected set responseHandler(responseHandler: (response: any) => any) {
    this._config.responseHandler = responseHandler
  }

  protected get requestData() {
    const rawData = this.requestDataFunc(this.lang, this.originalFileContent)
    let data = ''

    if (rawData && typeof rawData === 'object') {
      try {
        data = JSON.stringify(rawData) as unknown as string
      }
      catch (error) {
        this.state = 'ERROR'
        throw new Error('Invalid request data')
      }
    }

    return data
  }

  static readJsonFile(filePath: PathLike): string {
    return fs.readFileSync(filePath, 'utf8')
  }

  static writeJsonFile(filePath: PathLike, content: Translator.JsonContent): void {
    const data = JSON.stringify(content, null, 2)
    fs.writeFileSync(filePath, data, 'utf8')
  }

  async translate(lang: Translator.Language) {
    this.lang = lang

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
        data: this.requestData,
      }
      this._response = await axios(requestingConfig)
      this.state = 'HANDLE_RESPONSE'
    }
    catch (error) {
      logger.error.tag('Translator').message('Translation request failed').data(error).print()
      throw error
    }
  }

  protected handleResponse(response: any = this._response) {
    this._response = this.responseHandler(response)
    this.state = 'EXTRACT_JSON'
  }

  protected extractJson(rawText: string = this._response) {
    let content = null

    let match = rawText.match(/\{[\s\S]*\}/)
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
      match = rawText.match(/```json\n([\s\S]*?)\n```/)
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

    this.translatedContent = content
    this.state = 'SAVE_FILE'
  }

  protected saveTranslatedFile() {
    Translator.writeJsonFile(this.outputFilePath, this.translatedContent)
    this.state = 'DONE'
  }
}
