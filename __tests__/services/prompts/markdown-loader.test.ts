import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { MarkdownLoader } from '@/services/prompts/markdown-loader'
import { writeFileSync, mkdirSync, rmSync } from 'fs'
import { join } from 'path'

describe('MarkdownLoader', () => {
  const testPromptsDir = join(process.cwd(), 'prompts-test')
  let loader: MarkdownLoader

  beforeAll(() => {
    // Create test markdown files
    mkdirSync(testPromptsDir, { recursive: true })

    writeFileSync(
      join(testPromptsDir, 'TEST.md'),
      '# Test File\n\nThis is test content.\n\n## Section 1\n\nSection 1 content.\n\n## Section 2\n\nSection 2 content.'
    )

    writeFileSync(
      join(testPromptsDir, 'AGENT.md'),
      '# AGENT INSTRUCTIONS\n\nOrchestration logic here.\n\n## DECISION FLOW\n\nDecision flow content.'
    )
  })

  afterAll(() => {
    // Cleanup test directory
    rmSync(testPromptsDir, { recursive: true, force: true })
  })

  it('should load markdown file', async () => {
    loader = new MarkdownLoader(testPromptsDir)
    const content = await loader.load('TEST')

    expect(content).toContain('# Test File')
    expect(content).toContain('Section 1 content')
  })

  it('should cache loaded files', async () => {
    loader = new MarkdownLoader(testPromptsDir)

    const content1 = await loader.load('TEST')
    const content2 = await loader.load('TEST')

    // Should be same reference (cached)
    expect(content1).toBe(content2)
  })

  it('should extract specific section from markdown', () => {
    const markdown = `# Title\n\n## Section A\n\nContent A\n\n## Section B\n\nContent B\n\n## Section C\n\nContent C`

    const sectionB = MarkdownLoader.extractSection(markdown, 'Section B')

    expect(sectionB).toContain('## Section B')
    expect(sectionB).toContain('Content B')
    expect(sectionB).not.toContain('Content A')
    expect(sectionB).not.toContain('Content C')
  })

  it('should return empty string if section not found', () => {
    const markdown = `# Title\n\n## Section A\n\nContent A`

    const result = MarkdownLoader.extractSection(markdown, 'NonExistent')

    expect(result).toBe('')
  })

  it('should load multiple different files', async () => {
    loader = new MarkdownLoader(testPromptsDir)

    const test = await loader.load('TEST')
    const agent = await loader.load('AGENT')

    expect(test).toContain('Test File')
    expect(agent).toContain('AGENT INSTRUCTIONS')
  })

  it('should clear cache when requested', async () => {
    loader = new MarkdownLoader(testPromptsDir)

    await loader.load('TEST')
    loader.clearCache()

    // After clearing, should reload from file
    const content = await loader.load('TEST')
    expect(content).toContain('Test File')
  })
})
