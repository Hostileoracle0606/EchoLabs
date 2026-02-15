import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { loadMockCrmEntries, clearMockCrmEntries } from '@/services/crm/mock-crm'

describe('MockCRM Error Handling', () => {
  beforeEach(() => {
    clearMockCrmEntries()
  })

  afterEach(() => {
    clearMockCrmEntries()
    vi.resetModules()
  })

  it('should preserve original error when disconnect also fails', async () => {
    const originalError = new Error('Query failed: timeout')
    const disconnectError = new Error('Disconnect failed: network error')

    const mockClient = {
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockRejectedValue(disconnectError),
      query: vi.fn().mockRejectedValue(originalError)
    }

    vi.doMock('@/services/storage/neo4j', () => ({
      getNeo4jClient: () => mockClient
    }))

    // Capture console.error calls
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const entries = await loadMockCrmEntries()

    // Should return empty array (error handled)
    expect(entries).toEqual([])

    // Should log the ORIGINAL error, not the disconnect error
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to load CRM entries from Neo4j:',
      originalError
    )

    // Should NOT log disconnect error in place of original
    const calls = consoleErrorSpy.mock.calls.map(call => call.join(' '))
    const hasOriginalError = calls.some(call => call.includes('Query failed: timeout'))
    const hasDisconnectError = calls.some(call => call.includes('Disconnect failed'))

    expect(hasOriginalError).toBe(true)
    // Disconnect error can be logged separately, but shouldn't replace original
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to load CRM entries from Neo4j:',
      originalError
    )

    consoleErrorSpy.mockRestore()
  })

  it('should still disconnect even when query succeeds', async () => {
    const mockClient = {
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue([
        {
          c: { id: 'client-123', properties: { first_name: 'Test' } },
          metrics: [],
          problems: [],
          constraints: [],
          discoveryGaps: [],
          strategicLevers: []
        }
      ])
    }

    vi.doMock('@/services/storage/neo4j', () => ({
      getNeo4jClient: () => mockClient
    }))

    await loadMockCrmEntries()

    // Should disconnect after successful query
    expect(mockClient.disconnect).toHaveBeenCalled()
  })

  it('should handle disconnect errors gracefully without throwing', async () => {
    const disconnectError = new Error('Disconnect failed')

    const mockClient = {
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockRejectedValue(disconnectError),
      query: vi.fn().mockResolvedValue([
        {
          c: { id: 'client-123', properties: { first_name: 'Test' } },
          metrics: [],
          problems: [],
          constraints: [],
          discoveryGaps: [],
          strategicLevers: []
        }
      ])
    }

    vi.doMock('@/services/storage/neo4j', () => ({
      getNeo4jClient: () => mockClient
    }))

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Should NOT throw even if disconnect fails
    await expect(loadMockCrmEntries()).resolves.not.toThrow()

    // Should still return the data
    const entries = await loadMockCrmEntries()
    expect(entries.length).toBeGreaterThan(0)

    consoleErrorSpy.mockRestore()
  })
})
