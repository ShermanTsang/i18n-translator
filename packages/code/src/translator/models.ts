import {
    BaseChatModel,
    type BaseChatModelCallOptions,
    type BaseChatModelParams
} from '@langchain/core/language_models/chat_models'
import type {BaseMessage} from '@langchain/core/messages'
import {ChatMessage} from '@langchain/core/messages'

interface DeepSeekResponse {
    choices: Array<{
        message: {
            content: string
        }
    }>
}

interface DeepseekChatModelOptions extends BaseChatModelCallOptions {
}

interface DeepseekChatModelParams extends BaseChatModelParams {
    apiKey: string
    modelName?: string
    stream?: boolean
}

class DeepSeekChatModel extends BaseChatModel<DeepseekChatModelOptions> {
    apiKey: string
    modelName: string

    constructor(fields: DeepseekChatModelParams) {
        super(fields)
        this.apiKey = fields.apiKey
        this.modelName = fields.modelName || 'deepseek-chat'
    }

    static lc_name(): string {
        return 'DeepseekChatModel'
    }

    _llmType(): string {
        return 'deepseek_chat_model'
    }

    async _generate(messages: BaseMessage[]): Promise<any> {
        // Format messages for DeepSeek API
        const formattedMessages = messages.map(msg => ({
            role: msg.getType() === 'human' ? 'user' : msg.getType(),
            content: msg.content,
        }))

        // Make API call to DeepSeek
        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: this.modelName,
                messages: formattedMessages,
                stream: false,
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

export {DeepSeekChatModel}
