namespace Setting {
  import type { PathLike } from 'node:fs'

  export interface Options {
    env: string
    pattern: RegExp
    dirs: string[]
    exts: string[]
    output: string
    watch: boolean
  }

  export interface InputOptions {
    env: string | PathLike
    pattern: string
    dirs: string[] | string
    exts: string[] | string
    output: string | PathLike
    watch: boolean
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
}

namespace Extractor {
  export type State = 'INIT' | 'READ_FILE' | 'PROCESS_CONTENT' | 'LOG_RESULTS' | 'DONE'

  export interface Context {
    keys: string[]
    files: string[]
    currentFileIndex: number
    currentFindKeys: string[]
    currentContent: string
  }
}
