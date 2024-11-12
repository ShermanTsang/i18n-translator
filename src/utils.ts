import * as fs from 'node:fs'
import * as path from 'node:path'

export function getSubDirs(directory: fs.PathLike) {
  const entries = fs.readdirSync(directory, { withFileTypes: true })
  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
}

export function getFileExtensionStatistics(dirs: fs.PathLike[] | string) {
  if (!Array.isArray(dirs)) {
    dirs = [path.resolve(dirs)]
  }

  const extensionStatistic: Record<string, number> = {}

  function traverseDirectory(directory: fs.PathLike) {
    const entries = fs.readdirSync(directory, { withFileTypes: true })
    entries.forEach((item) => {
      const fullPath = path.join(directory.toString(), item.name)
      if (item.isFile()) {
        const extension = path.extname(item.name)
        if (extension) {
          extensionStatistic[extension] = (extensionStatistic[extension] || 0) + 1
        }
      }
      else if (item.isDirectory()) {
        traverseDirectory(fullPath)
      }
    })
  }

  dirs.forEach((directory) => {
    traverseDirectory(directory)
  })

  return Object.fromEntries(
    Object.entries(extensionStatistic).sort(([, a], [, b]) => b - a),
  )
}

export function isDirectoryExists(directory: string) {
  try {
    fs.access(directory, fs.constants.F_OK | fs.constants.R_OK | fs.constants.W_OK, (err) => {
      if (err) {
        return false
      }
    })
  }
  catch (err) {
    return false
  }
}

export function createDirectory(targetPath: string) {
  const dirName = targetPath
  if (fs.existsSync(dirName)) {
    return true
  }
  else {
    if (createDirectory(path.dirname(dirName))) {
      fs.mkdirSync(dirName, { recursive: true })
      return true
    }
  }
}

export function isRegex(template: string) {
  return template.startsWith('/') && (template.endsWith('/') || template.endsWith('/g'))
}

export function createRegexFromTemplate(template: string) {
  let regexString = template
  if (isRegex(template)) {
    regexString = template.slice(1, template.endsWith('/g') ? -2 : -1)
  }
  else {
    // escaping special sings pattern
    regexString = template.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
  }

  regexString = regexString.replace(/%key%/g, '([^\'\"\`]+)')

  return new RegExp(regexString, 'g')
}

export function transformArrayToObject(keys: string[]) {
  return keys.reduce((acc: Record<string, any>, key) => {
    acc[key] = key
    return acc
  }, {})
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function chunkArray(array: any[], chunkSize: number) {
  return array.reduce((result, _currentValue, currentIndex) => {
    if (currentIndex % chunkSize === 0) {
      result.push(array.slice(currentIndex, currentIndex + chunkSize))
    }
    return result
  }, [])
}
