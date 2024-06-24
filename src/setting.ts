import path from 'node:path'
import * as process from 'node:process'
import { cwd } from 'node:process'
import * as fs from 'node:fs'
import prompts, { type PromptObject } from 'prompts'
import chalk from 'chalk'
import { Command } from 'commander'
import * as dotenv from 'dotenv'
import { createRegexFromTemplate, getFileExtensionStatistics, getSubdirs } from './utils.ts'

export function pickSettingOptions(rawOptions: Record<string, any>): Setting.InputOptions {
  const requiredOptions: (Setting.OptionsKeys)[] = ['pattern', 'dirs', 'env', 'exts', 'output']
  return <Setting.InputOptions>Object.keys(rawOptions).reduce((acc, key) => {
    if (requiredOptions.includes(key as Setting.OptionsKeys)) {
      acc[key] = rawOptions[key]
    }
    return acc
  }, {} as Record<string, any>)
}

export async function getSettingFromInquirer(targetOptions: Setting.OptionsInputKeysExcept<'env'>[] = []): Promise<Setting.SourceCheckResult> {
  const currentDirectory = cwd()
  const subdirs = getSubdirs(currentDirectory)
  const questions: PromptObject<string>[] = []

  const presetQuestions: Record<Setting.OptionsInputKeysExcept<'env'>, PromptObject<string>> = {
    pattern: {
      type: 'text',
      name: 'pattern',
      message: `Enter the pattern to search for, use ${chalk.yellow.underline('%key%')} to match variable`,
      initial: `t('%key%')`,
      validate: (value: string | null) => {
        if (!value || value.length === 0) {
          return false
        }
        return value.includes('%key%')
      },
      format: (value: string) => createRegexFromTemplate(value),
    },
    dirs: {
      type: 'multiselect',
      name: 'dirs',
      message: 'Select the dirs to extract translation keys from',
      choices: subdirs.map(subDir => ({
        title: subDir,
        value: path.join(currentDirectory, subDir),
        disabled: Boolean(subDir.includes('node_modules')),
      })),
      min: 1,
    },
    exts: {
      type: 'autocompleteMultiselect',
      name: 'exts',
      message: 'Select the file extensions to extract keys from',
      choices: (dirs: string[]) => {
        const extensionStatistics = getFileExtensionStatistics(dirs)
        const totalFiles = Object.values(extensionStatistics).reduce((acc, curr) => acc + curr, 0)
        return Object.keys(extensionStatistics).map((ext) => {
          const stat = chalk.gray(`${extensionStatistics[ext]} count(s) / ${(extensionStatistics[ext] / totalFiles * 100).toFixed(2)}%`)
          return {
            title: `${ext}  ${stat}`,
            value: ext,
            selected: true,
            disabled: extensionStatistics[ext] === 0,
          }
        })
      },
    },
    output: {
      name: 'output',
      type: 'text',
      message: 'Enter the output path for the extracted keys',
      initial: path.resolve(currentDirectory, '.output/lang.json'),
      validate: (value: string | null) => {
        if (!value || value.length === 0) {
          return false
        }
        return value.includes('.')
      },
    },
  }

  for (const key of targetOptions) {
    if (key in presetQuestions) {
      questions.push(presetQuestions[key])
    }
  }

  const options = await prompts(questions) as Setting.InputOptions
  return { hasConfig: true, options }
}

export function getSettingFromCommand(): Setting.SourceCheckResult {
  const program = new Command()

  program
    .option('--env <env>', '.env file path')
    .option('-p, --pattern <pattern>', 'pattern to match')
    .option('-d, --dirs <dirs...>', 'directories to match')
    .option('-e, --exts <exts...>', 'extensions to match')
    .option('-o, --output <output>', 'output lang files path', '.output/lang.json')
    .parse(process.argv)

  const options = pickSettingOptions(program.opts() || {})

  return { hasConfig: Reflect.ownKeys(options).length > 0, options }
}

export function getSettingFromEnv(filePath: fs.PathLike | undefined | string = path.resolve(process.cwd(), '.env')): Setting.SourceCheckResult {
  let [hasConfig, options] = [false, {}]
  if (filePath && fs.existsSync(filePath)) {
    const unifiedPath = path.resolve(filePath as string)
    const allOptions = dotenv.config({ path: unifiedPath }).parsed || {}
    options = pickSettingOptions(Object.fromEntries(
      Object.entries(allOptions).map(([key, value]) => [key.toLowerCase(), value]),
    ),
    )
    hasConfig = true
  }
  return <Setting.SourceCheckResult>{
    hasConfig,
    options,
  }
}

export function checkSettingsCompletion(settings: Setting.NullableInputOptions): Setting.OptionsKeys[] {
  const unsetSettings: Setting.OptionsKeys[] = []

  Object.keys(settings).forEach((key) => {
    if (!settings[key as Setting.OptionsKeys]) {
      unsetSettings.push(key as Setting.OptionsKeys)
    }
  })

  return unsetSettings
}

export function standardizeOptions(options: Setting.InputOptions): Setting.Options {
  const standardizedOptions: Setting.Options = { ...options as unknown as Setting.Options }

  if (Object.prototype.toString.call(options.pattern) !== '[object RegExp]') {
    standardizedOptions.pattern = createRegexFromTemplate(options.pattern)
  }

  if (typeof options.dirs === 'string') {
    if (options.dirs.includes(',')) {
      options.dirs = options.dirs.split(',').map(dir => dir.trim())
    }
    else {
      options.dirs = [options.dirs.trim()]
    }
  }

  if (typeof options.exts === 'string') {
    if (options.exts.includes(',')) {
      options.exts = options.exts.split(',').map(ext => ext.trim())
    }
    else {
      options.exts = [options.exts.trim()]
    }
  }

  if (typeof options.output === 'string') {
    options.output = path.resolve(options.output)
  }

  if (typeof options.env === 'string') {
    options.env = path.resolve(options.env)
  }

  return standardizedOptions
}
