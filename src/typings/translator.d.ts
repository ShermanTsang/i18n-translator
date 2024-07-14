namespace Translator {
  export type State =
    | 'REQUEST'
    | 'HANDLE_RESPONSE'
    | 'EXTRACT_JSON'
    | 'SAVE_FILE'
    | 'ERROR'
    | 'DONE'

  export type Provider = 'deepseek'

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
    languages: Language[] | []
    inputFilePath: string
    outputDir: string
    originalFileContent: string | null
  }
}
