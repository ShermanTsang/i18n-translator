import { promises as fs } from 'node:fs'
import path from 'node:path'
import chalk from 'chalk'
import { logger } from '@shermant/logger'

export class Extractor {
  private state: Extractor.State = 'INIT'
  private context: Extractor.Context
  private verboseMode: boolean = true

  constructor(private pattern: RegExp, private directory: string, private extensions: string[]) {
    this.context = {
      keys: [],
      files: [],
      currentFileIndex: 0,
      currentFindKeys: [],
      currentContent: '',
    }
  }

  setVerboseMode(mode: boolean) {
    this.verboseMode = mode
  }

  async run() {
    while (this.state !== 'DONE') {
      switch (this.state) {
        case 'INIT':
          await this.init()
          break
        case 'READ_FILE':
          await this.readFile()
          break
        case 'PROCESS_CONTENT':
          this.processContent()
          break
        case 'LOG_RESULTS':
          this.logResults()
          break
      }
    }
    return this.context.keys
  }

  private async walk(dir: string, extensions: string[] = [], fileList: string[]) {
    const files = await fs.readdir(dir, { withFileTypes: true })
    for (const file of files) {
      const filePath: string = path.resolve(dir, file.name)
      if (file.isDirectory()) {
        logger.info.tag(' Traversing ').message(`Walk into directory ${chalk.underline.yellow(filePath)}`).appendDivider('-').print(this.verboseMode)
        fileList = await this.walk(filePath, extensions, fileList)
      }
      else if (extensions.includes(path.extname(file.name))) {
        // logger.info.tag(' Traversing ').message(`Add file ${chalk.underline.yellow(file.name)} to process list`).print(this.verboseMode)
        fileList.push(filePath)
      }
    }
    return fileList
  }

  private async init() {
    this.context.files = await this.walk(this.directory, this.extensions, [])
    this.state = this.context.files.length > 0 ? 'READ_FILE' : 'DONE'
  }

  private async readFile() {
    if (this.context.currentFileIndex >= this.context.files.length) {
      this.state = 'DONE'
      return
    }

    const filePath = this.context.files[this.context.currentFileIndex]
    this.context.currentContent = await fs.readFile(filePath, 'utf-8')
    this.state = 'PROCESS_CONTENT'

    logger.info.tag('processing').message(`Scan keys from [[${filePath}]]`).print(this.verboseMode)
  }

  private processContent() {
    const content = this.context.currentContent
    this.context.currentFindKeys = []

    if (content) {
      const matches = content.matchAll(this.pattern)
      for (const match of matches) {
        this.context.keys.push(match[1])
        this.context.currentFindKeys.push(match[1])
      }
    }

    this.state = 'LOG_RESULTS'
  }

  private logResults() {
    const currentFindKeys = this.context.currentFindKeys

    if (currentFindKeys.length > 0) {
      logger.success.tag('Locating').message(`Find key: ${
                currentFindKeys.map(key => chalk.underline.yellow(key)).join(', ')
            }`).print(this.verboseMode)
    }
    else if (this.context.currentContent) {
      logger.info.tag('Locating').message(`No matched key`).print(this.verboseMode)
    }
    else {
      logger.warn.tag('Checking').message(`The file is empty`).print(this.verboseMode)
    }

    this.verboseMode && logger.plain.divider('-')
    this.context.currentFileIndex += 1
    this.state = 'READ_FILE'
  }
}
