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

export function createRegexFromTemplate(template: string) {
  const escapedTemplate = template.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
  const regexString = escapedTemplate.replace(/%key%/g, '([^\'\"\`]+)')
  return new RegExp(regexString, 'g')
}

export default {
  isDirectoryExists,
  createDirectory,
  createRegexFromTemplate,
}
