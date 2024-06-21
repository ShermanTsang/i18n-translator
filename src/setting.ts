import path from 'node:path'
import { cwd } from 'node:process'
import prompts, { type PromptObject } from 'prompts'
import chalk from 'chalk'
import { createRegexFromTemplate, getFileExtensionStatistics, getSubdirectories } from './utils.ts'

export async function inquireSetting() {
  const currentDirectory = cwd()
  const subdirectories = getSubdirectories(currentDirectory)
  const questions: PromptObject<string>[] = [
    {
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
    {
      type: 'multiselect',
      name: 'directories',
      message: 'Select the directories to extract translation keys from',
      choices: subdirectories.map(subDir => ({
        title: subDir,
        value: path.join(currentDirectory, subDir),
        disabled: !!subDir.includes('node_modules'),
      })),
      min: 1,
    },
    {
      type: 'autocompleteMultiselect',
      name: 'specifiedFileExt',
      message: 'Select the file extensions to extract keys from',
      choices: (directories: string[]) => {
        const extensionStatistics = getFileExtensionStatistics(directories)
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
    {
      name: 'outputPath',
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
  ]
  const { pattern, directories, specifiedFileExt, outputPath } = await prompts(questions)
  return { pattern, directories, specifiedFileExt, outputPath }
}
