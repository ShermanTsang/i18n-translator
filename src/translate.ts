import { DeepseekTranslator } from './providers/deepseek.ts'

const translator = new DeepseekTranslator(
  'sk-5805cac20c694c498aad2d5386e877fa',
  './src/lang.json',
)
await translator.translate('fr')
