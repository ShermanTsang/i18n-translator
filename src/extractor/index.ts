import chalk from 'chalk'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { Spinner } from '../spinner'

export class Extractor {
  private state: Extractor.State = 'INIT'
  private context: Extractor.Context

  constructor(private pattern: RegExp, private directory: string, private extensions: string[], private spinner: Spinner) {
    this.context = {
      keys: [],
      files: [],
      currentFileIndex: 0,
      currentFindKeys: [],
      currentContent: '',
    }
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
          await this.logResults()
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
        await this.spinner
          .setText(`Walk into directory ${chalk.underline.yellow(filePath)}`)
          .setDelay(300)
          .update()
        fileList = await this.walk(filePath, extensions, fileList)
      }
      else if (extensions.includes(path.extname(file.name))) {
        await this.spinner
          .setText(`Add file ${chalk.underline.yellow(file.name)} to process list`)
          .setDelay(300)
          .update()
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

    await this.spinner
      .setText(`Scan keys from ${chalk.underline.yellow(filePath)}`)
      .setDelay(300)
      .update()
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

  private async logResults() {
    const currentFindKeys = this.context.currentFindKeys

    if (currentFindKeys.length > 0) {
      await this.spinner
        .setText(`Find key: ${
                currentFindKeys.map(key => chalk.underline.yellow(key)).join(', ')
            }`)
        .setDelay(300)
        .update()
    }
    else if (this.context.currentContent) {
      await this.spinner.setText(`No matched key`).setDelay(300).update()
    }
    else {
      await this.spinner.setText(`The file is empty`).setDelay(300).update()
    }

    this.context.currentFileIndex += 1
    this.state = 'READ_FILE'
  }
}
