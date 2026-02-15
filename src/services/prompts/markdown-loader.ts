import { readFile } from 'fs/promises'
import { join } from 'path'

/**
 * MarkdownLoader
 * Loads and caches markdown prompt files
 */
export class MarkdownLoader {
  private cache: Map<string, string> = new Map()
  private promptsDir: string

  constructor(promptsDir?: string) {
    this.promptsDir = promptsDir || join(process.cwd(), 'prompts')
  }

  /**
   * Load a markdown file by name (without .md extension)
   * Caches the result for subsequent calls
   */
  async load(name: string): Promise<string> {
    // Check cache first
    if (this.cache.has(name)) {
      return this.cache.get(name)!
    }

    // Load from file
    const filePath = join(this.promptsDir, `${name}.md`)
    const content = await readFile(filePath, 'utf-8')

    // Cache and return
    this.cache.set(name, content)
    return content
  }

  /**
   * Extract a specific section from markdown content
   * Sections are defined by ## headers
   */
  static extractSection(markdown: string, sectionName: string): string {
    const lines = markdown.split('\n')
    const sectionStart = lines.findIndex(line =>
      line.trim().toLowerCase().startsWith('##') &&
      line.toLowerCase().includes(sectionName.toLowerCase())
    )

    if (sectionStart === -1) {
      return '' // Section not found
    }

    // Find next section or end of file
    let sectionEnd = lines.length
    for (let i = sectionStart + 1; i < lines.length; i++) {
      if (lines[i].trim().startsWith('##')) {
        sectionEnd = i
        break
      }
    }

    return lines.slice(sectionStart, sectionEnd).join('\n')
  }

  /**
   * Clear the cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear()
  }
}
