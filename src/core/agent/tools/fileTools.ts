import fs from 'fs'
import path from 'path'
import type { FileNode } from '../../../shared/types'

export function readFile(filePath: string): string {
  if (!fs.existsSync(filePath)) throw new Error(`ឯកសាររកមិនឃើញ: ${filePath}`)
  return fs.readFileSync(filePath, 'utf-8')
}

export function writeFile(filePath: string, content: string): void {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(filePath, content, 'utf-8')
}

export function editFile(filePath: string, oldContent: string, newContent: string): void {
  if (!fs.existsSync(filePath)) throw new Error(`ឯកសាររកមិនឃើញ: ${filePath}`)
  const current = fs.readFileSync(filePath, 'utf-8')
  if (!current.includes(oldContent)) throw new Error('មិនរកឃើញ Content ចាស់ក្នុងឯកសារ')
  const updated = current.replace(oldContent, newContent)
  fs.writeFileSync(filePath, updated, 'utf-8')
}

export function deleteFile(filePath: string): void {
  if (!fs.existsSync(filePath)) throw new Error(`ឯកសាររកមិនឃើញ: ${filePath}`)
  fs.unlinkSync(filePath)
}

export function createFolder(folderPath: string): void {
  fs.mkdirSync(folderPath, { recursive: true })
}

export function listFiles(dirPath: string, recursive = false, maxDepth = 3): FileNode[] {
  if (!fs.existsSync(dirPath)) return []

  function walk(dir: string, depth: number): FileNode[] {
    if (depth > maxDepth) return []
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    const nodes: FileNode[] = []

    const IGNORE = new Set([
      'node_modules', '.git', 'dist', 'build', '.next', '__pycache__',
      '.cache', 'coverage', '.nyc_output', 'vendor',
    ])

    for (const entry of entries) {
      if (IGNORE.has(entry.name)) continue
      const fullPath = path.join(dir, entry.name)
      const stat = fs.statSync(fullPath)
      if (entry.isDirectory()) {
        nodes.push({
          name: entry.name,
          path: fullPath,
          type: 'directory',
          children: recursive ? walk(fullPath, depth + 1) : [],
          modifiedAt: stat.mtime.toISOString(),
        })
      } else {
        nodes.push({
          name: entry.name,
          path: fullPath,
          type: 'file',
          size: stat.size,
          extension: path.extname(entry.name).slice(1),
          modifiedAt: stat.mtime.toISOString(),
        })
      }
    }
    return nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
  }

  return walk(dirPath, 0)
}

export function searchCode(dirPath: string, query: string, extensions?: string[]): Array<{ file: string; line: number; content: string }> {
  const results: Array<{ file: string; line: number; content: string }> = []
  const IGNORE = new Set(['node_modules', '.git', 'dist', 'build'])

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (IGNORE.has(entry.name)) continue
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else {
        const ext = path.extname(entry.name).slice(1)
        if (extensions && !extensions.includes(ext)) continue
        try {
          const lines = fs.readFileSync(fullPath, 'utf-8').split('\n')
          lines.forEach((line, i) => {
            if (line.toLowerCase().includes(query.toLowerCase())) {
              results.push({ file: fullPath, line: i + 1, content: line.trim() })
            }
          })
        } catch {
          // Skip binary files
        }
      }
    }
  }

  walk(dirPath)
  return results.slice(0, 100) // Limit results
}

export function renameFile(oldPath: string, newPath: string): void {
  if (!fs.existsSync(oldPath)) throw new Error(`ឯកសាររកមិនឃើញ: ${oldPath}`)
  fs.renameSync(oldPath, newPath)
}
