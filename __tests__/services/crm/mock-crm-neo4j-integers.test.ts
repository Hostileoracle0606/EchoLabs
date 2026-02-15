import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { loadMockCrmEntries, clearMockCrmEntries } from '@/services/crm/mock-crm'
import neo4j from 'neo4j-driver'

describe('MockCRM Neo4j Integer Handling', () => {
  beforeEach(() => {
    clearMockCrmEntries()
  })

  afterEach(() => {
    clearMockCrmEntries()
    vi.resetModules()
  })

  it('should convert Neo4j Integer to string for contact_id', async () => {
    // Neo4j returns Integer objects for numeric IDs
    const neo4jInteger = neo4j.int(12345)

    const mockClient = {
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue([
        {
          c: {
            id: neo4jInteger, // Neo4j Integer object
            properties: {
              first_name: 'Test'
            }
          },
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

    const entries = await loadMockCrmEntries()

    // Should convert Integer to string "12345", not {"low": 12345, "high": 0}
    const contactEntry = entries.find(e => e.fieldName === 'contact_id')
    expect(contactEntry).toBeDefined()
    expect(contactEntry?.fieldValue).toBe('12345')
    expect(contactEntry?.fieldValue).not.toContain('low')
    expect(contactEntry?.fieldValue).not.toContain('high')
  })

  it('should convert Neo4j Integer to string for years_in_business', async () => {
    const neo4jInteger = neo4j.int(5)

    const mockClient = {
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue([
        {
          c: {
            id: 'client-123',
            properties: {
              first_name: 'Test',
              years_in_business: neo4jInteger // Neo4j Integer
            }
          },
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

    const entries = await loadMockCrmEntries()

    const yearsEntry = entries.find(e => e.fieldName === 'years_in_business')
    expect(yearsEntry).toBeDefined()
    expect(yearsEntry?.fieldValue).toBe('5')
    expect(yearsEntry?.fieldValue).not.toContain('low')
  })

  it('should convert Neo4j Integer to string for metric values', async () => {
    const revenue = neo4j.int(50000)

    const mockClient = {
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue([
        {
          c: {
            id: 'client-123',
            properties: { first_name: 'Test' }
          },
          metrics: [
            {
              properties: {
                name: 'Revenue',
                value: revenue, // Neo4j Integer
                category: 'Financial'
              }
            }
          ],
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

    const entries = await loadMockCrmEntries()

    const metricValue = entries.find(e => e.fieldName === 'metric_value')
    expect(metricValue).toBeDefined()
    expect(metricValue?.fieldValue).toBe('50000')
    expect(metricValue?.fieldValue).not.toContain('low')
  })

  it('should handle regular JavaScript numbers correctly', async () => {
    const mockClient = {
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue([
        {
          c: {
            id: 'client-string-id',
            properties: {
              first_name: 'Test',
              years_in_business: 10 // Regular JS number
            }
          },
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

    const entries = await loadMockCrmEntries()

    const yearsEntry = entries.find(e => e.fieldName === 'years_in_business')
    expect(yearsEntry).toBeDefined()
    expect(yearsEntry?.fieldValue).toBe('10')
  })
})
