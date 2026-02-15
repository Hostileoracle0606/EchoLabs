export interface MockCrmEntry {
  recordType: string
  fieldName: string
  fieldValue: string
  dateCaptured?: string
  dataSource?: string
  context?: string
  agentUse?: string
}

export interface MockCrmProfile {
  contactId: string
  entries: MockCrmEntry[]
  fields: Record<string, string[]>
}

let overrideEntries: MockCrmEntry[] | null = null

/**
 * Allow tests or bootstrap code to inject mock CRM entries directly.
 * When set, these entries are used instead of querying Neo4j.
 */
export function setMockCrmEntries(entries: MockCrmEntry[]): void {
  overrideEntries = entries
}

export function clearMockCrmEntries(): void {
  overrideEntries = null
}

/**
 * Load mock CRM entries from Neo4j (or from override entries if provided).
 */
export async function loadMockCrmEntries(): Promise<MockCrmEntry[]> {
  if (overrideEntries) {
    return overrideEntries
  }

  // Query Neo4j for all client data
  const { getNeo4jClient } = await import('@/services/storage/neo4j')
  const client = getNeo4jClient()

  try {
    await client.connect()

    // Query to fetch all clients with their related data
    const cypher = `
      MATCH (c:Client)
      OPTIONAL MATCH (c)-[:TRACKS_METRIC]->(m:Metric)
      OPTIONAL MATCH (c)-[:FACING_PROBLEM]->(p:Problem)
      OPTIONAL MATCH (c)-[:HAS_CONSTRAINT]->(con:Constraint)
      OPTIONAL MATCH (c)-[:NEEDS_DISCOVERY]->(d:DiscoveryGap)
      OPTIONAL MATCH (c)-[:HAS_LEVER]->(l:StrategicLever)
      RETURN c,
             collect(DISTINCT m) as metrics,
             collect(DISTINCT p) as problems,
             collect(DISTINCT con) as constraints,
             collect(DISTINCT d) as discoveryGaps,
             collect(DISTINCT l) as strategicLevers
    `

    const results = await client.query<{
      c: any
      metrics: any[]
      problems: any[]
      constraints: any[]
      discoveryGaps: any[]
      strategicLevers: any[]
    }>(cypher)

    const entries: MockCrmEntry[] = []

    for (const row of results) {
      const clientNode = row.c
      // Neo4j Node properties are nested under .properties
      const props = clientNode.properties || clientNode
      const rawId = props.id || clientNode.id || 'unknown'

      // Convert Neo4j Integer to string if needed
      const clientId = typeof rawId === 'object' && 'toNumber' in rawId
        ? String(rawId.toNumber())
        : String(rawId)

      // Add contact_id entry
      entries.push({
        recordType: 'IDENTITY',
        fieldName: 'contact_id',
        fieldValue: clientId,
        dataSource: 'neo4j',
      })

      // Add client properties
      if (props.first_name) {
        entries.push({
          recordType: 'IDENTITY',
          fieldName: 'first_name',
          fieldValue: props.first_name,
          dataSource: 'neo4j',
        })
      }
      if (props.last_name) {
        entries.push({
          recordType: 'IDENTITY',
          fieldName: 'last_name',
          fieldValue: props.last_name,
          dataSource: 'neo4j',
        })
      }
      if (props.business_name) {
        entries.push({
          recordType: 'IDENTITY',
          fieldName: 'business_name',
          fieldValue: props.business_name,
          dataSource: 'neo4j',
        })
      }
      if (props.industry) {
        entries.push({
          recordType: 'IDENTITY',
          fieldName: 'industry',
          fieldValue: props.industry,
          dataSource: 'neo4j',
        })
      }
      if (props.years_in_business != null) {
        entries.push({
          recordType: 'IDENTITY',
          fieldName: 'years_in_business',
          fieldValue: String(props.years_in_business),
          dataSource: 'neo4j',
        })
      }
      if (props.location_current) {
        entries.push({
          recordType: 'IDENTITY',
          fieldName: 'location_current',
          fieldValue: props.location_current,
          dataSource: 'neo4j',
        })
      }
      if (props.location_previous) {
        entries.push({
          recordType: 'IDENTITY',
          fieldName: 'location_previous',
          fieldValue: props.location_previous,
          dataSource: 'neo4j',
        })
      }

      // Add metrics
      for (const metric of row.metrics) {
        if (!metric) continue
        const metricProps = metric.properties || metric
        entries.push({
          recordType: 'METRIC',
          fieldName: 'metric_name',
          fieldValue: metricProps.name || 'Unknown Metric',
          dataSource: 'neo4j',
        })
        if (metricProps.value != null) {
          entries.push({
            recordType: 'METRIC',
            fieldName: 'metric_value',
            fieldValue: String(metricProps.value),
            dataSource: 'neo4j',
          })
        }
        if (metricProps.category) {
          entries.push({
            recordType: 'METRIC',
            fieldName: 'metric_category',
            fieldValue: metricProps.category,
            dataSource: 'neo4j',
          })
        }
      }

      // Add problems
      for (const problem of row.problems) {
        if (!problem) continue
        const problemProps = problem.properties || problem
        entries.push({
          recordType: 'PROBLEM',
          fieldName: 'problem_description',
          fieldValue: problemProps.description || problemProps.name || 'Unknown Problem',
          dataSource: 'neo4j',
        })
        if (problemProps.type) {
          entries.push({
            recordType: 'PROBLEM',
            fieldName: 'problem_type',
            fieldValue: problemProps.type,
            dataSource: 'neo4j',
          })
        }
      }

      // Add constraints
      for (const constraint of row.constraints) {
        if (!constraint) continue
        const constraintProps = constraint.properties || constraint
        entries.push({
          recordType: 'CONSTRAINT',
          fieldName: 'constraint_type',
          fieldValue: constraintProps.type || 'UNKNOWN',
          dataSource: 'neo4j',
        })
        if (constraintProps.detail || constraintProps.description) {
          entries.push({
            recordType: 'CONSTRAINT',
            fieldName: 'constraint_detail',
            fieldValue: constraintProps.detail || constraintProps.description,
            dataSource: 'neo4j',
          })
        }
      }

      // Add discovery gaps
      for (const gap of row.discoveryGaps) {
        if (!gap) continue
        const gapProps = gap.properties || gap
        entries.push({
          recordType: 'DISCOVERY_NEEDED',
          fieldName: 'discovery_gap',
          fieldValue: gapProps.question || gapProps.topic || gapProps.description || 'Unknown Gap',
          dataSource: 'neo4j',
        })
        if (gapProps.priority) {
          entries.push({
            recordType: 'DISCOVERY_NEEDED',
            fieldName: 'discovery_priority',
            fieldValue: gapProps.priority,
            dataSource: 'neo4j',
          })
        }
      }

      // Add strategic levers
      for (const lever of row.strategicLevers) {
        if (!lever) continue
        const leverProps = lever.properties || lever
        entries.push({
          recordType: 'STRATEGIC_LEVER',
          fieldName: 'lever_description',
          fieldValue: leverProps.description || leverProps.name || 'Unknown Lever',
          dataSource: 'neo4j',
        })
        if (leverProps.type) {
          entries.push({
            recordType: 'STRATEGIC_LEVER',
            fieldName: 'lever_type',
            fieldValue: leverProps.type,
            dataSource: 'neo4j',
          })
        }
      }
    }

    return entries
  } catch (error) {
    console.error('Failed to load CRM entries from Neo4j:', error)
    // Return empty array on error to allow fallback behavior
    return []
  } finally {
    // CRITICAL: Always disconnect to prevent connection leaks
    // Wrap in try-catch to prevent disconnect errors from masking original errors
    try {
      await client.disconnect()
    } catch (disconnectError) {
      console.error('Failed to disconnect Neo4j client:', disconnectError)
    }
  }
}

export async function loadMockCrmProfiles(): Promise<MockCrmProfile[]> {
  const entries = await loadMockCrmEntries()
  if (entries.length === 0) {
    return []
  }

  const contactIds = entries
    .filter((entry) => entry.fieldName.toLowerCase() === 'contact_id')
    .map((entry) => entry.fieldValue)
    .filter(Boolean)

  const defaultContactId = contactIds[0] || 'unknown'
  const profiles = new Map<string, MockCrmEntry[]>()
  let currentContactId = defaultContactId

  for (const entry of entries) {
    if (entry.fieldName.toLowerCase() === 'contact_id' && entry.fieldValue) {
      currentContactId = entry.fieldValue
    }

    const contactId = currentContactId || defaultContactId
    if (!profiles.has(contactId)) {
      profiles.set(contactId, [])
    }
    profiles.get(contactId)!.push(entry)
  }

  return Array.from(profiles.entries()).map(([contactId, grouped]) => ({
    contactId,
    entries: grouped,
    fields: buildFieldIndex(grouped),
  }))
}

export async function findMockCrmProfileByContactId(
  contactId: string
): Promise<MockCrmProfile | null> {
  const profiles = await loadMockCrmProfiles()
  return profiles.find((profile) => profile.contactId === contactId) || null
}

export async function findFirstMockCrmProfile(): Promise<MockCrmProfile | null> {
  const profiles = await loadMockCrmProfiles()
  return profiles[0] || null
}

export function getProfileField(
  profile: MockCrmProfile,
  fieldName: string
): string | undefined {
  return profile.fields[fieldName]?.[0]
}

export function getProfileFieldList(
  profile: MockCrmProfile,
  fieldName: string
): string[] {
  return profile.fields[fieldName] || []
}

export function getProfileEntriesByFieldPrefix(
  profile: MockCrmProfile,
  prefix: string
): MockCrmEntry[] {
  const needle = prefix.toLowerCase()
  return profile.entries.filter((entry) =>
    entry.fieldName.toLowerCase().startsWith(needle)
  )
}

export function getLatestCapturedDate(entries: MockCrmEntry[]): string | undefined {
  const dates = entries
    .map((entry) => entry.dateCaptured)
    .filter(Boolean) as string[]
  if (dates.length === 0) return undefined
  return dates.sort().at(-1)
}

function buildFieldIndex(entries: MockCrmEntry[]): Record<string, string[]> {
  const fields: Record<string, string[]> = {}
  for (const entry of entries) {
    if (!fields[entry.fieldName]) {
      fields[entry.fieldName] = []
    }
    fields[entry.fieldName].push(entry.fieldValue)
  }
  return fields
}
