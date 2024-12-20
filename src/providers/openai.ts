import { Translator } from '../translator.ts'

export class OpenAITranslator extends Translator {
  constructor(apiKey: string, inputFilePath: string) {
    super(
      'https://api.openai.com/v1/chat/completions',
      apiKey,
      inputFilePath,
    )

    this.requestDataFunc = (lang, originalFileContent) => {
      return {
        messages: [
          {
            content: 'You are a translator to help me translate the json file written in english to another language',
            role: 'system',
          },
          {
            content: `target language is: ${Translator.languageMap.get(lang)}`,
            role: 'user',
          },
          {
            content: `json file content is:\n${originalFileContent}`,
            role: 'user',
          },
        ],
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        stream: false,
      }
    }

    this.responseHandler = (response) => {
      return response.data.choices[0].message.content
    }
  }
}
