import { DeepSeekChatModel } from '../models/deepseek'
import { BaseTranslator } from './base'

export class DeepSeekTranslator extends BaseTranslator {
  constructor(apiKey: string, inputFilePath: string) {
    super(apiKey, inputFilePath)
    this.initializeModel()
  }

  protected initializeModel(): void {
    this.model = new DeepSeekChatModel({
      apiKey: this.apiKey,
      modelName: 'deepseek-chat',
      temperature: 0.7,
    })
  }
}
