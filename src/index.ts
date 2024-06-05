import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import { cwd } from 'node:process'
import prompts from 'prompts'
import { extractTranslationKeys } from './catchTarget'

async function getSubdirectories(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
}

(async () => {
  const currentDirectory = cwd()
  const subdirectories = await getSubdirectories(currentDirectory)

  const response = await prompts({
    type: 'multiselect',
    name: 'directories',
    message: 'Select the directories to extract translation keys from',
    choices: subdirectories.map(subdir => ({
      title: subdir,
      value: path.join(currentDirectory, subdir),
    })),
    min: 1,
  })

  const { directories } = response

  if (directories?.length > 0) {
    try {
      let allKeys = []
      for (const directoryPath of directories) {
        const keys = await extractTranslationKeys(directoryPath)
        allKeys = allKeys.concat(keys)
      }
      const sortedKeys = allKeys.sort()
      const outputPath = path.resolve(currentDirectory, 'extracted_keys.json')
      await fs.writeFile(outputPath, JSON.stringify(sortedKeys, null, 2))
      console.log(`Extracted keys saved to ${outputPath}`)
    }
    catch (error) {
      console.error('Error extracting keys:', error)
    }
  }
})()
