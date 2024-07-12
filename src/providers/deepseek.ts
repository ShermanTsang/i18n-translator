import { Translator } from '../translator.ts'

export class DeepseekTranslator extends Translator {
  constructor(apiKey: string, inputFilePath: string) {
    super(
      'https://api.deepseek.com/chat/completions',
      apiKey,
      inputFilePath,
    )

    this.requestDataFunc = (lang, originalFileContent) => {
      return {
        messages: [
          {
            content: 'You are a translator to help my translate the json file written in english to another language',
            role: 'system',
          },
          {
            content: `target language is:${Translator.languageMap.get(lang)}`,
            role: 'user',
          },
          {
            content: `json file content is:\n${originalFileContent}`,
            role: 'user',
          },
        ],
        model: 'deepseek-coder',
        frequency_penalty: 0,
        max_tokens: 2048,
        presence_penalty: 0,
        stop: null,
        stream: false,
        temperature: 1,
        top_p: 1,
        logprobs: false,
        top_logprobs: null,
      }
    }

    this.responseHandler = (response) => {
      return response.data.choices[0].message.content
    }
  }
}
