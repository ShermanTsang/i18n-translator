namespace Setting {
  import type { PathLike } from 'node:fs'

  export interface Options {
    env: string
    pattern: RegExp
    dirs: string[]
    exts: string[]
    output: string
    watch: boolean
  }

  export interface InputOptions {
    env: string | PathLike
    pattern: string
    dirs: string[] | string
    exts: string[] | string
    output: string | PathLike
    watch: boolean
  }

  export type OptionsInputKeys = keyof InputOptions
  export type OptionsKeys = keyof Options

  export type OptionsInputKeysExcept<T> = Exclude<Setting.OptionsInputKeys, T>

  export type NullableInputOptions = {
    [key in OptionsKeys]: InputOptions[key] | null
  }

  export interface SourceCheckResult {
    hasConfig: boolean
    options: {
      [key in InputOptions]: InputOptions[key]
    }
  }

  export interface ValueValidateResult {
    unset: Setting.OptionsInputKeysExcept<'env'>[]
    invalid: Setting.OptionsInputKeysExcept<'env'>[]
  }
}

namespace Extractor {
  export type State = 'INIT' | 'READ_FILE' | 'PROCESS_CONTENT' | 'LOG_RESULTS' | 'DONE'

  export interface Context {
    keys: string[]
    files: string[]
    currentFileIndex: number
    currentFindKeys: string[]
    currentContent: string
  }
}

namespace Translator {
  export type State =
    | 'REQUEST'
    | 'HANDLE_RESPONSE'
    | 'EXTRACT_JSON'
    | 'SAVE_FILE'
    | 'ERROR'
    | 'DONE'

  export interface LanguageFullName {
    'en': 'English'
    'fr': 'French'
    'de': 'German'
    'es': 'Spanish'
    'zh': 'Chinese (Simplified)'
    'zh-TW': 'Chinese (Traditional)'
    'ja': 'Japanese'
    'ko': 'Korean'
    'ru': 'Russian'
    'pt': 'Portuguese'
    'it': 'Italian'
    'ar': 'Arabic'
    'sv': 'Swedish'
    'nl': 'Dutch'
    'pl': 'Polish'
    'cs': 'Czech'
    'tr': 'Turkish'
    'ro': 'Romanian'
    'hu': 'Hungarian'
    'el': 'Greek'
    'vi': 'Vietnamese'
    'th': 'Thai'
    'id': 'Indonesian'
    'ms': 'Malay'
    'da': 'Danish'
    'fi': 'Finnish'
    'no': 'Norwegian'
    'sk': 'Slovak'
    'hr': 'Croatian'
    'sl': 'Slovenian'
    'et': 'Estonian'
    'lv': 'Latvian'
    'lt': 'Lithuanian'
    'hi': 'Hindi'
    'bn': 'Bengali'
    'he': 'Hebrew'
    'ur': 'Urdu'
    'fa': 'Persian'
    'te': 'Telugu'
    'ta': 'Tamil'
    'ml': 'Malayalam'
    'kn': 'Kannada'
    'as': 'Assamese'
    'mr': 'Marathi'
  }

  export type Language = keyof LanguageFullName

  export interface JsonContent {
    [key: string]: string | JsonContent
  }

  export type RequestDataFunc = (lang: Language, originalFileContent: string) => Record<string, any>

  export type ResponseHandler = (response: any) => any

  export interface Config {
    apiKey: string
    apiEndpoint: string
    requestMethod?: string
    requestDataFunc: RequestDataFunc | null
    responseHandler: ResponseHandler | null
    lang: Language | null
    inputFilePath: string
    outputFilePath: string
    originalFileContent: string | null
  }
}
