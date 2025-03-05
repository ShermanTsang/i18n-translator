import { logger } from '@shermant/logger'
import chalk from 'chalk'
import ora, { type Color, type Ora } from 'ora'
import { sleep } from './utils'

export class Spinner {
  private spinner: Ora | undefined = undefined
  private dealy: number = 0
  private text: string = ''
  private color: Color = 'yellow'
  private detail: string = ''
  private prefixText: string | undefined = undefined
  private stringIcon: string | undefined = undefined
  private state: 'start' | 'stop' | 'succeed' | 'fail' | undefined = undefined

  constructor(prefixText?: string, stringIcon?: string) {
    this.prefixText = prefixText
    this.stringIcon = stringIcon
    this.create()
    return this
  }

  private create() {
    logger.info.divider('-')
    this.spinner = ora()
    this.spinner.start()

    if (this.prefixText) {
      const iconPart = this.stringIcon ? `${this.stringIcon}  ` : ''
      const textPart = chalk.cyan(`[${this.capitalize(this.prefixText)} ${iconPart}]`)
      this.spinner.prefixText = this.decorateText(textPart)
    }

    return this
  }

  private capitalize(text: string) {
    return text.charAt(0).toUpperCase() + text.slice(1)
  }

  private decorateText(text: string = '') {
    return logger(text).toString()
  }

  setText(text: string = '') {
    if (!this.spinner) {
      return this
    }
    this.text = text
    return this
  }

  setDetail(detail: string = '') {
    if (!this.spinner) {
      return this
    }
    this.detail = detail
    return this
  }

  setDelay(delay: number) {
    if (!this.spinner) {
      return this
    }
    this.dealy = delay
    return this
  }

  setColor(color: Color) {
    if (!this.spinner) {
      return this
    }
    this.color = color
    return this
  }

  async update(): Promise<void> {
    if (!this.spinner) {
      return
    }

    let finalText = `${this.decorateText(this.capitalize(this.text))}`
    if (this.detail.length > 0) {
      finalText += `\n${this.decorateText(this.detail)}`
    }
    this.text = finalText

    if (this.state) {
      this.changeState(this.state, this.text)
    }
    else {
      this.spinner.text = this.text
    }

    if (this.color && this.spinner) {
      this.spinner.color = this.color
    }

    if (this.dealy > 0) {
      await sleep(this.dealy)
    }
  }

  setState(state: 'start' | 'stop' | 'succeed' | 'fail') {
    this.state = state
    return this
  }

  private changeState(state: 'start' | 'stop' | 'succeed' | 'fail', text?: string) {
    if (!this.spinner) {
      return this
    }

    switch (state) {
      case 'start':
        this.spinner.start(text)
        break
      case 'stop':
        this.stop()
        break
      case 'succeed':
        this.succeed(text)
        break
      case 'fail':
        this.fail(text)
        break
    }

    this.state = undefined
  }

  private stop() {
    if (!this.spinner) {
      return this
    }
    this.spinner.stop()
    this.spinner = undefined
    return this
  }

  private succeed(text: string = '') {
    if (!this.spinner) {
      return this
    }
    this.spinner.succeed(this.decorateText(text))
    this.spinner = undefined
    return this
  }

  private fail(text: string = '') {
    if (!this.spinner) {
      return this
    }
    this.spinner.fail(this.decorateText(text))
    this.spinner = undefined
    return this
  }
}
