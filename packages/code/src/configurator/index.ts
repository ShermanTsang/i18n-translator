import {logger} from '@shermant/logger'
import chalk from 'chalk'
import {Command} from 'commander'
import * as dotenv from 'dotenv'
import type {PathLike} from 'node:fs'
import * as fs from 'node:fs'
import path from 'node:path'
import * as process from 'node:process'
import {cwd} from 'node:process'
import prompts, {type PromptObject} from 'prompts'
import {Translator} from '../translator/index.ts'
import {createRegexFromTemplate, getFileExtensionStatistics, getSubDirs} from '../utils.ts'

export const defaultSettings = {
    tasks: null,
    env: path.resolve(process.cwd(), '.env'),
    pattern: null,
    output: null,
    dirs: null,
    exts: null,
    watch: false,
    languages: null,
    provider: null,
    key: null,
}

export const settingKeys = Object.keys(defaultSettings)

export function pickSettingOptions(rawOptions: Record<string, any>, prefix?: string): Setting.InputOptions {
    const requiredOptions: string[] = settingKeys
    return <Setting.InputOptions>Object.keys(rawOptions).reduce((acc, key) => {
        const matchingKey = prefix ? key.replace(prefix, '') : key
        if (requiredOptions.includes(matchingKey as Setting.OptionsKeys)) {
            acc[matchingKey] = rawOptions[key]
        }
        return acc
    }, {} as Record<string, any>)
}

export async function getSettingFromInquirer(targetOptions: Setting.OptionsInputKeysExcept<'env'>[] = [], currentOptions = {} as Setting.NullableInputOptions): Promise<Setting.SourceCheckResult> {
    const currentDirectory = cwd()
    const subDirs = getSubDirs(currentDirectory)
    const questions: PromptObject<string>[] = []

    const presetQuestions: Record<Setting.OptionsInputKeysExcept<'env'>, PromptObject<string>> = {
        tasks: {
            type: 'multiselect',
            name: 'tasks',
            message: 'Select the tasks to run',
            instructions: false,
            choices: [
                {
                    title: '🔎 Search and extract i18n keys',
                    value: 'extract',
                    selected: true,
                    description: 'from the given pattern you provided',
                },
                {
                    title: '📚 Translate lang files',
                    value: 'translate',
                    selected: true,
                    description: 'via AI translation services',
                },
            ],
        },
        pattern: {
            type: (_prev, values) => {
                if (!values.tasks?.includes('extract')) {
                    return null
                }
                return 'text'
            },
            name: 'pattern',
            message: `Enter the pattern to search for, use ${chalk.yellow.underline('%key%')} to express ${chalk.yellow.underline('variables')}`,
            initial: `t('%key%')`,
            instructions: true,
            validate: (value: string | null) => {
                if (!value || value.length === 0) {
                    return false
                }
                return value.includes('%key%')
            },
            format: (value: string) => createRegexFromTemplate(value),
        },
        dirs: {
            type: (_prev, values) => {
                if (!values.tasks?.includes('extract')) {
                    return null
                }
                return 'multiselect'
            },
            name: 'dirs',
            message: 'Select the dirs to extract translation keys from',
            instructions: false,
            choices: subDirs.map(subDir => ({
                title: subDir,
                value: path.join(currentDirectory, subDir),
                disabled: Boolean(subDir.includes('node_modules')),
            })),
            min: 1,
        },
        exts: {
            type: (_prev, values) => {
                if (!values.tasks?.includes('extract')) {
                    return null
                }
                return 'autocompleteMultiselect'
            },
            name: 'exts',
            message: 'Select the file extensions to extract keys from',
            instructions: false,
            choices: (dirs: string[]) => {
                const extensionStatistics = getFileExtensionStatistics(dirs || currentOptions.dirs)
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
            instructions: true,
            validate: (value: string | null) => {
                if (!value || value.length === 0) {
                    return false
                }
                return value.includes('.')
            },
        },
        watch: {
            type: 'toggle',
            name: 'watch',
            message: 'Enable watching mode',
            initial: true,
            active: 'yes',
            inactive: 'no',
        },
        languages: {
            type: (_prev, values) => {
                if (!values.tasks?.includes('translate')) {
                    return null
                }
                return 'autocompleteMultiselect'
            },
            name: 'languages',
            message: 'Select the languages to translate',
            instructions: false,
            choices: Object.entries(Translator.languages).map(([abbr, language]) => ({
                title: language,
                value: abbr,
            })),
            min: 1,
        },
        provider: {
            type: (_prev, values) => {
                if (!values.tasks?.includes('translate')) {
                    return null
                }
                return 'select'
            },
            name: 'provider',
            message: 'Choose the translation provider',
            instructions: true,
            choices: Translator.providers.map(provider => ({
                title: provider,
                value: provider,
            })),
        },
        key: {
            type: (_prev, values) => {
                if (!values.tasks?.includes('translate')) {
                    return null
                }
                return 'text'
            },
            name: 'key',
            message: 'Enter the translation service key',
        },
    }

    for (const key of Object.keys(presetQuestions)) {
        const questionName = key as Setting.OptionsInputKeysExcept<'env'>
        if (targetOptions.includes(questionName)) {
            questions.push(presetQuestions[questionName])
        }
    }

    const options = await prompts(questions, {
        onCancel: () => {
            logger.failure.prefix('exit program').text('User cancelled the operation').print()
            process.exit(1)
        },
    }) as Setting.InputOptions

    return {hasConfig: true, options}
}

export function getSettingFromCommand(): Setting.SourceCheckResult {
    const program = new Command()

    program
        .option('--env <env>', '.env file path')
        .option('-t, --tasks <tasks...>', 'service tasks')
        .option('-p, --pattern <pattern>', 'pattern to match')
        .option('-d, --dirs <dirs...>', 'directories to match')
        .option('-e, --exts <exts...>', 'extensions to match')
        .option('-o, --output <output>', 'output lang files path', '.output/lang.json')
        .option('-l, --langs <languages...>', 'target translating languages')
        .option('-pr, --provider <provider>', 'translating service provider')
        .option('-k, --key <key>', 'translating service API key')
        .option('-v, --verbose <key>', 'print the details of processing for debugging', false)
        .option('--watch', 'enable watching mode', true)
        .parse(process.argv)

    const options = pickSettingOptions(program.opts() || {})

    return {hasConfig: Reflect.ownKeys(options).length > 0, options}
}

export function getSettingFromEnv(filePath: PathLike | null): Setting.SourceCheckResult {
    let [hasConfig, options] = [false, {}]
    if (filePath && fs.existsSync(filePath)) {
        const unifiedPath = path.resolve(filePath as string)
        const allOptions = dotenv.config({path: unifiedPath}).parsed || {}
        options = pickSettingOptions(
            Object.fromEntries(
                Object.entries(allOptions).map(([key, value]) => [key.toLowerCase(), value]),
            ),
            'translator_',
        )
        hasConfig = true
    }
    return <Setting.SourceCheckResult>{
        hasConfig,
        options,
    }
}

export function validateSettings(options: Setting.NullableInputOptions): Setting.ValueValidateResult {
    const unsetSettings = [] as Setting.OptionsInputKeysExcept<'env'>[]
    const invalidSettings = [] as Setting.OptionsInputKeysExcept<'env'>[]

    Object.keys(options).forEach((key) => {
        if (!options[key as Setting.OptionsKeys]) {
            unsetSettings.push(key as Setting.OptionsInputKeysExcept<'env'>)
        }
    })

    if (options.tasks && typeof options.tasks === 'string') {
        options.tasks = options.tasks.split(',').map(task => task.trim()) as Setting.Options['tasks']
        for (const task of options.tasks) {
            if (!(['extract', 'translate']).includes(task)) {
                invalidSettings.push('tasks')
                break
            }
        }
    }

    if (options.pattern && !options.pattern.includes('%key%')) {
        invalidSettings.push('pattern')
    }

    return {
        unset: unsetSettings,
        invalid: invalidSettings,
    }
}

export function standardizeOptions(options: Setting.NullableInputOptions): Setting.Options {
    const standardizedOptions: Setting.Options = {...options as unknown as Setting.Options}

    if (options.pattern && Object.prototype.toString.call(options.pattern) !== '[object RegExp]') {
        standardizedOptions.pattern = createRegexFromTemplate(options.pattern) as RegExp
    }

    if (options.tasks && typeof options.tasks === 'string') {
        if (options.tasks.includes(',')) {
            standardizedOptions.tasks = options.tasks.split(',').map(dir => dir.trim()) as Setting.Options['tasks']
        } else {
            standardizedOptions.tasks = [options.tasks.trim()] as Setting.Options['tasks']
        }
    }

    if (options.dirs && typeof options.dirs === 'string') {
        if (options.dirs.includes(',')) {
            standardizedOptions.dirs = options.dirs.split(',').map(dir => dir.trim())
        } else {
            standardizedOptions.dirs = [options.dirs.trim()]
        }
    }

    if (options.exts && typeof options.exts === 'string') {
        if (options.exts.includes(',')) {
            standardizedOptions.exts = options.exts.split(',').map((ext) => {
                return ext.trim().startsWith('.') ? ext : `.${ext}`
            })
        } else {
            standardizedOptions.exts = [options.exts.trim().startsWith('.') ? options.exts : `.${options.exts}`]
        }
    } else if (Array.isArray(options.exts)) {
        standardizedOptions.exts = options.exts.map((ext) => {
            return ext.trim().startsWith('.') ? ext : `.${ext}`
        })
    }

    if (options.languages && typeof options.languages === 'string') {
        if (options.languages.includes(',')) {
            standardizedOptions.languages = options.languages.split(',').map((lang) => {
                return lang.trim().toLowerCase()
            }) as Translator.Language[]
        } else {
            standardizedOptions.languages = [options.languages.trim().toLowerCase()] as Translator.Language[]
        }
    } else if (Array.isArray(options.languages)) {
        standardizedOptions.languages = options.languages.map((lang) => {
            return lang.trim().toLowerCase()
        }) as Translator.Language[]
    }

    if (options.output && typeof options.output === 'string') {
        standardizedOptions.output = path.resolve(options.output)
    }

    if (options.env && typeof options.env === 'string') {
        standardizedOptions.env = path.resolve(options.env)
    }

    return standardizedOptions
}
