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
