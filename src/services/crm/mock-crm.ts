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
 * TODO: Replace with real Neo4j query once the driver is wired up.
 */
export async function loadMockCrmEntries(): Promise<MockCrmEntry[]> {
  if (overrideEntries) {
    return overrideEntries
  }

  // Placeholder until Neo4j integration is added.
  return []
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
