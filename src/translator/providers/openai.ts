import { ChatOpenAI } from '@langchain/openai'
import { BaseTranslator } from './base.ts'

export class OpenAITranslator extends BaseTranslator {
  constructor(apiKey: string, inputFilePath: string) {
    super(apiKey, inputFilePath)
    this.initializeModel()
  }

  protected initializeModel(): void {
    this.model = new ChatOpenAI({
      openAIApiKey: this.apiKey,
      modelName: 'gpt-3.5-turbo',
      temperature: 0.7,
    })
  }
}
