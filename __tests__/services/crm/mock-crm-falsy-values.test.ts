import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { loadMockCrmEntries, clearMockCrmEntries } from '@/services/crm/mock-crm'

describe('MockCRM Falsy Value Handling', () => {
  beforeEach(() => {
    clearMockCrmEntries()
  })

  afterEach(() => {
    clearMockCrmEntries()
    vi.resetModules()
  })

  it('should include years_in_business when value is 0', async () => {
    // Mock Neo4j client to return 0 years
    const mockClient = {
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue([
        {
          c: {
            id: 'client-123',
            properties: {
              first_name: 'New',
              last_name: 'Startup',
              business_name: 'Fresh Co',
              years_in_business: 0, // ZERO is valid!
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

    // Should find the years_in_business entry with value "0"
    const yearsEntry = entries.find(e => e.fieldName === 'years_in_business')
    expect(yearsEntry).toBeDefined()
    expect(yearsEntry?.fieldValue).toBe('0')
  })

  it('should include metric value when value is 0', async () => {
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
                name: 'Debt',
                value: 0, // ZERO debt is valid!
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

    // Should find metric value "0"
    const metricValue = entries.find(e => e.fieldName === 'metric_value')
    expect(metricValue).toBeDefined()
    expect(metricValue?.fieldValue).toBe('0')
  })

  it('should exclude years_in_business when value is null or undefined', async () => {
    const mockClient = {
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue([
        {
          c: {
            id: 'client-123',
            properties: {
              first_name: 'Test',
              years_in_business: null // NULL should be excluded
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

    // Should NOT find years_in_business when null
    const yearsEntry = entries.find(e => e.fieldName === 'years_in_business')
    expect(yearsEntry).toBeUndefined()
  })

  it('should handle empty string as falsy (exclude)', async () => {
    const mockClient = {
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue([
        {
          c: {
            id: 'client-123',
            properties: {
              first_name: 'Test',
              business_name: '' // Empty string should be excluded
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

    // Should NOT find business_name when empty string
    const businessEntry = entries.find(e => e.fieldName === 'business_name')
    expect(businessEntry).toBeUndefined()
  })
})
