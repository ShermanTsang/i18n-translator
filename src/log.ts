import type { ChalkInstance } from 'chalk'
import chalk from 'chalk'

interface LoggerParams {
  type: 'info' | 'warn' | 'error' | 'debug' | 'success' | 'failure' | 'plain'
  message: string
  tag: string
  data?: any
  displayTime?: boolean
}

function getStyledChalkInstance(styles: (keyof ChalkInstance)[], text: string) {
  return styles.reduce((accumulator, currentStyle) => {
    return (chalk[currentStyle] as ChalkInstance)(accumulator)
  }, text)
}

export class Logger {
  private _type: string
  private _message: string = ''
  private _messageStyles: (keyof ChalkInstance)[] = []
  private _tag: string | null = null
  private _tagStyles: (keyof ChalkInstance)[] = []
  private _data: any
  private _displayTime: boolean = false
  private _prependDivider: boolean = false
  private _prependDividerStyles: (keyof ChalkInstance)[] = []
  private _prependDividerLength: number = 1
  private _prependDividerChar: string = '-'
  private _appendDivider: boolean = false
  private _appendDividerStyles: (keyof ChalkInstance)[] = []
  private _appendDividerChar: string = '-'
  private _appendDividerLength: number = 1
  private _singleDivider: boolean = false
  private _singleDividerStyles: (keyof ChalkInstance)[] = []
  private _singleDividerChar: string = '-'
  private _singleDividerLength: number = 1

  constructor(type: LoggerParams['type'] = 'debug', tagStyles: (keyof ChalkInstance)[]) {
    this._type = type
    this._tagStyles = tagStyles
  }

  private static _stylesMap: Record<LoggerParams['type'] | string, (keyof ChalkInstance)[]> = {
    info: ['bgBlueBright'],
    warn: ['bgYellowBright'],
    error: ['bgRedBright'],
    debug: ['bgCyanBright'],
    success: ['bgGreenBright'],
    failure: ['bgRedBright'],
    plain: ['white'],
  }

  static createLoggerInstance(type: LoggerParams['type']) {
    if (!(type in Logger._stylesMap)) {
      throw new Error(`Type "${type}" is not defined in Logger styles map.`)
    }
    return new this(type, Logger._stylesMap[type])
  }

  static addLoggerType(type: string, styles: (keyof ChalkInstance)[]) {
    if (type in Logger._stylesMap) {
      throw new Error(`Type "${type}" already exists in Logger styles map.`)
    }
    Logger._stylesMap[type] = styles
  }

  static get plain() {
    return this.createLoggerInstance('plain')
  }

  static get info() {
    return this.createLoggerInstance('info')
  }

  static get warn() {
    return this.createLoggerInstance('warn')
  }

  static get error() {
    return this.createLoggerInstance('error')
  }

  static get debug() {
    return this.createLoggerInstance('debug')
  }

  static get success() {
    return this.createLoggerInstance('success')
  }

  static get failure() {
    return this.createLoggerInstance('failure')
  }

  private setDividerProperties(type: 'prepend' | 'append' | 'single', char?: string, length?: number, styles?: (keyof ChalkInstance)[]) {
    const prefix = type === 'prepend' ? '_prependDivider' : type === 'append' ? '_appendDivider' : '_singleDivider'
    this[`${prefix}`] = true
    this[`${prefix}Char`] = char || this[`${prefix}Char`]
    this[`${prefix}Styles`] = styles || this[`${prefix}Styles`]
    this[`${prefix}Length`] = length || (char && char.length === 1 ? 40 : this[`${prefix}Length`])
  }

  divider(char?: string, length?: number, styles: (keyof ChalkInstance)[] = ['gray']) {
    this.setDividerProperties('single', char, length, styles)
    this.print()
  }

  prependDivider(char?: string, length?: number, styles?: (keyof ChalkInstance)[]) {
    this.setDividerProperties('prepend', char, length, styles)
    return this
  }

  appendDivider(char?: string, length?: number, styles?: (keyof ChalkInstance)[]) {
    this.setDividerProperties('append', char, length, styles)
    return this
  }

  displayTime(isShow: boolean) {
    this._displayTime = isShow
    return this
  }

  message(message: string, styles?: (keyof ChalkInstance)[]) {
    this._message = message
    styles && (this._messageStyles = styles)
    return this
  }

  tag(tag: string, styles?: (keyof ChalkInstance)[]) {
    this._tag = tag
    styles && (this._tagStyles = styles)
    return this
  }

  data(data: any) {
    this._data = data
    return this
  }

  private formatMessage() {
    let formattedMessage = this._message
    if (formattedMessage) {
      formattedMessage = formattedMessage.replace(/\[\[(.+?)\]\]/g, chalk.underline.yellow('$1'))
    }
    return getStyledChalkInstance(this._messageStyles, formattedMessage)
  }

  private formatTag() {
    if (!this._tag) {
      return ''
    }

    const tag = this._tag.trim()
    const unifiedTag = ` ${tag.charAt(0).toUpperCase()}${tag.slice(1)} `

    return getStyledChalkInstance(this._tagStyles, unifiedTag)
  }

  print() {
    if (this._singleDivider) {
      console.log(getStyledChalkInstance(this._singleDividerStyles, this._singleDividerChar.repeat(this._singleDividerLength)))
      return
    }

    const tag = this.formatTag()
    const message = this.formatMessage()
    const time = this._displayTime
      ? chalk.gray(new Date().toLocaleTimeString())
      : ''

    if (this._prependDivider) {
      console.log(getStyledChalkInstance(this._prependDividerStyles, this._prependDividerChar.repeat(this._prependDividerLength)))
    }

    const output = `${time} ${tag} ${message}`.trim()
    console.log(output)

    if (this._appendDivider) {
      console.log(getStyledChalkInstance(this._appendDividerStyles, this._appendDividerChar.repeat(this._appendDividerLength)))
    }

    if (this._data) {
      console.log(this._data)
    }
  }
}
