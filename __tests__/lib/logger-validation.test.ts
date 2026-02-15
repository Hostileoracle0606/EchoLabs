import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('Logger Validation', () => {
  let originalEnv: NodeJS.ProcessEnv
  let consoleWarnSpy: any

  beforeEach(() => {
    originalEnv = { ...process.env }
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    process.env = originalEnv
    consoleWarnSpy.mockRestore()
    // Clear module cache to force re-initialization
    vi.resetModules()
  })

  it('should use default "info" level when LOG_LEVEL is not set', async () => {
    delete process.env.LOG_LEVEL

    const { default: logger } = await import('@/lib/logger')

    // Logger should work without errors
    expect(() => {
      logger.info('Test', 'Should work with default level')
    }).not.toThrow()

    // Should not warn about invalid level
    expect(consoleWarnSpy).not.toHaveBeenCalled()
  })

  it('should accept valid LOG_LEVEL values', async () => {
    const validLevels = ['debug', 'info', 'warn', 'error']

    for (const level of validLevels) {
      vi.resetModules()
      process.env.LOG_LEVEL = level

      const { default: logger } = await import('@/lib/logger')

      expect(() => {
        logger.info('Test', `Level: ${level}`)
      }).not.toThrow()

      // Should not warn about valid level
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    }
  })

  it('should warn and fallback to "info" when LOG_LEVEL is invalid', async () => {
    process.env.LOG_LEVEL = 'INVALID_LEVEL'

    const { default: logger } = await import('@/lib/logger')

    // Should have warned about invalid level
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid LOG_LEVEL="invalid_level"')
    )
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Using default "info"')
    )

    // Logger should still work with fallback level
    expect(() => {
      logger.info('Test', 'Should work with fallback')
    }).not.toThrow()
  })

  it('should handle case-insensitive LOG_LEVEL values', async () => {
    process.env.LOG_LEVEL = 'DEBUG'

    const { default: logger } = await import('@/lib/logger')

    // Should accept uppercase and convert to lowercase
    expect(() => {
      logger.debug('Test', 'Case-insensitive level')
    }).not.toThrow()

    // Should not warn about valid level
    expect(consoleWarnSpy).not.toHaveBeenCalled()
  })

  it('should provide helpful error message with valid levels list', async () => {
    process.env.LOG_LEVEL = 'trace'

    const { default: logger } = await import('@/lib/logger')

    // Should warn with list of valid levels
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Valid levels: debug, info, warn, error')
    )
  })
})
