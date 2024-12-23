import { ChatOpenAI } from '@langchain/openai'
import { Translator } from '.'
import { DeepSeekChatModel } from './models'

export class DeepSeekTranslator extends Translator {
  constructor(apiKey: string, inputFilePath: string) {
    super(apiKey, inputFilePath)
    this.initializeModel()
  }

  protected initializeModel(): void {
    this.model = new DeepSeekChatModel({
      apiKey: this.apiKey,
      modelName: 'deepseek-chat',
    })
  }
}

export class OpenAITranslator extends Translator {
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
