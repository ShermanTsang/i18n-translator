import { ChatOpenAI } from '@langchain/openai'
import { Translator } from '.'
import { ChatDeepSeek } from '@langchain/deepseek'

export class DeepSeekChatTranslator extends Translator {
  constructor(apiKey: string, inputFilePath: string) {
    super(apiKey, inputFilePath)
    this.initializeModel()
  }

  protected initializeModel(): void {
    this.model = new ChatDeepSeek({
      apiKey: this.apiKey,
      modelName: 'deepseek-chat',
    })
  }
}

export class DeepSeekReasonerTranslator extends Translator {
  constructor(apiKey: string, inputFilePath: string) {
    super(apiKey, inputFilePath)
    this.initializeModel()
  }

  protected initializeModel(): void {
    this.model = new ChatDeepSeek({
      apiKey: this.apiKey,
      modelName: 'deepseek-reasoner'
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
