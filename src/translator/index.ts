import { logger } from '@shermant/logger'
import chalk from 'chalk'
import cliProgress from 'cli-progress'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { sleep } from '../utils.ts'

export class Translator {
  static readonly providers = ['deepseek', 'openai']

  static readonly languages: { [key: string]: string } = {
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

  protected readonly apiKey: string
  protected readonly inputFilePath: string
  protected readonly outputDir: string

  constructor(apiKey: string, inputFilePath: string) {
    this.apiKey = apiKey
    this.inputFilePath = inputFilePath
    this.outputDir = path.dirname(inputFilePath)
  }

  async run(languages: string[]) {
    try {
      const originalFileContent = fs.readFileSync(this.inputFilePath, { encoding: 'utf-8' })
      const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
      progressBar.start(languages.length, 0)

      for (const language of languages) {
        try {
          const translatedContent = await this.translateContent(language, originalFileContent)
          const outputFilePath = path.join(this.outputDir, `${path.basename(this.inputFilePath, '.json')}.${language}.json`)
          fs.writeFileSync(outputFilePath, translatedContent)
          progressBar.increment()
          await sleep(1000)
        }
        catch (error) {
          logger.error.tag('translate error').message(`${chalk.bgRed.white(' Error ')} Translation failed for language ${language}:`).print()
          logger.error.tag('translate error').message(error as string).print()
          process.exit(1)
        }
      }

      progressBar.stop()
      logger.success.tag('translate').message(`Translation completed`).appendDivider('-').print()
    }
    catch (error) {
      logger.error.tag('translate error').message(`${chalk.bgRed.white(' Error ')} Translation failed:`).print()
      logger.error.tag('translate error').message(error as string).print()
      process.exit(1)
    }
  }

  protected async translateContent(language: string, content: string): Promise<string> {
    if (!Translator.languages[language]) {
      throw new Error(`Unsupported language: ${language}`)
    }

    try {
      const jsonContent = JSON.parse(content)
      const translatedContent = await this.translateObject(jsonContent, language)
      return JSON.stringify(translatedContent, null, 2)
    }
    catch (error) {
      throw new Error(`Failed to translate content: ${error as string}`)
    }
  }

  protected async translateObject(obj: any, language: string): Promise<any> {
    if (typeof obj === 'string') {
      // Implement actual translation logic here based on provider
      return obj // Placeholder - should be overridden by provider implementations
    }

    if (Array.isArray(obj)) {
      return Promise.all(obj.map(item => this.translateObject(item, language)))
    }

    if (typeof obj === 'object' && obj !== null) {
      const result: Record<string, any> = {}
      for (const [key, value] of Object.entries(obj)) {
        result[key] = await this.translateObject(value, language)
      }
      return result
    }

    return obj
  }
}
