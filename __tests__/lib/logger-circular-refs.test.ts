import { describe, it, expect, vi } from 'vitest'

describe('Logger Circular Reference Handling', () => {
  it('should handle circular references without crashing', async () => {
    // Need to reload logger fresh for each test
    vi.resetModules()
    const { default: logger } = await import('@/lib/logger')

    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    // Create circular reference
    const obj: any = { name: 'test' }
    obj.self = obj // Circular!

    // Should NOT throw "Converting circular structure to JSON"
    expect(() => {
      logger.info('Test', 'Circular object', obj)
    }).not.toThrow()

    consoleLogSpy.mockRestore()
  })

  it('should include [Circular] marker for circular references', async () => {
    vi.resetModules()
    const { default: logger } = await import('@/lib/logger')

    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const obj: any = { name: 'test', nested: {} }
    obj.nested.parent = obj // Circular!

    logger.info('Test', 'Message', obj)

    // Should log something (not throw)
    expect(consoleLogSpy).toHaveBeenCalled()

    const loggedMessage = consoleLogSpy.mock.calls[0][0]

    // Should contain the non-circular data
    expect(loggedMessage).toContain('test')

    // Should indicate circular reference
    expect(loggedMessage).toContain('[Circular]')

    consoleLogSpy.mockRestore()
  })

  it('should handle deeply nested circular references', async () => {
    vi.resetModules()
    const { default: logger } = await import('@/lib/logger')

    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const obj: any = {
      level1: {
        level2: {
          level3: {
            name: 'deep'
          }
        }
      }
    }
    obj.level1.level2.level3.root = obj // Deep circular!

    expect(() => {
      logger.debug('Test', 'Deep circular', obj)
    }).not.toThrow()

    consoleLogSpy.mockRestore()
  })

  it('should handle normal objects without modification', async () => {
    vi.resetModules()
    const { default: logger } = await import('@/lib/logger')

    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const obj = { name: 'test', value: 123, nested: { foo: 'bar' } }

    logger.info('Test', 'Normal object', obj)

    const loggedMessage = consoleLogSpy.mock.calls[0][0]

    // Should contain all the data
    expect(loggedMessage).toContain('test')
    expect(loggedMessage).toContain('123')
    expect(loggedMessage).toContain('bar')

    // Should NOT have circular markers
    expect(loggedMessage).not.toContain('[Circular]')

    consoleLogSpy.mockRestore()
  })

  it('should handle arrays with circular references', async () => {
    vi.resetModules()
    const { default: logger } = await import('@/lib/logger')

    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const arr: any[] = [1, 2, 3]
    arr.push(arr) // Circular array!

    expect(() => {
      logger.warn('Test', 'Circular array', arr)
    }).not.toThrow()

    consoleLogSpy.mockRestore()
  })
})
