import { BaseChatModel, type BaseChatModelCallOptions, type BaseChatModelParams } from '@langchain/core/language_models/chat_models'
import type { BaseMessage } from '@langchain/core/messages'
import { ChatMessage } from '@langchain/core/messages'

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

interface DeepseekChatModelOptions extends BaseChatModelCallOptions {}

interface DeepseekChatModelParams extends BaseChatModelParams {
  apiKey: string
  modelName?: string
  temperature?: number
}

class DeepSeekChatModel extends BaseChatModel<DeepseekChatModelOptions> {
  apiKey: string
  modelName: string
  temperature: number

  _llmType(): string {
    return 'deepseek_chat_model'
  }

  static lc_name(): string {
    return 'DeepseekChatModel'
  }

  constructor(fields: DeepseekChatModelParams) {
    super(fields)
    this.apiKey = fields.apiKey
    this.modelName = fields.modelName || 'deepseek-chat'
    this.temperature = fields.temperature || 0.7
  }

  async _generate(messages: BaseMessage[]): Promise<any> {
    // Format messages for DeepSeek API
    const formattedMessages = messages.map(msg => ({
      role: msg._getType(),
      content: msg.content,
    }))

    // Make API call to DeepSeek
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.modelName,
        messages: formattedMessages,
        temperature: this.temperature,
      }),
    })

    const result = (await response.json()) as DeepSeekResponse
    return {
      generations: [{
        text: result.choices[0].message.content,
        message: new ChatMessage({
          content: result.choices[0].message.content,
          role: 'assistant',
        }),
      }],
    }
  }
}

export { DeepSeekChatModel }
