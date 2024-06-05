import { promises as fs } from 'node:fs'
import * as path from 'node:path'

async function walk(dir: string, extensions: string[], fileList = []) {
  const files = await fs.readdir(dir, { withFileTypes: true })
  for (const file of files) {
    const filePath = path.resolve(dir, file.name)
    if (file.isDirectory()) {
      console.log(`Walking into ${filePath}`)
      fileList = await walk(filePath, extensions, fileList)
    }
    else if (extensions.includes(path.extname(file.name))) {
      console.log(`Processing file ${file.name}`)
      fileList.push(filePath)
    }
  }
  return fileList
}

export async function extractTranslationKeys(directory: string) {
  const keys = []
  const extensions = ['.js', '.ts', '.jsx', '.tsx', '.vue']
  const files = await walk(directory, extensions)

  for (const filePath of files) {
    const content = await fs.readFile(filePath, 'utf-8')
    console.log(`Extracting keys from ${filePath}`)
    const regex = /t\('([^']+)'\)/g
    let readText: any
    // eslint-disable-next-line no-cond-assign
    while ((readText = regex.exec(content)) !== null) {
      keys.push(readText[1])
      console.log(`Found key: ${readText[1]}`)
    }
  }
  return keys
}

export default { extractTranslationKeys }
