import { DeepseekTranslator } from './providers/deepseek.ts'

const providerMap = new Map([
  ['deepseek', DeepseekTranslator],
])
const Provider = providerMap.get('deepseek')
if (Provider) {
  const translator = new (Provider)('sk-5805cac20c694c498aad2d5386e877fa', './.output/lang.json')

  await translator.translate(['zh-TW', 'fr'])
}
