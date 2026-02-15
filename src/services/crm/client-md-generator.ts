import { readFile } from 'fs/promises'
import { join } from 'path'
import {
  findFirstMockCrmProfile,
  findMockCrmProfileByContactId,
  getProfileEntriesByFieldPrefix,
  getProfileField,
  getProfileFieldList,
  MockCrmEntry,
  MockCrmProfile,
} from '@/services/crm/mock-crm'

export interface ClientMdGenerateOptions {
  callId: string
  contactId?: string
  now?: Date
}

const CLIENT_TEMPLATE_PATH = join(process.cwd(), 'prompts', 'CLIENT.md')

export async function generateClientMd(
  options: ClientMdGenerateOptions
): Promise<string> {
  const { callId, contactId, now } = options
  const profile = contactId
    ? await findMockCrmProfileByContactId(contactId)
    : null
  const resolvedProfile = profile || (await findFirstMockCrmProfile())

  if (!resolvedProfile) {
    return await loadFallbackTemplate(callId, now)
  }

  return buildClientMd(resolvedProfile, callId, now)
}

function buildClientMd(
  profile: MockCrmProfile,
  callId: string,
  now: Date = new Date()
): string {
  const timestamp = now.toISOString()
  const entries = profile.entries

  const firstName = getProfileField(profile, 'first_name')
  const lastName = getProfileField(profile, 'last_name')
  const businessName = getProfileField(profile, 'business_name')
  const industry = getProfileField(profile, 'industry')
  const yearsInBusiness = getProfileField(profile, 'years_in_business')
  const locationCurrent = getProfileField(profile, 'location_current')
  const locationPrevious = getProfileField(profile, 'location_previous')
  const marketContext = joinParts([
    locationCurrent ? `Current: ${locationCurrent}` : undefined,
    locationPrevious ? `Previous: ${locationPrevious}` : undefined,
  ])

  const experienceLevel = deriveExperienceLevel(yearsInBusiness)
  const role = inferRole(entries)

  const statedProblem = buildStatedProblem(profile)
  const inferredProblem = buildInferredProblem(profile)
  const metrics = buildMetrics(profile)
  const emotionalSignals = buildEmotionalSignals(profile)
  const buyingSignals = buildBuyingSignals(profile)
  const objections = buildObjections(profile)
  const constraints = buildConstraints(profile)
  const discoveryGaps = buildDiscoveryGaps(profile)
  const strategicLevers = buildStrategicLevers(profile)
  const dealHealth = buildDealHealth(statedProblem.length, buyingSignals.length)
  const openLoops = buildOpenLoops(profile)
  const conversationHistory = buildConversationHistory(profile)
  const lastTranscript = buildLastTranscriptAnalysis(profile)

  return `# CLIENT LEDGER

schemaVersion: v1
lastUpdated: ${timestamp}
callId: ${callId}

---

## 1. CLIENT IDENTITY SNAPSHOT

### Company / Individual Name
${formatLine(businessName || joinParts([firstName, lastName]) || profile.contactId)}

### Industry / Vertical
${formatLine(industry)}

### Role / Decision Authority
${formatLine(role)}

### Market Context
${formatLine(marketContext)}

### Experience Level
${formatLine(experienceLevel)}

---

## 2. STATED PROBLEM (Surface Narrative)

> What they say is wrong.

${formatLines(statedProblem)}

confidence: ${inferConfidence(statedProblem.length)}

---

## 3. INFERRED CORE PROBLEM (Strategic Hypothesis)

> What the agent believes is actually happening.

${formatLines(inferredProblem)}

confidence: ${inferConfidence(inferredProblem.length)}

evidence:
${formatLines(buildInferenceEvidence(profile))}

---

## 4. CURRENT STATE METRICS

### Volume Signals
- Leads: ${metrics.volume.leads || 'unknown'}
- Traffic: ${metrics.volume.traffic || 'unknown'}
- Meetings: ${metrics.volume.meetings || 'unknown'}
- Conversions: ${metrics.volume.conversions || 'unknown'}
- Revenue: ${metrics.volume.revenue || 'unknown'}

### Conversion Indicators
- Funnel drop-off: ${metrics.conversion.funnelDropOff || 'unknown'}
- Show rate: ${metrics.conversion.showRate || 'unknown'}
- Response rate: ${metrics.conversion.responseRate || 'unknown'}

### Operational Complexity
- Channels in use: ${metrics.operations.channels || 'unknown'}
- Tools: ${metrics.operations.tools || 'unknown'}
- Team size: ${metrics.operations.teamSize || 'unknown'}

---

## 5. EMOTIONAL SIGNALS

### Positive Energy Triggers
- What makes them light up: ${emotionalSignals.positive || 'unknown'}
- Where confidence rises: ${emotionalSignals.confidence || 'unknown'}

### Friction Signals
- Hesitation moments: ${emotionalSignals.hesitation || 'unknown'}
- Energy drop: ${emotionalSignals.energyDrop || 'unknown'}
- Defensive reactions: ${emotionalSignals.defensive || 'unknown'}
- Overwhelm indicators: ${emotionalSignals.overwhelm || 'unknown'}

---

## 6. BUYING SIGNALS

${formatLines(buyingSignals)}

buyingIntentScore: ${dealHealth.buyingIntentScore}

---

## 7. OBJECTIONS

### Stated Objections
${formatLines(objections)}

### Hidden Resistance
- 

severityScore: ${dealHealth.objectionSeverityScore}

---

## 8. CONSTRAINTS

### Time
${formatLines(constraints.time)}

### Budget
${formatLines(constraints.budget)}

### Authority
${formatLines(constraints.authority)}

### Energy / Bandwidth
${formatLines(constraints.energy)}

---

## 9. DISCOVERY GAPS

> What we still don’t know.

${formatLines(discoveryGaps)}

priorityLevel: ${inferPriority(discoveryGaps.length)}

---

## 10. STRATEGIC LEVERS

> Where leverage likely exists.

${formatLines(strategicLevers)}

activeHypothesis:
${formatLines(inferredProblem.slice(0, 2))}

---

## 11. DEAL HEALTH

painClarityScore: ${dealHealth.painClarityScore}
solutionFitScore: ${dealHealth.solutionFitScore}
decisionMomentumScore: ${dealHealth.decisionMomentumScore}

overallDealHealth: ${dealHealth.overall}

---

## 12. OPEN LOOPS

${formatLines(openLoops)}

---

## 13. CONVERSATION HISTORY SNAPSHOT

### Key Moments
${formatLines(conversationHistory.keyMoments)}

### Breakthrough Moments
${formatLines(conversationHistory.breakthroughs)}

### Shifts in Framing
${formatLines(conversationHistory.shifts)}

---

## 14. LAST TRANSCRIPT ANALYSIS

lastChunkSummary:
${formatLines(lastTranscript.summary)}

intentDetected:
${formatLines(lastTranscript.intentDetected)}

solutionsTriggered:
${formatLines(lastTranscript.solutionsTriggered)}
`
}

async function loadFallbackTemplate(callId: string, now?: Date): Promise<string> {
  const content = await readFile(CLIENT_TEMPLATE_PATH, 'utf-8')
  return content
    .replace('{timestamp}', (now || new Date()).toISOString())
    .replace('{call_id}', callId)
}

function buildStatedProblem(profile: MockCrmProfile): string[] {
  const goalValue = getProfileField(profile, 'goal_value')
  const goalTimeline = getProfileField(profile, 'goal_timeline')
  const bookingMetric = getMetricValue(profile, /consultation bookings/i)
  const conversionRate = getMetricValue(profile, /conversion rate/i)

  const problems: string[] = []
  if (goalValue && goalTimeline) {
    problems.push(`Needs at least ${goalValue} bookings per month by ${goalTimeline}.`)
  }
  if (bookingMetric) {
    problems.push(`Consultation bookings are low: ${bookingMetric}.`)
  }
  if (conversionRate) {
    problems.push(`Conversion rate is currently ${conversionRate}.`)
  }

  return problems
}

function buildInferredProblem(profile: MockCrmProfile): string[] {
  const insights = getProfileEntriesByFieldPrefix(profile, 'call_key_insight')
  const interpretations = getProfileEntriesByFieldPrefix(profile, 'behavior_interpretation')
  const inferred = [
    ...insights.map((entry) => entry.fieldValue),
    ...interpretations.map((entry) => entry.fieldValue),
  ]

  return dedupe(inferred).slice(0, 6)
}

function buildInferenceEvidence(profile: MockCrmProfile): string[] {
  const evidence: string[] = []
  const leadVolume = getMetricValue(profile, /lead volume/i)
  const conversionRate = getMetricValue(profile, /conversion rate/i)
  if (leadVolume) {
    evidence.push(`Strong lead flow (${leadVolume}) but low booking conversion.`)
  }
  if (conversionRate) {
    evidence.push(`Conversion rate is ${conversionRate}, below target.`)
  }
  return evidence.length ? evidence : ['Transcript references pending.']
}

function buildMetrics(profile: MockCrmProfile) {
  const channels = collectChannels(profile.entries)
  const channelNames = channels.map((channel) => channel.name).filter(Boolean)

  return {
    volume: {
      leads:
        getMetricValue(profile, /weekly lead volume/i) ||
        getMetricValue(profile, /monthly lead volume/i) ||
        'unknown',
      traffic:
        getMetricValue(profile, /website traffic/i) ||
        getMetricValue(profile, /google business profile views/i) ||
        'unknown',
      meetings: getMetricValue(profile, /consultation bookings/i) || 'unknown',
      conversions: getMetricValue(profile, /conversion rate/i) || 'unknown',
      revenue: getMetricValue(profile, /revenue/i) || 'unknown',
    },
    conversion: {
      funnelDropOff: getProfileField(profile, 'metric_gap') || 'unknown',
      showRate: getMetricValue(profile, /show rate/i) || 'unknown',
      responseRate: getMetricValue(profile, /reply rate/i) || 'unknown',
    },
    operations: {
      channels: channelNames.length ? channelNames.join(', ') : 'unknown',
      tools: collectTools(profile.entries).join(', ') || 'unknown',
      teamSize: inferTeamSize(profile),
    },
  }
}

function buildEmotionalSignals(profile: MockCrmProfile) {
  const positive = getProfileField(profile, 'call_emotion_shift')
  const confidence = getProfileField(profile, 'call_emotion_end')
  const hesitation = getProfileFieldList(profile, 'call_hesitation_detected').join('; ')
  const energyDrop = getProfileField(profile, 'call_emotion_start')
  const defensive = ''
  const overwhelm = getProfileField(profile, 'emotional_signal')

  return {
    positive: positive || 'unknown',
    confidence: confidence || 'unknown',
    hesitation: hesitation || 'unknown',
    energyDrop: energyDrop || 'unknown',
    defensive: defensive || 'unknown',
    overwhelm: overwhelm || 'unknown',
  }
}

function buildBuyingSignals(profile: MockCrmProfile): string[] {
  const buyingSignals: string[] = []
  const dmMessage = getProfileField(profile, 'message_content')
  if (dmMessage) {
    buyingSignals.push(`DM signal: ${dmMessage}`)
  }

  const permissionGiven = profile.entries.filter(
    (entry) => entry.recordType === 'PERMISSION_LAYER' && entry.agentUse === 'GIVEN'
  )
  for (const entry of permissionGiven) {
    buyingSignals.push(`Permission granted: ${entry.fieldValue}`)
  }

  const callOutcome = getProfileField(profile, 'call_outcome')
  if (callOutcome) {
    buyingSignals.push(`Prior call outcome: ${callOutcome}`)
  }

  return dedupe(buyingSignals).slice(0, 6)
}

function buildObjections(profile: MockCrmProfile): string[] {
  const objections = getProfileFieldList(profile, 'call_hesitation_detected')
  return objections.length ? objections : ['-']
}

function buildConstraints(profile: MockCrmProfile) {
  const constraints = collectConstraints(profile.entries)
  return {
    time: constraints.TIME.length ? constraints.TIME : ['-'],
    budget: constraints.MONEY.length ? constraints.MONEY : ['-'],
    authority: constraints.AUTHORITY.length ? constraints.AUTHORITY : ['-'],
    energy: constraints.ENERGY.length
      ? constraints.ENERGY
      : constraints.TEAM.length
      ? constraints.TEAM
      : ['-'],
  }
}

function buildDiscoveryGaps(profile: MockCrmProfile): string[] {
  const gaps = profile.entries
    .filter((entry) => entry.recordType === 'DISCOVERY_NEEDED')
    .map((entry) => entry.fieldValue)
  return gaps.length ? gaps : ['-']
}

function buildStrategicLevers(profile: MockCrmProfile): string[] {
  const channels = collectChannels(profile.entries)
  const levers: string[] = []

  for (const channel of channels) {
    for (const opp of channel.opportunities) {
      levers.push(`${channel.name}: ${opp}`)
    }
    for (const issue of channel.issues) {
      levers.push(`${channel.name} issue: ${issue}`)
    }
  }

  const interpretations = getProfileEntriesByFieldPrefix(profile, 'behavior_interpretation')
  for (const entry of interpretations) {
    levers.push(entry.fieldValue)
  }

  return dedupe(levers).slice(0, 8)
}

function buildDealHealth(statedCount: number, buyingCount: number) {
  const painClarityScore = statedCount > 1 ? 7 : statedCount === 1 ? 5 : 3
  const solutionFitScore = statedCount > 0 ? 7 : 4
  const decisionMomentumScore = buyingCount > 1 ? 8 : buyingCount === 1 ? 6 : 4
  const overall = Math.round(
    (painClarityScore + solutionFitScore + decisionMomentumScore) / 3
  )

  return {
    painClarityScore,
    solutionFitScore,
    decisionMomentumScore,
    overall,
    buyingIntentScore: Math.min(10, decisionMomentumScore + 1),
    objectionSeverityScore: 4,
  }
}

function buildOpenLoops(profile: MockCrmProfile): string[] {
  const loops = buildDiscoveryGaps(profile)
  const permissionCondition = getProfileField(profile, 'permission_condition')
  if (permissionCondition) {
    loops.push(`Permission constraint: ${permissionCondition}`)
  }
  return loops.length ? loops : ['-']
}

function buildConversationHistory(profile: MockCrmProfile) {
  const keyMoments: string[] = []
  const callDate = getProfileField(profile, 'call_date')
  const callOutcome = getProfileField(profile, 'call_outcome')
  const callNextStep = getProfileField(profile, 'call_next_step')

  if (callDate || callOutcome) {
    keyMoments.push(`Past call (${callDate || 'date unknown'}): ${callOutcome || 'outcome unknown'}.`)
  }
  if (callNextStep) {
    keyMoments.push(`Next step: ${callNextStep}.`)
  }

  const breakthroughs = getProfileEntriesByFieldPrefix(profile, 'call_key_insight')
    .slice(0, 3)
    .map((entry) => entry.fieldValue)

  const shifts = [] as string[]
  const emotionShift = getProfileField(profile, 'call_emotion_shift')
  if (emotionShift) {
    shifts.push(emotionShift)
  }

  return {
    keyMoments: keyMoments.length ? keyMoments : ['-'],
    breakthroughs: breakthroughs.length ? breakthroughs : ['-'],
    shifts: shifts.length ? shifts : ['-'],
  }
}

function buildLastTranscriptAnalysis(profile: MockCrmProfile) {
  const currentState = profile.entries
    .filter((entry) => entry.recordType === 'CURRENT_STATE')
    .map((entry) => `${entry.fieldName.replace(/_/g, ' ')}: ${entry.fieldValue}`)

  return {
    summary: currentState.length ? currentState.slice(0, 6) : ['-'],
    intentDetected: getProfileEntriesByFieldPrefix(profile, 'message_type')
      .map((entry) => entry.fieldValue)
      .slice(0, 2),
    solutionsTriggered: getProfileEntriesByFieldPrefix(profile, 'magic_event')
      .map((entry) => entry.fieldValue)
      .slice(0, 2),
  }
}

function inferRole(entries: MockCrmEntry[]): string | undefined {
  const participant = entries.find((entry) => entry.fieldName === 'call_participant_1')
  if (participant?.fieldValue) {
    if (participant.fieldValue.toLowerCase().includes('owner')) {
      return 'Owner'
    }
  }
  return 'Owner / Operator'
}

function deriveExperienceLevel(yearsInBusiness?: string): string | undefined {
  if (!yearsInBusiness) {
    return undefined
  }
  const value = Number.parseFloat(yearsInBusiness)
  if (Number.isNaN(value)) {
    return undefined
  }
  if (value >= 10) {
    return 'Founder / Operator'
  }
  if (value >= 3) {
    return 'Operator'
  }
  return 'Early-stage Operator'
}

function getMetricValue(profile: MockCrmProfile, pattern: RegExp): string | undefined {
  const metrics = collectMetrics(profile.entries)
  for (const [name, value] of Object.entries(metrics)) {
    if (pattern.test(name.toLowerCase())) {
      return value
    }
  }
  return undefined
}

function collectMetrics(entries: MockCrmEntry[]): Record<string, string> {
  const metrics: Record<string, string> = {}
  let currentMetric: string | null = null

  for (const entry of entries) {
    if (entry.fieldName === 'metric_name') {
      currentMetric = entry.fieldValue
      continue
    }

    if (!currentMetric) {
      continue
    }

    if (entry.fieldName === 'metric_value') {
      metrics[currentMetric] = entry.fieldValue
    } else if (entry.fieldName === 'metric_detail') {
      metrics[`${currentMetric} detail`] = entry.fieldValue
    } else if (entry.fieldName === 'metric_interpretation') {
      metrics[`${currentMetric} insight`] = entry.fieldValue
    } else if (entry.fieldName === 'metric_expected') {
      metrics[`${currentMetric} expected`] = entry.fieldValue
    } else if (entry.fieldName === 'metric_gap') {
      metrics[`${currentMetric} gap`] = entry.fieldValue
    } else if (entry.fieldName === 'metric_revenue_lost') {
      metrics['Revenue impact'] = entry.fieldValue
    }
  }

  return metrics
}

function collectConstraints(entries: MockCrmEntry[]) {
  const constraints: Record<string, string[]> = {
    TIME: [],
    MONEY: [],
    TEAM: [],
    AUTHORITY: [],
    ENERGY: [],
  }

  let currentType: string | null = null
  for (const entry of entries) {
    if (entry.fieldName === 'constraint_type') {
      currentType = entry.fieldValue.toUpperCase()
      if (!constraints[currentType]) {
        constraints[currentType] = []
      }
      continue
    }

    if (entry.fieldName === 'constraint_detail' && currentType) {
      constraints[currentType].push(entry.fieldValue)
    }
  }

  return constraints
}

function collectChannels(entries: MockCrmEntry[]) {
  const channels = new Map<
    string,
    { name: string; status?: string; issues: string[]; opportunities: string[] }
  >()
  let current: { name: string; status?: string; issues: string[]; opportunities: string[] } | null = null

  for (const entry of entries) {
    if (entry.fieldName === 'channel_name') {
      const name = entry.fieldValue
      current = channels.get(name) || {
        name,
        issues: [],
        opportunities: [],
      }
      channels.set(name, current)
      continue
    }

    if (!current) {
      continue
    }

    if (entry.fieldName === 'channel_status') {
      current.status = entry.fieldValue
      continue
    }

    if (entry.fieldName === 'channel_issue' || entry.fieldName === 'channel_note') {
      current.issues.push(entry.fieldValue)
      continue
    }

    if (
      entry.fieldName === 'channel_opportunity' ||
      entry.fieldName === 'channel_recommendation'
    ) {
      current.opportunities.push(entry.fieldValue)
    }
  }

  return Array.from(channels.values())
}

function collectTools(entries: MockCrmEntry[]): string[] {
  const tools = new Set<string>()
  for (const entry of entries) {
    if (entry.fieldName === 'channel_name') {
      tools.add(entry.fieldValue)
    }
  }
  return Array.from(tools.values())
}

function inferTeamSize(profile: MockCrmProfile): string {
  const teamConstraints = getProfileEntriesByFieldPrefix(profile, 'constraint_detail')
  const solo = teamConstraints.find((entry) =>
    entry.fieldValue.toLowerCase().includes('solo')
  )
  if (solo) {
    return 'Solo operator'
  }
  return 'Unknown'
}

function inferConfidence(count: number): 'low' | 'medium' | 'high' {
  if (count >= 3) return 'high'
  if (count === 2) return 'medium'
  return 'low'
}

function inferPriority(count: number): 'high' | 'medium' | 'low' {
  if (count >= 3) return 'high'
  if (count === 2) return 'medium'
  return 'low'
}

function formatLines(items: string[]): string {
  const cleaned = items.filter((item) => item && item !== '-')
  if (cleaned.length === 0) {
    return '-'
  }
  return cleaned.map((item) => `- ${item}`).join('\n')
}

function formatLine(value?: string): string {
  if (!value) return '-'
  return `- ${value}`
}

function joinParts(parts: Array<string | undefined>): string | undefined {
  const filtered = parts.filter(Boolean) as string[]
  if (filtered.length === 0) return undefined
  return filtered.join(' | ')
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>()
  const unique: string[] = []
  for (const value of values) {
    if (!value) continue
    if (seen.has(value)) continue
    seen.add(value)
    unique.push(value)
  }
  return unique
}
