import * as fs from 'node:fs'
import * as path from 'node:path'
import { cwd } from 'node:process'
import prompts from 'prompts'
import chalk from 'chalk'
import { extractTranslationKeys, transformArrayToObject } from './core'
import { createRegexFromTemplate, getSubdirectories, isDirectoryExists } from './utils'

(async () => {
  const currentDirectory = cwd()
  const subdirectories = getSubdirectories(currentDirectory)

  const { pattern, directories, fileExtType, specifiedFileExt, outputPath } = await prompts([
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
      type: 'select',
      name: 'fileExtType',
      message: 'Would you prefer to extract keys from specified files or all files?',
      choices: [
        { title: 'all', value: 'all' },
        { title: 'specified', value: 'specified' },
      ],
      default: 'all',
    },
    {
      type: (prev: 'all' | 'specified') => prev === 'specified' ? 'autocompleteMultiselect' : null,
      name: 'specifiedFileExt',
      message: 'Select the file extensions to extract keys from',
      choices: [
        { title: '.js', value: '.js' },
        { title: '.ts', value: '.ts' },
        { title: '.jsx', value: '.jsx' },
        { title: '.tsx', value: '.tsx' },
        { title: '.vue', value: '.vue' },
        { title: '.html', value: '.html' },
        { title: '.txt', value: '.txt' },
        { title: '.py', value: '.py' },
        { title: '.css', value: '.css' },
        { title: '.scss', value: '.scss' },
        { title: '.json', value: '.json' },
        { title: '.xml', value: '.xml' },
        { title: '.md', value: '.md' },
        { title: '.yml', value: '.yml' },
        { title: '.ini', value: '.ini' },
        { title: '.sh', value: '.sh' },
        { title: '.bat', value: '.bat' },
        { title: '.rb', value: '.rb' },
        { title: '.php', value: '.php' },
        { title: '.java', value: '.java' },
        { title: '.c', value: '.c' },
        { title: '.cpp', value: '.cpp' },
        { title: '.cs', value: '.cs' },
        { title: '.go', value: '.go' },
        { title: '.rs', value: '.rs' },
        { title: '.swift', value: '.swift' },
        { title: '.kt', value: '.kt' },
        { title: '.dart', value: '.dart' },
        { title: '.r', value: '.r' },
        { title: '.pl', value: '.pl' },
        { title: '.lua', value: '.lua' },
        { title: '.sql', value: '.sql' },
      ],
      initial: 'all',
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
  ])

  if (directories?.length > 0) {
    try {
      let allKeys = []
      for (const directoryPath of directories) {
        const keys = await extractTranslationKeys(
          pattern,
          directoryPath,
          fileExtType === 'specified' ? specifiedFileExt : [],
        )
        allKeys = allKeys.concat(keys)
      }
      const sortedKeys = allKeys.sort()
      console.log(`${chalk.bgGreen.white(' Resulting ')} Found ${chalk.underline.yellow(sortedKeys.length)} keys in total`)

      const objectContent = transformArrayToObject(sortedKeys)

      try {
        if (!isDirectoryExists(path.dirname(outputPath))) {
          fs.mkdirSync(path.dirname(outputPath), { recursive: true })
        }
        fs.writeFileSync(outputPath, JSON.stringify(objectContent, null, 2))
        console.log(`${chalk.bgGreen.white(' Saving ')} Extracted keys saved to ${chalk.underline.yellow(outputPath)}`)
      }
      catch (error) {
        console.error(`${chalk.bgRed.white(' Error ')} Writing extracted keys failed:`, error)
      }
    }
    catch (error) {
      console.error(`${chalk.bgRed.white(' Error ')} Extracting keys failed:`, error)
    }
  }
})()
