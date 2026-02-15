# Breaking Changes - Code Review Fixes

## Orchestrator Response Shape Change

### Change Summary
The orchestrator service response shape changed in commit `940b79c` (centralized logging) and was modified again during code review fixes.

### Old Response (Commit 0faedd4)
```typescript
{
  stage: string,
  objections: any[],
  buyingSignals: any[],
  nextSteps: any[]  // ← REMOVED
}
```

### New Response (Current)
```typescript
SalesOrchestratorResponse {
  stage: string,
  signals: any[],
  objections: any[],
  buyingSignals: any[],
  nextActions: any[],  // ← Renamed from nextSteps
  summary: string,
  metadata: any
}
```

### Migration Required

**Affected Components:**
- `src/components/layout/main-layout.tsx` (UI consumes `nextSteps`)
- Any external API clients expecting old response shape

**Migration Steps:**

1. **Update UI Components:**
   ```typescript
   // OLD
   const { nextSteps } = response;

   // NEW
   const { nextActions: nextSteps } = response;
   // Or rename throughout to nextActions
   ```

2. **Update API Clients:**
   If external clients consume the orchestrator API, they need to:
   - Expect `nextActions` instead of `nextSteps`
   - Handle new fields: `signals`, `summary`, `metadata`

3. **Backward Compatibility Option (if needed):**
   Add a response mapper in `route.ts`:
   ```typescript
   // In src/app/api/orchestrator/route.ts
   const result = await processTranscript(parsed.data);

   // For schema version 1 clients, map to old shape
   if (parsed.data.schemaVersion === 1) {
     return NextResponse.json({
       stage: result.stage,
       objections: result.objections,
       buyingSignals: result.buyingSignals,
       nextSteps: result.nextActions
     });
   }

   // Schema version 2+ gets full response
   return NextResponse.json(result);
   ```

## emitTranscript Parameter Dropped

### Change Summary
The `emitTranscript: true` parameter was passed to `processSalesTranscript()` but is no longer passed.

### Old Code (Commit 0faedd4)
```typescript
const result = await processSalesTranscript({
  sessionId,
  callId,
  text,
  speaker,
  timestamp,
  emitTranscript: true,  // ← REMOVED
});
```

### New Code (Current)
```typescript
const result = await processSalesTranscript({
  text,
  timestamp,
  sessionId,
  speaker,
  callId,
  // emitTranscript removed
});
```

### Impact
The `sales-orchestrator.ts` still checks `if (emitTranscript)` but now defaults to `false` behavior since the parameter is not passed.

**Behavior Change:**
- Transcripts are NO LONGER automatically emitted via WebSocket
- Transcript broadcasting must be handled separately

### Migration Required

**If transcript broadcasting is needed:**

Option 1: Restore `emitTranscript: true` in orchestrator call:
```typescript
const result = await processSalesTranscript({
  text,
  timestamp,
  sessionId,
  speaker,
  callId,
  emitTranscript: true,  // Add back
});
```

Option 2: Handle transcript emission at API layer:
```typescript
// In route.ts after processTranscript
broadcast('transcript', sessionId, {
  text: parsed.data.text,
  speaker: parsed.data.speaker,
  timestamp: parsed.data.timestamp
});
```

## Schema Version Restriction Removed

### Change
Changed from:
```typescript
schemaVersion: z.union([z.literal(1), z.literal(2)]).optional()
```

To:
```typescript
schemaVersion: z.number().optional()
```

### Impact
- **Before:** Only versions 1 and 2 accepted, others rejected with 400 error
- **After:** Any numeric version accepted (forward/backward compatible)

### Migration
No migration needed - this change is backward compatible and more permissive.

---

## Recommendations

1. **For Internal Use:**
   - Update `main-layout.tsx` to use `nextActions` instead of `nextSteps`
   - Decide if transcript emission should be restored

2. **For External API:**
   - Bump API version to v2
   - Provide migration guide for external clients
   - Consider backward compatibility layer (see example above)
   - Document new response shape in API docs

3. **Testing:**
   - Add integration tests for both schema versions
   - Test UI with new response shape
   - Verify transcript emission behavior matches requirements

---

**Generated:** 2026-02-15
**Code Review:** Issue #1 (High-risk: Orchestrator response shape change)
