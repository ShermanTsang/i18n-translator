import type { BaseLanguageModel } from '@langchain/core/language_models/base'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { Translator } from '../index.ts'

export abstract class BaseTranslator extends Translator {
  protected model!: BaseLanguageModel
  protected prompt: ChatPromptTemplate

  constructor(apiKey: string, inputFilePath: string) {
    super(apiKey, inputFilePath)

    this.prompt = ChatPromptTemplate.fromMessages([
      ['system', 'You are a translator to help user translate the json file written in english to another language, user will input target language and json file content'],
      ['user', 'Target language is: {language}'],
      ['user', 'Json file content is:\n{content}'],
    ])
  }

  protected abstract initializeModel(): void

  async translateContent(language: string, content: string): Promise<string> {
    const chain = this.prompt.pipe(this.model)
    const response = await chain.invoke({
      language: Translator.languages[language],
      content,
    })
    return response.content
  }
}
