namespace Setting {
  import type { PathLike } from 'node:fs'

  export type Task = 'extract' | 'translate'

  export interface Options {
    tasks: Task[]
    env: string
    pattern: RegExp
    dirs: string[]
    exts: string[]
    output: string
    watch: boolean
    languages: Translator.Language[]
    provider: Translator.Provider
    key: string
  }

  export interface InputOptions {
    tasks: string[] | string
    env: string | PathLike
    pattern: string
    dirs: string[] | string
    exts: string[] | string
    output: string | PathLike
    watch: boolean
    languages: Translator.Language[] | string
    provider: Translator.Provider | string
    key: string
  }

  export type OptionsInputKeys = keyof InputOptions
  export type OptionsKeys = keyof Options

  export type OptionsInputKeysExcept<T> = Exclude<Setting.OptionsInputKeys, T>

  export type NullableInputOptions = {
    [key in OptionsKeys]: InputOptions[key] | null
  }

  export interface SourceCheckResult {
    hasConfig: boolean
    options: {
      [key in InputOptions]: InputOptions[key]
    }
  }

  export interface ValueValidateResult {
    unset: Setting.OptionsInputKeysExcept<'env'>[]
    invalid: Setting.OptionsInputKeysExcept<'env'>[]
  }

  export type Provider = 'openai' | 'deepseek-r1' | 'deepseek-v3'
}
