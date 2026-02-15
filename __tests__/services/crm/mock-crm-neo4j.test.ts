import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { loadMockCrmEntries, setMockCrmEntries, clearMockCrmEntries } from '@/services/crm/mock-crm'

describe('MockCRM Neo4j Integration', () => {
  beforeEach(() => {
    clearMockCrmEntries()
  })

  afterEach(() => {
    clearMockCrmEntries()
  })

  describe('Neo4j Record Handling', () => {
    it('should correctly access Node properties from Neo4j records', async () => {
      // Mock Neo4j client to return realistic Node structure
      const mockClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        query: vi.fn().mockResolvedValue([
          {
            c: {
              id: 'client-123',
              properties: {
                first_name: 'John',
                last_name: 'Doe',
                business_name: 'Acme Corp',
                industry: 'Technology',
                years_in_business: 5,
                location_current: 'San Francisco',
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

      // Mock getNeo4jClient to return our mock
      vi.doMock('@/services/storage/neo4j', () => ({
        getNeo4jClient: () => mockClient
      }))

      const entries = await loadMockCrmEntries()

      // Should extract first_name correctly
      const firstNameEntry = entries.find(e => e.fieldName === 'first_name')
      expect(firstNameEntry).toBeDefined()
      expect(firstNameEntry?.fieldValue).toBe('John')

      // Should extract all identity fields
      const lastNameEntry = entries.find(e => e.fieldName === 'last_name')
      expect(lastNameEntry?.fieldValue).toBe('Doe')

      const businessNameEntry = entries.find(e => e.fieldName === 'business_name')
      expect(businessNameEntry?.fieldValue).toBe('Acme Corp')
    })

    it('should handle connection lifecycle correctly', async () => {
      const mockClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        query: vi.fn().mockResolvedValue([])
      }

      vi.doMock('@/services/storage/neo4j', () => ({
        getNeo4jClient: () => mockClient
      }))

      await loadMockCrmEntries()

      // Should connect before querying
      expect(mockClient.connect).toHaveBeenCalled()

      // CRITICAL: Should disconnect after querying to prevent leaks
      expect(mockClient.disconnect).toHaveBeenCalled()
    })

    it('should disconnect even when query fails', async () => {
      const mockClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        query: vi.fn().mockRejectedValue(new Error('Query failed'))
      }

      vi.doMock('@/services/storage/neo4j', () => ({
        getNeo4jClient: () => mockClient
      }))

      const entries = await loadMockCrmEntries()

      // Should return empty array on error
      expect(entries).toEqual([])

      // CRITICAL: Should still disconnect to prevent leaks
      expect(mockClient.disconnect).toHaveBeenCalled()
    })
  })

  describe('Metrics Extraction', () => {
    it('should correctly access metric properties', async () => {
      const mockClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        query: vi.fn().mockResolvedValue([
          {
            c: { id: 'client-123', properties: { first_name: 'John' } },
            metrics: [
              {
                properties: {
                  name: 'Monthly Revenue',
                  value: 50000,
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

      const metricNameEntry = entries.find(e => e.fieldName === 'metric_name')
      expect(metricNameEntry?.fieldValue).toBe('Monthly Revenue')

      const metricValueEntry = entries.find(e => e.fieldName === 'metric_value')
      expect(metricValueEntry?.fieldValue).toBe('50000')

      const metricCategoryEntry = entries.find(e => e.fieldName === 'metric_category')
      expect(metricCategoryEntry?.fieldValue).toBe('Financial')
    })
  })

  describe('Problems Extraction', () => {
    it('should correctly access problem properties', async () => {
      const mockClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        query: vi.fn().mockResolvedValue([
          {
            c: { id: 'client-123', properties: { first_name: 'John' } },
            metrics: [],
            problems: [
              {
                properties: {
                  description: 'Cash flow issues',
                  type: 'Financial'
                }
              }
            ],
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

      const problemDescEntry = entries.find(e => e.fieldName === 'problem_description')
      expect(problemDescEntry?.fieldValue).toBe('Cash flow issues')

      const problemTypeEntry = entries.find(e => e.fieldName === 'problem_type')
      expect(problemTypeEntry?.fieldValue).toBe('Financial')
    })
  })

  describe('Override Entries', () => {
    it('should use override entries when provided', async () => {
      const overrideData = [
        {
          recordType: 'IDENTITY',
          fieldName: 'contact_id',
          fieldValue: 'override-123',
          dataSource: 'test'
        }
      ]

      setMockCrmEntries(overrideData)

      const entries = await loadMockCrmEntries()

      expect(entries).toEqual(overrideData)
      // Should NOT query Neo4j when override is set
    })
  })
})
